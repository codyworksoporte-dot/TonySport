// Endpoint handlers. The api/*.js files only bind them to Vercel routes, so the
// contract test can run them offline with a simulated image generator.
import {AI_DEADLINE_MS, NOT_ENABLED_MESSAGE, OUTPUT_LIMIT, QUOTAS, SERVICE_NAME, SERVICE_VERSION} from './config.js';
import {authMode, createImageGenerator, modelChain} from './ai.js';
import {aiInput, readForm} from './form.js';
import {HttpError, endpoint, fail, json} from './http.js';
import {sniffImage} from './images.js';
import {buildPrompt} from './prompts.js';
import {consume} from './quota.js';
import {issueToken, verifyAuthorization} from './session.js';

export function createSessionHandler({env = process.env} = {}) {
  return endpoint(async (request, {origin, ip}) => {
    const [limit, seconds] = QUOTAS.session;
    consume([{key: `session:${ip}`, limit, seconds, message: 'Abriste demasiadas sesiones. Espera unos minutos y vuelve a intentarlo.'}]);
    const {token, expiresAt} = issueToken(Date.now(), env);
    return json({ok: true, sessionToken: token, expiresAt, mock: false}, 200, origin);
  });
}

export function aiQuotas(tokenId, ip) {
  const rule = (key, [limit, seconds], message) => ({key, limit, seconds, message});
  return [
    rule(`ai-token:${tokenId}`, QUOTAS.token, 'Llegaste al límite de imágenes con IA de esta sesión (8 por hora). Tu diseño se conserva; vuelve más tarde.'),
    rule(`ai-ip-hour:${ip}`, QUOTAS.ipHour, 'Se alcanzó el límite de imágenes con IA desde esta conexión. Tu diseño se conserva; vuelve a intentarlo más tarde.'),
    rule(`ai-ip-minute:${ip}`, QUOTAS.ipMinute, 'Espera un minuto antes de pedir otra imagen a la IA. Tu diseño se conserva.'),
  ];
}

const toBase64 = bytes => Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');

/** generate.php, magic_eraser.php and finalize.php share one contract. */
export function createImageHandler(operation, {generateImage, env = process.env} = {}) {
  const generator = generateImage || createImageGenerator({env});
  return endpoint(async (request, {origin, ip}) => {
    const tokenId = verifyAuthorization(request.headers.get('authorization'), Date.now(), env);
    const input = await aiInput(operation, await readForm(request));
    // Quotas count only requests that reach the model.
    consume(aiQuotas(tokenId, ip));
    const prompt = buildPrompt(input);
    const result = await generator({input, prompt, deadline: Date.now() + AI_DEADLINE_MS, signal: request.signal});
    const bytes = result?.bytes instanceof Uint8Array ? result.bytes : null;
    const info = bytes && bytes.length <= OUTPUT_LIMIT ? sniffImage(bytes) : null;
    if (!info) throw new HttpError(502, 'invalid_generated_image', 'La imagen generada no es válida. Conservamos tu diseño; vuelve a intentarlo.');
    return json({
      ok: true,
      success: true,
      image: `data:${info.mime};base64,${toBase64(bytes)}`,
      mime: info.mime,
      provider: result.provider,
      model: result.model,
      fallback_used: result.fallbackUsed === true,
      attempts: Array.isArray(result.attempts) ? result.attempts : [],
    }, 200, origin);
  });
}

/** quote, order, payment and account endpoints are not part of this service yet. */
export function createNotEnabledHandler() {
  return endpoint(async (_request, {origin}) => {
    fail(503, 'not_enabled', NOT_ENABLED_MESSAGE, {retryable: false});
    return json({}, 503, origin);
  }, {methods: ['GET', 'POST'], requireOrigin: false});
}

/** GET / : a quick check after deploying. Reveals no secrets. */
export function createStatusHandler({env = process.env} = {}) {
  return endpoint(async (_request, {origin}) => json({
    ok: true,
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    auth: authMode(env),
    models: modelChain(env),
    endpoints: ['session.php', 'generate.php', 'magic_eraser.php', 'finalize.php'],
    message: 'Servidor de IA de Tony listo. Conecta la web con NEXT_PUBLIC_TONY_API_BASE.',
  }, 200, origin), {methods: ['GET'], requireOrigin: false});
}
