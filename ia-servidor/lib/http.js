// JSON responses, CORS and error handling shared by every endpoint.
import {ALLOWED_ORIGINS} from './config.js';

const RETRYABLE = new Set([429, 502, 503, 504]);

/** An error whose code and Spanish message are safe to show to the customer. */
export class HttpError extends Error {
  constructor(status, code, message, {retryable, retryAfter} = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.retryable = retryable ?? RETRYABLE.has(status);
    this.retryAfter = retryAfter;
  }
}

export function fail(status, code, message, options) {
  throw new HttpError(status, code, message, options);
}

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; sandbox",
};

export function allowedOrigin(request) {
  const origin = request.headers.get('origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : '';
}

function corsHeaders(origin) {
  return origin ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Idempotency-Key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  } : {Vary: 'Origin'};
}

export function json(body, status = 200, origin = '', extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS, ...corsHeaders(origin), ...extra},
  });
}

export function errorBody(error) {
  return {ok: false, success: false, code: error.code, error: error.message, retryable: error.retryable};
}

export function errorResponse(error, origin) {
  const extra = error.retryAfter ? {'Retry-After': String(error.retryAfter)} : {};
  return json(errorBody(error), error.status, origin, extra);
}

/** Vercel overwrites these headers with the real client address. */
export function clientIp(request) {
  const real = (request.headers.get('x-real-ip') || '').trim();
  const forwarded = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const value = real || forwarded || 'local';
  return value.slice(0, 64);
}

/** Reads the raw body with a hard ceiling, without trusting Content-Length. */
export async function readBody(request, limit, tooLarge) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > limit) throw tooLarge();
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      // Stop reading; the platform discards the rest when the response is sent.
      try { reader.releaseLock(); } catch { /* nothing pending */ }
      throw tooLarge();
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

/**
 * Wraps an endpoint: exact-origin CORS, preflight, method check and JSON errors.
 * `requireOrigin: false` lets a request without an allowed Origin through
 * (it still gets no CORS headers).
 */
export function endpoint(handler, {methods = ['POST'], requireOrigin = true} = {}) {
  return {
    async fetch(request) {
      const origin = allowedOrigin(request);
      try {
        if (requireOrigin && !origin) fail(403, 'origin_forbidden', 'Este origen no está autorizado.');
        if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: {...SECURITY_HEADERS, ...corsHeaders(origin)}});
        if (!methods.includes(request.method)) fail(405, 'method_not_allowed', 'Método no permitido.');
        return await handler(request, {origin, ip: clientIp(request)});
      } catch (error) {
        if (error instanceof HttpError) return errorResponse(error, origin);
        // Never expose provider bodies, keys, uploaded images or prompts.
        console.error('[tony-mockup-ia] error interno:', error?.name || 'Error');
        return errorResponse(new HttpError(503, 'service_error', 'No pudimos completar la solicitud. Inténtalo más tarde.'), origin);
      }
    },
  };
}
