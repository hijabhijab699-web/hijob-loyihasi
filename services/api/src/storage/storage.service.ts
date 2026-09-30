import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Local-filesystem storage. Files land under `./uploads/{prefix}/{yyyy-mm}/{uuid}.{ext}`
 * and are served statically by `express.static` (see main.ts). The public URL is
 * always the API's own origin so mobile and web share one config.
 *
 * The interface is deliberately small (save/delete/localPath) so we can swap in
 * a MinIO/S3 driver later without touching callers.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly root: string;
  private readonly publicBase: string;

  constructor(private readonly config: ConfigService) {
    this.root = path.resolve(
      config.get<string>('STORAGE_ROOT') ?? path.join(process.cwd(), 'uploads'),
    );
    // Public base URL for building absolute image URLs (used by mobile + web).
    this.publicBase = (config.get<string>('API_URL') ?? 'http://localhost:4000').replace(/\/$/, '');
  }

  getRoot(): string {
    return this.root;
  }

  async save(
    prefix: string,
    buffer: Buffer,
    mime: string,
    originalName?: string,
  ): Promise<{ url: string; key: string; size: number }> {
    const ext = this.extForMime(mime, originalName);
    if (!ext) throw new Error(`UNSUPPORTED_MIME:${mime}`);

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const uuid = crypto.randomUUID();
    const key = path.posix.join(this.sanitisePrefix(prefix), month, `${uuid}${ext}`);
    const fullPath = path.join(this.root, key);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return {
      key,
      url: `${this.publicBase}/uploads/${key}`,
      size: buffer.length,
    };
  }

  async delete(key: string): Promise<void> {
    const safe = this.sanitiseKey(key);
    if (!safe) return;
    const fullPath = path.join(this.root, safe);
    await fs.unlink(fullPath).catch((err) => {
      if (err.code !== 'ENOENT') this.logger.warn(`delete failed for ${key}: ${err.message}`);
    });
  }

  /**
   * Convert a stored URL back to its key so callers can hand us either shape.
   */
  extractKey(url: string): string | null {
    try {
      const u = new URL(url, this.publicBase);
      const marker = '/uploads/';
      const idx = u.pathname.indexOf(marker);
      if (idx === -1) return null;
      return u.pathname.slice(idx + marker.length);
    } catch {
      return null;
    }
  }

  private extForMime(mime: string, originalName?: string): string | null {
    const m = mime.toLowerCase().split(';')[0]!.trim();
    switch (m) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/heic':
      case 'image/heif':
        return '.heic';
      default:
        // Fall back to the extension of the original filename if it looks safe.
        if (originalName) {
          const dot = originalName.lastIndexOf('.');
          if (dot > -1) {
            const ext = originalName.slice(dot).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return ext;
          }
        }
        return null;
    }
  }

  /**
   * Keep the prefix segment ASCII-safe. Prevents path traversal like `../../etc`.
   */
  private sanitisePrefix(prefix: string): string {
    return prefix
      .split('/')
      .map((seg) => seg.replace(/[^a-zA-Z0-9_-]/g, '_'))
      .filter(Boolean)
      .join('/');
  }

  private sanitiseKey(key: string): string | null {
    const normalised = path.posix.normalize(key);
    if (normalised.startsWith('..') || path.isAbsolute(normalised)) return null;
    return normalised;
  }
}
