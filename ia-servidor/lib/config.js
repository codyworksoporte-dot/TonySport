// Fixed limits and settings of the Tony mockup AI service.

/** Exact browser origins allowed to call the service. No wildcards. */
export const ALLOWED_ORIGINS = Object.freeze([
  'https://codyworksoporte-dot.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

export const MB = 1024 * 1024;
/** Per uploaded file. */
export const FILE_LIMIT = 4 * MB;
/** All uploaded files of one request together. */
export const TOTAL_LIMIT = Math.floor(4.4 * MB);
/** Raw request ceiling: Vercel Functions reject bodies above 4.5 MB. */
export const BODY_LIMIT = Math.floor(4.5 * MB);
export const MAX_PIXELS = 20_000_000;
export const MAX_SIDE = 12_000;
export const MAX_ASSETS = 8;
export const RULES_LIMIT = 4000;
export const SPEC_LIMIT = 3000;
export const META_LIMIT = 4000;
/** Generated images larger than this are rejected (the client accepts up to 12 MB). */
export const OUTPUT_LIMIT = 12_000_000;

export const SESSION_TTL_SECONDS = 8 * 3600;

/** In-memory quotas, best effort per instance: [limit, window in seconds]. */
export const QUOTAS = Object.freeze({
  token: [8, 3600],
  ipHour: [20, 3600],
  ipMinute: [2, 60],
  session: [30, 3600],
});

export const DEFAULT_MODEL = 'google/gemini-3-pro-image';
export const DEFAULT_FALLBACK_MODEL = 'google/gemini-3.1-flash-image';
/** Model ids of the Gemini API, used only with GEMINI_API_KEY. */
export const GEMINI_DIRECT_IDS = Object.freeze({
  'google/gemini-3-pro-image': 'gemini-3-pro-image-preview',
  'google/gemini-3.1-flash-image': 'gemini-3.1-flash-image-preview',
});
/** The browser waits 200 s for an AI answer; stay below it. */
export const AI_DEADLINE_MS = 185_000;
export const ATTEMPT_LIMIT_MS = 120_000;
/** Do not start a fallback call with less time than this left. */
export const MIN_ATTEMPT_MS = 20_000;

export const NOT_ENABLED_MESSAGE = 'El envío de pedidos en línea se activará pronto. Tu diseño queda guardado.';
export const SERVICE_NAME = 'tony-mockup-ia';
export const SERVICE_VERSION = '1.0.0';
