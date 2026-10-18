import { NextResponse } from 'next/server';
import { getProduct } from '@/lib/nestjs';
import {
  composeScarf,
  extractFace,
  type TyingStyle,
  type Pattern,
  type ScarfSpec,
} from '@/lib/ml';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_STYLES: TyingStyle[] = ['classical', 'loose', 'double'];
const ALLOWED_PATTERNS: Pattern[] = ['solid', 'silk', 'chiffon'];

function pickPattern(fabric: string | undefined): Pattern {
  if (!fabric) return 'solid';
  const f = fabric.toLowerCase();
  if (f.includes('shifon') || f.includes('chiffon')) return 'chiffon';
  if (f.includes('ipak') || f.includes('silk')) return 'silk';
  return 'solid';
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Noto'g'ri so'rov" },
      { status: 400 },
    );
  }

  const face = form.get('face');
  if (!(face instanceof Blob) || face.size === 0) {
    return NextResponse.json(
      { ok: false, error: 'Yuz rasmi berilmadi' },
      { status: 400 },
    );
  }
  if (face.size > 12 * 1024 * 1024) {
    return NextResponse.json(
      { ok: false, error: 'Rasm hajmi juda katta (max 12MB)' },
      { status: 413 },
    );
  }

  const styleRaw = String(form.get('style') ?? 'classical');
  const style: TyingStyle = (ALLOWED_STYLES as string[]).includes(styleRaw)
    ? (styleRaw as TyingStyle)
    : 'classical';

  const variantId = form.get('variantId');
  const productId = form.get('productId');
  const colorHexRaw = form.get('colorHex');

  // Resolve color + pattern from the product/variant when possible so the result
  // actually matches what the shopper picked.
  let colorHex = '#D4C3A0';
  let pattern: Pattern = 'solid';
  if (typeof colorHexRaw === 'string' && /^#[0-9A-Fa-f]{6}$/.test(colorHexRaw)) {
    colorHex = colorHexRaw;
  }

  if (typeof productId === 'string' && productId) {
    try {
      const product = await getProduct(productId);
      const fabric =
        typeof product.attributes?.fabric === 'string'
          ? (product.attributes.fabric as string)
          : undefined;
      pattern = pickPattern(fabric);
      if (
        typeof variantId === 'string' &&
        variantId &&
        !colorHexRaw
      ) {
        const variant = product.variants?.find((v) => v.id === variantId);
        if (variant?.colorHex && /^#[0-9A-Fa-f]{6}$/.test(variant.colorHex)) {
          colorHex = variant.colorHex;
        }
      }
    } catch {
      /* product fetch failed — fall back to defaults */
    }
  }

  const patternRaw = String(form.get('pattern') ?? '');
  if ((ALLOWED_PATTERNS as string[]).includes(patternRaw)) {
    pattern = patternRaw as Pattern;
  }

  const spec: ScarfSpec = {
    tying_style: style,
    color_hex: colorHex,
    pattern,
    opacity: 1.0,
  };

  try {
    const front = await extractFace(face);
    const jpeg = await composeScarf(face, front, spec);
    return new NextResponse(jpeg as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store',
        'X-Face-Landmarks': String(front.landmarks_2d.length),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Try-on error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
