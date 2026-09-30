import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface FaceTemplateResponse {
  version: string;
  status: string;
  views: Array<{
    view: 'front' | 'left' | 'right';
    detected: boolean;
    confidence: number;
    landmarks_2d: Array<{ x: number; y: number }>;
    landmarks_3d: Array<{ x: number; y: number; z: number }>;
    bbox?: [number, number, number, number];
    image_size?: [number, number];
  }>;
  skin_tone: { lab: [number, number, number]; hex: string; variance: number };
  proportions: {
    head_width: number;
    head_height: number;
    eye_distance: number;
    chin_to_eyes: number;
    neck_length: number;
    face_aspect_ratio: number;
  };
  head_mask_png_base64: string | null;
  warnings: string[];
}

@Injectable()
export class MlFaceClient {
  private readonly logger = new Logger(MlFaceClient.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>('ML_FACE_URL') ?? 'http://localhost:5001';
  }

  async extractTemplate(files: {
    front: Express.Multer.File;
    left?: Express.Multer.File;
    right?: Express.Multer.File;
  }): Promise<FaceTemplateResponse> {
    const toBlob = (f: Express.Multer.File) =>
      new Blob([new Uint8Array(f.buffer)], { type: f.mimetype });

    const form = new FormData();
    form.append('front', toBlob(files.front), files.front.originalname || 'front.jpg');
    if (files.left) {
      form.append('left', toBlob(files.left), files.left.originalname || 'left.jpg');
    }
    if (files.right) {
      form.append('right', toBlob(files.right), files.right.originalname || 'right.jpg');
    }

    const started = Date.now();
    const res = await fetch(`${this.baseUrl}/face/extract`, {
      method: 'POST',
      body: form,
    });
    const elapsed = Date.now() - started;

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`ml-face returned ${res.status}: ${body}`);
      throw new InternalServerErrorException({
        code: 'ML_FACE_FAILED',
        upstream: res.status,
        detail: body,
      });
    }

    const template = (await res.json()) as FaceTemplateResponse;
    this.logger.log(
      `extracted face template in ${elapsed}ms (warnings=${template.warnings.length})`,
    );
    return template;
  }
}
