/**
 * Procedural fabric shaders for the live try-on overlay.
 *
 * Each shader is a Skia Runtime Effect (SkSL) that paints the scarf polygon
 * with texture appropriate to the fabric: silk gets a directional sheen,
 * chiffon a translucent mesh, satin a soft gradient highlight, jersey a
 * matte micro-noise, crepe a crinkled grain.
 *
 * All uniforms are kept simple so React Native can shuttle them per frame:
 *   - u_color  (vec3)  base BGR tint of the fabric
 *   - u_size   (vec2)  polygon bounds in pixels (for aspect-correct texture)
 *   - u_time   (float) seconds since mount (shimmer animation on silk/satin)
 *   - u_alpha  (float) overall opacity multiplier
 */
import { Skia, type SkRuntimeEffect } from '@shopify/react-native-skia';

export type FabricKind = 'solid' | 'silk' | 'chiffon' | 'satin' | 'jersey' | 'crepe';

const COMMON_UNIFORMS = `
uniform vec3  u_color;
uniform vec2  u_size;
uniform float u_time;
uniform float u_alpha;

// Cheap hash and 2D value noise for the woven textures.
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
`;

/** Silk — subtle diagonal weave + travelling specular highlight. */
const SILK = `${COMMON_UNIFORMS}
vec4 main(vec2 pos) {
  vec2 uv = pos / u_size;
  float weave = sin((uv.x - uv.y) * 480.0) * 0.012;
  // Highlight band travels along the diagonal with time.
  float band = pow(max(0.0, 1.0 - abs((uv.x + uv.y) - (0.5 + 0.3 * sin(u_time * 0.6)))), 24.0);
  vec3 col = u_color + weave + band * 0.22;
  return vec4(col, u_alpha);
}`;

/** Chiffon — translucent fine mesh, slightly lighter near the top. */
const CHIFFON = `${COMMON_UNIFORMS}
vec4 main(vec2 pos) {
  vec2 uv = pos / u_size;
  float mesh = (sin(uv.x * 320.0) * sin(uv.y * 320.0)) * 0.07;
  float drape = (1.0 - uv.y) * 0.04;    // crown slightly brighter
  vec3 col = u_color + mesh + drape;
  // Slightly see-through overall — classic chiffon look.
  return vec4(col, u_alpha * 0.88);
}`;

/** Satin — soft wide highlight, no visible weave. */
const SATIN = `${COMMON_UNIFORMS}
vec4 main(vec2 pos) {
  vec2 uv = pos / u_size;
  float hl = exp(-pow(uv.y - 0.35, 2.0) * 10.0) * 0.18;
  float side = exp(-pow(uv.x - 0.5, 2.0) * 2.0) * 0.08;
  vec3 col = u_color + hl + side;
  return vec4(col, u_alpha);
}`;

/** Jersey — matte, slight micro-noise. */
const JERSEY = `${COMMON_UNIFORMS}
vec4 main(vec2 pos) {
  vec2 uv = pos / u_size;
  float n = (noise(uv * 240.0) - 0.5) * 0.05;
  vec3 col = u_color + n;
  return vec4(col, u_alpha);
}`;

/** Crepe — crinkled surface, more pronounced grain than jersey. */
const CREPE = `${COMMON_UNIFORMS}
vec4 main(vec2 pos) {
  vec2 uv = pos / u_size;
  float n1 = noise(uv * 180.0);
  float n2 = noise(uv * 90.0 + 7.3);
  float grain = (n1 * 0.6 + n2 * 0.4 - 0.5) * 0.09;
  vec3 col = u_color + grain;
  return vec4(col, u_alpha);
}`;

const SOURCES: Record<Exclude<FabricKind, 'solid'>, string> = {
  silk: SILK,
  chiffon: CHIFFON,
  satin: SATIN,
  jersey: JERSEY,
  crepe: CREPE,
};

const CACHE: Partial<Record<FabricKind, SkRuntimeEffect | null>> = {};

/**
 * Compile a fabric's SkSL once. Returns null for "solid" (no shader needed)
 * and null if compilation fails (treat as solid; a warning is logged).
 */
export function getFabricEffect(kind: FabricKind): SkRuntimeEffect | null {
  if (kind === 'solid') return null;
  if (kind in CACHE) return CACHE[kind] ?? null;
  const src = SOURCES[kind];
  const effect = Skia.RuntimeEffect.Make(src);
  if (!effect) {
    // eslint-disable-next-line no-console
    console.warn(`fabric shader "${kind}" failed to compile`);
    CACHE[kind] = null;
    return null;
  }
  CACHE[kind] = effect;
  return effect;
}

/**
 * Translate a seller product's `fabric` attribute string into one of our
 * known kinds. Unknown strings fall back to "solid".
 */
export function fabricKindFromAttribute(attr: unknown): FabricKind {
  if (typeof attr !== 'string') return 'solid';
  const normalised = attr.trim().toLowerCase();
  if (['silk', 'chiffon', 'satin', 'jersey', 'crepe'].includes(normalised)) {
    return normalised as FabricKind;
  }
  return 'solid';
}

/** Convert "#RRGGBB" into the vec3 BGR values the shader expects (0..1). */
export function hexToVec3BGR(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  // Skia uses linear RGB in-shader; the actual Color() paths above also BGR
  // their alpha channel in RN. Passing (b, g, r) matches Skia.Color().
  return [b, g, r];
}
