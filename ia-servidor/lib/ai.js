// Image generation through the AI SDK. On Vercel the AI Gateway authenticates
// with the deployment's OIDC token, so no key is needed. AI_GATEWAY_API_KEY or
// GEMINI_API_KEY are optional alternatives.
import {createGateway, gateway, generateText} from 'ai';
import {createGoogle} from '@ai-sdk/google';
import {ATTEMPT_LIMIT_MS, DEFAULT_FALLBACK_MODEL, DEFAULT_MODEL, GEMINI_DIRECT_IDS, MIN_ATTEMPT_MS} from './config.js';
import {HttpError} from './http.js';
import {assetLabel} from './prompts.js';

const GATEWAY_ID = /^[a-z0-9-]{1,40}\/[a-z0-9][a-z0-9.-]{0,80}$/;
const GEMINI_ID = /^gemini-[a-z0-9.-]{1,80}$/;
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

/** Primary model plus optional fallback (an empty AI_IMAGE_FALLBACK_MODEL disables it). */
export function modelChain(env = process.env) {
  const primary = (env.AI_IMAGE_MODEL || DEFAULT_MODEL).trim();
  const fallback = env.AI_IMAGE_FALLBACK_MODEL === undefined ? DEFAULT_FALLBACK_MODEL : env.AI_IMAGE_FALLBACK_MODEL.trim();
  return [...new Set([primary, fallback].filter(Boolean))];
}

export function authMode(env = process.env) {
  if ((env.AI_GATEWAY_API_KEY || '').trim()) return 'ai-gateway-api-key';
  if ((env.GEMINI_API_KEY || '').trim()) return 'gemini-api-key';
  return 'vercel-oidc';
}

/** The AI SDK model object for a gateway id such as google/gemini-3-pro-image. */
export function resolveModel(id, env = process.env) {
  if (!GATEWAY_ID.test(id)) throw new HttpError(503, 'invalid_model', 'El modelo de imágenes no está configurado correctamente.');
  const mode = authMode(env);
  if (mode === 'gemini-api-key') {
    const direct = (id === env.AI_IMAGE_MODEL && env.GEMINI_IMAGE_MODEL) || (id === env.AI_IMAGE_FALLBACK_MODEL && env.GEMINI_IMAGE_FALLBACK_MODEL) || GEMINI_DIRECT_IDS[id] || id.replace(/^google\//, '');
    if (!GEMINI_ID.test(direct)) throw new HttpError(503, 'invalid_model', 'El modelo de imágenes no está configurado correctamente.');
    return {model: createGoogle({apiKey: env.GEMINI_API_KEY.trim()})(direct), provider: 'google-gemini'};
  }
  if (mode === 'ai-gateway-api-key') return {model: createGateway({apiKey: env.AI_GATEWAY_API_KEY.trim()})(id), provider: 'vercel-ai-gateway'};
  return {model: gateway(id), provider: 'vercel-ai-gateway'};
}

const statusOf = error => Number(error?.statusCode ?? error?.status ?? error?.cause?.statusCode) || 0;
const isAbort = error => error?.name === 'AbortError' || error?.name === 'TimeoutError' || error?.cause?.name === 'TimeoutError';

/** Saturation is the only provider error that justifies trying the fallback model. */
export function isSaturated(error) {
  const status = statusOf(error);
  if ([429, 503, 529].includes(status)) return true;
  const text = `${error?.name || ''} ${error?.type || ''} ${error?.message || ''}`.toLowerCase();
  return /ratelimit|rate_limit|rate limit|overloaded|resource.?exhausted|unavailable|capacity|too many requests/.test(text) && !/credit|insufficient|balance|quota exceeded for (your )?(team|account)/.test(text);
}

class NoImageError extends Error {
  constructor() { super('El modelo no devolvió una imagen.'); this.name = 'NoImageError'; }
}

function publicError(error) {
  if (error instanceof HttpError) return error;
  const status = statusOf(error);
  const text = `${error?.name || ''} ${error?.message || ''}`.toLowerCase();
  if (error instanceof NoImageError) return new HttpError(502, 'no_generated_image', 'La IA no devolvió una imagen esta vez. Conservamos tu diseño; vuelve a intentarlo.');
  if (isSaturated(error)) return new HttpError(503, 'provider_busy', 'La IA está saturada en este momento. Conservamos tu diseño; inténtalo de nuevo en un minuto.', {retryAfter: 60});
  if (status === 402 || /credit|insufficient|balance/.test(text)) return new HttpError(503, 'ai_credits', 'La IA de Tony no tiene saldo disponible por ahora. Tu diseño se conserva; avisa a Tony para reactivarla.');
  if (status === 401 || status === 403 || /oidc|authentication|api key|unauthori/.test(text)) return new HttpError(503, 'not_configured', 'La IA todavía no está configurada en el servidor de Tony.');
  return new HttpError(502, 'ai_error', 'No pudimos generar la imagen. Conservamos tu diseño; vuelve a intentarlo.');
}

function messagesFor(input, prompt) {
  const content = [{type: 'file', mediaType: input.image.mime, data: input.image.bytes}];
  for (const [index, asset] of (input.assets || []).entries()) {
    content.push({type: 'text', text: assetLabel(index, asset)});
    content.push({type: 'file', mediaType: asset.mime, data: asset.bytes});
  }
  content.push({type: 'text', text: prompt});
  return [{role: 'user', content}];
}

/**
 * One call per model; the fallback runs only when the first model is saturated
 * or answers without an image. Dependencies are injectable for offline tests.
 */
export function createImageGenerator({generate = generateText, resolve = resolveModel, env = process.env, now = Date.now} = {}) {
  return async function generateImage({input, prompt, deadline, signal}) {
    const chain = modelChain(env);
    const attempts = [];
    let lastError = null;
    for (const [index, id] of chain.entries()) {
      const remaining = deadline - now();
      if (index > 0 && remaining < MIN_ATTEMPT_MS) break;
      const {model, provider} = resolve(id, env);
      const signals = [AbortSignal.timeout(Math.max(1000, Math.min(ATTEMPT_LIMIT_MS, remaining)))];
      if (signal) signals.push(signal);
      try {
        const result = await generate({
          model,
          messages: messagesFor(input, prompt),
          maxRetries: 0,
          abortSignal: AbortSignal.any(signals),
          providerOptions: {google: {responseModalities: ['TEXT', 'IMAGE'], imageConfig: {aspectRatio: '3:4', imageSize: '1K'}}},
        });
        const file = [...(result?.files || [])].reverse().find(item => IMAGE_TYPES.has(item?.mediaType) && item.uint8Array?.length);
        if (!file) throw new NoImageError();
        attempts.push({model: id, status: 200});
        return {bytes: file.uint8Array, mime: file.mediaType, provider, model: id, fallbackUsed: index > 0, attempts};
      } catch (error) {
        if (isAbort(error)) {
          attempts.push({model: id, status: 504});
          // An uncertain timeout never triggers a second paid call.
          throw new HttpError(504, 'ai_timeout', 'La IA tardó más de lo esperado. Tu diseño se conserva; vuelve a intentarlo en unos minutos.');
        }
        const status = error instanceof NoImageError ? 422 : statusOf(error) || 500;
        attempts.push({model: id, status});
        console.error(`[tony-mockup-ia] ${id} falló (${status}): ${error?.name || 'Error'}`);
        lastError = error;
        if (!(error instanceof NoImageError || isSaturated(error))) throw publicError(error);
      }
    }
    throw publicError(lastError || new NoImageError());
  };
}
