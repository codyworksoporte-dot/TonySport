// Stateless session tokens: 64 hex = 12-byte nonce + 4-byte expiry + 16-byte HMAC.
// No database is needed and a token can only come from session.php.
import {createHash, createHmac, randomBytes, timingSafeEqual} from 'node:crypto';
import {SESSION_TTL_SECONDS} from './config.js';
import {fail} from './http.js';

let processSecret = null;

/**
 * SESSION_SECRET (32+ characters) when configured. Otherwise a value derived
 * from this deployment, shared by all its instances; tokens then end with a
 * new deployment and the browser simply opens another session.
 */
export function sessionSecret(env = process.env) {
  const configured = (env.SESSION_SECRET || '').trim();
  if (configured.length >= 32) return configured;
  const seed = [env.VERCEL_PROJECT_ID, env.VERCEL_DEPLOYMENT_ID, env.VERCEL_URL, env.AI_GATEWAY_API_KEY, env.GEMINI_API_KEY].filter(Boolean).join('|');
  if (seed) return createHash('sha256').update(`tony-mockup-ia|${seed}`).digest('hex');
  // Local process only.
  processSecret ??= randomBytes(32).toString('hex');
  return processSecret;
}

function mac(secret, payload) {
  return createHmac('sha256', secret).update(payload).digest().subarray(0, 16);
}

export function issueToken(now = Date.now(), env = process.env) {
  const nonce = randomBytes(12);
  const expires = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const expiry = Buffer.alloc(4);
  expiry.writeUInt32BE(expires);
  const payload = Buffer.concat([nonce, expiry]);
  const token = Buffer.concat([payload, mac(sessionSecret(env), payload)]).toString('hex');
  return {token, expiresAt: new Date(expires * 1000).toISOString()};
}

/** Returns a stable id for quotas; throws 401 for a missing, forged or expired token. */
export function verifyAuthorization(header, now = Date.now(), env = process.env) {
  const match = /^Bearer ([a-f0-9]{64})$/.exec(header || '');
  if (!match) fail(401, 'unauthorized', 'Vuelve a abrir tu sesión de pedido.');
  const bytes = Buffer.from(match[1], 'hex');
  const payload = bytes.subarray(0, 16);
  const expected = mac(sessionSecret(env), payload);
  if (!timingSafeEqual(expected, bytes.subarray(16))) fail(401, 'unauthorized', 'Tu sesión no es válida. Vuelve a intentarlo para abrir otra.');
  if (payload.readUInt32BE(12) * 1000 < now) fail(401, 'session_expired', 'Tu sesión venció. Vuelve a intentarlo para abrir otra.');
  return createHash('sha256').update(match[1]).digest('hex').slice(0, 32);
}
