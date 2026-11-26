// Offline contract test: node test/contrato.mjs
// No network and no keys: the image model is simulated and fetch is blocked.
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {test} from 'node:test';

globalThis.fetch = async () => { throw new Error('La prueba de contrato no puede usar la red.'); };

const {aiQuotas, createImageHandler, createNotEnabledHandler, createSessionHandler, createStatusHandler} = await import('../lib/handlers.js');
const {createImageGenerator, isSaturated, modelChain} = await import('../lib/ai.js');
const {issueToken, verifyAuthorization} = await import('../lib/session.js');
const {consume, resetQuotas} = await import('../lib/quota.js');
const {sniffImage} = await import('../lib/images.js');
const {TEXT} = await import('../lib/prompt-text.js');
const {erasePrompt, finalizePrompt, generatePrompt} = await import('../lib/prompts.js');
const {HttpError} = await import('../lib/http.js');

const ORIGIN = 'https://codyworksoporte-dot.github.io';
const MESSAGE = 'El envío de pedidos en línea se activará pronto. Tu diseño queda guardado.';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEElEQVQImWMQtVCFIwbiOAC4dAchXMJVdAAAAABJRU5ErkJggg==', 'base64');
// Minimal JPEG (SOF0 160x120) and WebP (VP8X 200x100) headers; the service reads only headers.
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x78, 0x00, 0xa0, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9]);
const WEBP = Buffer.from([...Buffer.from('RIFF'), 0x24, 0, 0, 0, ...Buffer.from('WEBPVP8X'), 0x0a, 0, 0, 0, 0x10, 0, 0, 0, 0xc7, 0, 0, 0x63, 0, 0, 0, 0, 0, 0]);
const padded = (bytes, size) => Buffer.concat([bytes, Buffer.alloc(Math.max(0, size - bytes.length))]);

const calls = [];
const fakeGenerator = async ({input, prompt, deadline}) => {
  calls.push({input, prompt, deadline});
  return {bytes: new Uint8Array(PNG), mime: 'image/png', provider: 'vercel-ai-gateway', model: 'google/gemini-3-pro-image', fallbackUsed: false, attempts: [{model: 'google/gemini-3-pro-image', status: 200}]};
};
const env = {SESSION_SECRET: 'x'.repeat(40)};
const session = createSessionHandler({env});
const generate = createImageHandler('generate', {generateImage: fakeGenerator, env});
const eraser = createImageHandler('magic_eraser', {generateImage: fakeGenerator, env});
const finalize = createImageHandler('finalize', {generateImage: fakeGenerator, env});
const notEnabled = createNotEnabledHandler();
const status = createStatusHandler({env: {}});

let ipCounter = 0;
const freshIp = () => `203.0.113.${(ipCounter++ % 250) + 1}`;

function call(handler, path, {method = 'POST', origin = ORIGIN, headers = {}, body, ip = freshIp()} = {}) {
  const all = new Headers(headers);
  if (origin) all.set('origin', origin);
  all.set('x-real-ip', ip);
  return handler.fetch(new Request(`https://tony-mockup-ia.test${path}`, {method, headers: all, body, ...(body instanceof ReadableStream ? {duplex: 'half'} : {})}));
}

async function token(ip) {
  const response = await call(session, '/session.php', {body: '{}', headers: {'content-type': 'application/json'}, ip});
  return (await response.json()).sessionToken;
}

function form(fields = {}, files = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  for (const [key, list] of Object.entries(files)) for (const [bytes, type, name] of list) data.append(key, new Blob([bytes], {type}), name);
  return data;
}

async function ai(handler, path, data, {auth, ip = freshIp()} = {}) {
  const bearer = auth ?? await token(ip);
  return call(handler, path, {body: data, headers: bearer ? {authorization: `Bearer ${bearer}`} : {}, ip});
}

async function expectError(response, status, code) {
  const body = await response.json();
  assert.equal(response.status, status, JSON.stringify(body));
  assert.equal(body.ok, false);
  assert.equal(body.success, false);
  assert.equal(body.code, code);
  assert.equal(typeof body.error, 'string');
  assert.equal(typeof body.retryable, 'boolean');
  return body;
}

test('session.php entrega un token de 64 hex, vencimiento y mock:false', async () => {
  resetQuotas();
  const response = await call(session, '/session.php', {body: '{}', headers: {'content-type': 'application/json'}});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.mock, false);
  assert.match(body.sessionToken, /^[a-f0-9]{64}$/);
  assert.ok(Date.parse(body.expiresAt) > Date.now() + 7 * 3600 * 1000);
  assert.equal(typeof verifyAuthorization(`Bearer ${body.sessionToken}`, Date.now(), env), 'string');
});

test('los tokens alterados, ajenos o vencidos se rechazan con 401', () => {
  const {token: valid} = issueToken(Date.now(), env);
  const flipped = valid.slice(0, 63) + (valid[63] === 'a' ? 'b' : 'a');
  for (const header of ['', 'Bearer abc', `Basic ${valid}`, `Bearer ${valid.toUpperCase()}`, `Bearer ${flipped}`, `Bearer ${'0'.repeat(64)}`]) {
    assert.throws(() => verifyAuthorization(header, Date.now(), env), error => error instanceof HttpError && error.status === 401);
  }
  const old = issueToken(Date.now() - 9 * 3600 * 1000, env).token;
  assert.throws(() => verifyAuthorization(`Bearer ${old}`, Date.now(), env), error => error.code === 'session_expired');
  assert.throws(() => verifyAuthorization(`Bearer ${valid}`, Date.now(), {SESSION_SECRET: 'y'.repeat(40)}), error => error.status === 401);
});

test('CORS: solo los tres orígenes exactos y preflight con los encabezados del cliente', async () => {
  resetQuotas();
  for (const origin of [ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000']) {
    const response = await call(generate, '/generate.php', {method: 'OPTIONS', origin, headers: {'access-control-request-method': 'POST', 'access-control-request-headers': 'authorization,content-type'}});
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    for (const header of ['Authorization', 'Content-Type', 'Idempotency-Key']) assert.ok(response.headers.get('access-control-allow-headers').includes(header));
    assert.ok(response.headers.get('access-control-allow-methods').includes('POST'));
    assert.equal(response.headers.get('vary'), 'Origin');
  }
  for (const origin of ['https://evil.example', 'https://codyworksoporte-dot.github.io.evil.example', 'http://localhost:3001', 'null', '']) {
    const response = await call(session, '/session.php', {origin, body: '{}'});
    await expectError(response, 403, 'origin_forbidden');
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
});

test('las llamadas de IA exigen Authorization: Bearer de 64 hex emitido por session.php', async () => {
  resetQuotas();
  const data = () => form({side: 'front', product: 'uniform'}, {image: [[PNG, 'image/png', 'design.png']]});
  await expectError(await ai(generate, '/generate.php', data(), {auth: ''}), 401, 'unauthorized');
  await expectError(await ai(generate, '/generate.php', data(), {auth: 'f'.repeat(64)}), 401, 'unauthorized');
  const response = await ai(generate, '/generate.php', data());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
});

test('generate.php responde con el contrato exacto de imagen', async () => {
  resetQuotas(); calls.length = 0;
  const spec = {product: 'uniform', gender: 'Hombre', mold: 'Estándar', fabric: 'Slim Fit', collar: 'Redondo', sleeve: 'Corta', brand: 'Tony', brand3d: false, crest3d: false, catalogCode: 'TONY-012', catalogLine: 'Fútbol', source: 'catalog'};
  const response = await ai(generate, '/generate.php', form({side: 'front', product: 'uniform', placementRules: 'CONFIGURACIÓN OBLIGATORIA: Cuello Redondo.', spec: JSON.stringify(spec)}, {image: [[JPEG, 'image/jpeg', 'design.jpg']]}));
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.deepEqual(Object.keys(body).sort(), ['attempts', 'fallback_used', 'image', 'mime', 'model', 'ok', 'provider', 'success']);
  assert.equal(body.ok, true);
  assert.equal(body.success, true);
  assert.equal(body.mime, 'image/png');
  assert.ok(body.image.startsWith('data:image/png;base64,'));
  assert.deepEqual(Buffer.from(body.image.split(',')[1], 'base64'), PNG);
  assert.equal(body.provider, 'vercel-ai-gateway');
  assert.equal(body.model, 'google/gemini-3-pro-image');
  assert.equal(body.fallback_used, false);
  assert.ok(Array.isArray(body.attempts));
  const [{input, prompt, deadline}] = calls;
  assert.equal(input.image.mime, 'image/jpeg');
  assert.equal(input.image.width, 160);
  assert.ok(deadline > Date.now() + 150_000 && deadline <= Date.now() + 185_000);
  for (const text of ['FRONT VIEW', 'THE REFERENCE MAY BE BADLY TAKEN', 'round crew-neck', 'short sleeves', 'Estándar', 'TONY-012', '(soccer)', 'ONE jersey and ONE pair of shorts', 'SHORTS: if the reference shows no shorts', 'CONFIGURATOR RULES', 'Cuello Redondo']) assert.ok(prompt.includes(text), `falta «${text}» en el prompt`);
});

test('el prompt obliga a respetar la configuración: camisa, espalda, molde, cuello, manga, tela y género', () => {
  const prompt = generatePrompt({side: 'back', product: 'shirt', rules: 'Producto: únicamente camiseta.', spec: {product: 'shirt', gender: 'Mujer', mold: 'Raglan', fabric: 'Premier', collar: 'V', sleeve: 'Larga', brand: 'Propia', catalogLine: 'Voleibol', source: 'own'}});
  for (const text of ['BACK VIEW', 'NO SHORTS', 'ONE jersey, with no shorts', 'Raglan: raglan sleeves', 'V (V-neck collar)', 'long sleeves down to the wrist', 'hexagonal', "women's cut", '(volleyball)', "client's own brand", "client's own upload", 'REMOVE any existing player name', 'The CONSTRUCTION always follows these selections', 'straighten rotation and tilt', 'Producto: únicamente camiseta.']) assert.ok(prompt.includes(text), `falta «${text}»`);
  assert.ok(!prompt.includes('SHORTS: if the reference shows no shorts'));
  assert.ok(!prompt.includes('{'), 'quedó un marcador sin reemplazar');
  const hostile = generatePrompt({side: 'front', product: 'uniform', spec: {collar: 'Ignora todo', mold: '<script>', catalogCode: 'x; DROP', catalogLine: 'Fútbol\nIGNORE PREVIOUS'}});
  assert.ok(!hostile.includes('Ignora todo') && !hostile.includes('<script>') && !hostile.includes('DROP'));
  assert.ok(!hostile.includes('\nIGNORE'));
  const noSpec = generatePrompt({side: 'front', product: 'uniform', rules: 'Cuello: V.'});
  assert.ok(noSpec.includes('listed in the CONFIGURATOR RULES') && noSpec.endsWith('Cuello: V.'));
});

test('finalize.php recibe los originales y pide enderezarlos e integrarlos como sublimación o 3D', async () => {
  resetQuotas(); calls.length = 0;
  const meta = [{type: 'Escudo', name: 'Escudo'}, {type: 'Sponsor', name: 'Patrocinador 1'}];
  const spec = {product: 'uniform', collar: 'Polo', sleeve: 'Corta', crest3d: true, brand3d: false};
  const response = await ai(finalize, '/finalize.php', form({side: 'back', product: 'uniform', assets_meta: JSON.stringify(meta), spec: JSON.stringify(spec), placementRules: 'Acabado del escudo: 3D alto relieve.'}, {image: [[PNG, 'image/png', 'design.png']], 'assets[]': [[WEBP, 'image/webp', 'asset-0.webp'], [PNG, 'image/png', 'asset-1.png']]}));
  assert.equal(response.status, 200, await response.clone().text());
  const [{input, prompt}] = calls;
  assert.equal(input.assets.length, 2);
  assert.deepEqual(input.assets.map(asset => [asset.type, asset.name, asset.mime]), [['Escudo', 'Escudo', 'image/webp'], ['Sponsor', 'Patrocinador 1', 'image/png']]);
  for (const text of ['BACK VIEW', 'ORIGINAL FILES', 'Straighten it', 'drop any box', 'Seat it in its zone', 'flat full-sublimation', 'Crest finish: 3D high relief', 'Sports-brand finish: flat sublimation', 'Polo (fold-down polo collar', 'Acabado del escudo: 3D alto relieve.']) assert.ok(prompt.includes(text), `falta «${text}»`);
  assert.ok(finalizePrompt({side: 'front', product: 'shirt'}).includes('collar and sleeves.'));
});

test('magic_eraser.php valida la región y la describe en el prompt', async () => {
  resetQuotas(); calls.length = 0;
  const ok = await ai(eraser, '/magic_eraser.php', form({side: 'front', x: '0.1', y: '0.2', w: '0.3', h: '0.25'}, {image: [[PNG, 'image/png', 'design.png']]}));
  assert.equal(ok.status, 200);
  assert.ok(calls[0].prompt.includes('left=0.1000, top=0.2000, width=0.3000, height=0.2500'));
  assert.ok(erasePrompt({side: 'back', region: {x: 0, y: 0, w: 1, h: 1}}).includes('in back view'));
  for (const region of [{x: '-0.1', y: '0', w: '0.2', h: '0.2'}, {x: '0.9', y: '0', w: '0.2', h: '0.2'}, {x: '0.1', y: '0.1', w: '0', h: '0.2'}, {x: 'a', y: '0', w: '0.2', h: '0.2'}, {x: '0.1', y: '0.1', w: '0.2'}]) {
    await expectError(await ai(eraser, '/magic_eraser.php', form({side: 'front', ...region}, {image: [[PNG, 'image/png', 'design.png']]})), 422, 'invalid_region');
  }
});

test('multipart: tipo, campos, archivos falsos y archivos inesperados', async () => {
  resetQuotas();
  const t = await token('198.51.100.7');
  const send = (handler, path, data, headers = {}) => call(handler, path, {body: data, headers: {authorization: `Bearer ${t}`, ...headers}, ip: freshIp()});
  await expectError(await send(generate, '/generate.php', JSON.stringify({image: 'x'}), {'content-type': 'application/json'}), 415, 'content_type');
  await expectError(await send(generate, '/generate.php', form({side: 'front'})), 400, 'image_required');
  await expectError(await send(generate, '/generate.php', form({}, {image: [[Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), 'image/png', 'falso.png']]})), 422, 'invalid_image');
  await expectError(await send(generate, '/generate.php', form({}, {image: [[Buffer.from('GIF89a........................'), 'image/gif', 'a.gif']]})), 422, 'invalid_image');
  await expectError(await send(generate, '/generate.php', form({}, {image: [[PNG, 'image/png', 'a.png']], otro: [[PNG, 'image/png', 'b.png']]})), 400, 'unexpected_upload');
  await expectError(await send(generate, '/generate.php', form({}, {image: [[PNG, 'image/png', 'a.png']], 'assets[]': [[PNG, 'image/png', 'b.png']]})), 400, 'unexpected_upload');
  await expectError(await send(generate, '/generate.php', form({side: 'left'}, {image: [[PNG, 'image/png', 'a.png']]})), 422, 'invalid_choice');
  await expectError(await send(generate, '/generate.php', form({product: 'socks'}, {image: [[PNG, 'image/png', 'a.png']]})), 422, 'invalid_choice');
  await expectError(await send(generate, '/generate.php', form({spec: '{roto'}, {image: [[PNG, 'image/png', 'a.png']]})), 422, 'invalid_spec');
  await expectError(await send(generate, '/generate.php', form({placementRules: 'x'.repeat(4001)}, {image: [[PNG, 'image/png', 'a.png']]})), 422, 'too_long');
  const nine = Array.from({length: 9}, (_, index) => [PNG, 'image/png', `asset-${index}.png`]);
  await expectError(await send(finalize, '/finalize.php', form({assets_meta: '[]'}, {image: [[PNG, 'image/png', 'a.png']], 'assets[]': nine})), 400, 'too_many_assets');
  await expectError(await send(finalize, '/finalize.php', form({assets_meta: '{"no":"lista"}'}, {image: [[PNG, 'image/png', 'a.png']], 'assets[]': [[PNG, 'image/png', 'b.png']]})), 422, 'invalid_assets');
  await expectError(await call(generate, '/generate.php', {method: 'GET', headers: {authorization: `Bearer ${t}`}}), 405, 'method_not_allowed');
});

test('límites: 4 MB por archivo, 4,4 MB en total y 4,5 MB de cuerpo sin Content-Length', async () => {
  resetQuotas();
  const t = await token('198.51.100.8');
  const send = (handler, path, data) => call(handler, path, {body: data, headers: {authorization: `Bearer ${t}`}, ip: freshIp()});
  await expectError(await send(generate, '/generate.php', form({}, {image: [[padded(PNG, 4 * 1024 * 1024 + 1), 'image/png', 'grande.png']]})), 413, 'too_large');
  await expectError(await send(finalize, '/finalize.php', form({assets_meta: '[{"type":"Escudo","name":"a"}]'}, {image: [[padded(PNG, 3 * 1024 * 1024), 'image/png', 'a.png']], 'assets[]': [[padded(PNG, 1.5 * 1024 * 1024), 'image/png', 'b.png']]})), 413, 'too_large');
  const ok = await send(finalize, '/finalize.php', form({assets_meta: '[{"type":"Escudo","name":"a"}]'}, {image: [[padded(PNG, 3 * 1024 * 1024), 'image/png', 'a.png']], 'assets[]': [[padded(PNG, 1024 * 1024), 'image/png', 'b.png']]}));
  assert.equal(ok.status, 200, await ok.clone().text());
  // Declared length above 4.5 MB, and a streamed body without Content-Length.
  await expectError(await call(generate, '/generate.php', {body: new Uint8Array(4.6 * 1024 * 1024), headers: {authorization: `Bearer ${t}`, 'content-type': 'multipart/form-data; boundary=abc'}}), 413, 'too_large');
  const chunk = new Uint8Array(256 * 1024);
  let sent = 0;
  const stream = new ReadableStream({pull(controller) { if (sent >= 6 * 1024 * 1024) controller.close(); else { sent += chunk.length; controller.enqueue(chunk.slice()); } }});
  await expectError(await call(generate, '/generate.php', {body: stream, headers: {authorization: `Bearer ${t}`, 'content-type': 'multipart/form-data; boundary=abc'}}), 413, 'too_large');
  assert.ok(sent < 6 * 1024 * 1024, 'el servidor dejó de leer al superar el límite');
});

test('cuotas en memoria: 2 por minuto por IP, 8 por hora por token y 20 por hora por IP', async () => {
  resetQuotas();
  const data = () => form({}, {image: [[PNG, 'image/png', 'a.png']]});
  const ip = '192.0.2.10';
  const t = await token(ip);
  const send = (bearer, from) => call(generate, '/generate.php', {body: data(), headers: {authorization: `Bearer ${bearer}`}, ip: from});
  assert.equal((await send(t, ip)).status, 200);
  assert.equal((await send(t, ip)).status, 200);
  const limited = await send(t, ip);
  await expectError(limited, 429, 'rate_limit');
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
  resetQuotas();
  const shared = await token('192.0.2.11');
  for (let index = 0; index < 8; index++) assert.equal((await send(shared, `192.0.2.${20 + index}`)).status, 200);
  await expectError(await send(shared, '192.0.2.40'), 429, 'rate_limit');
  // 20 per hour per IP: one call every 61 s (new minute window) with a new session each time.
  resetQuotas();
  const start = Date.now();
  for (let index = 0; index < 20; index++) consume(aiQuotas(`sesion-${index}`, '192.0.2.50'), start + index * 61_000);
  assert.throws(() => consume(aiQuotas('sesion-21', '192.0.2.50'), start + 20 * 61_000), error => error.status === 429 && error.code === 'rate_limit');
  assert.doesNotThrow(() => consume(aiQuotas('sesion-22', '192.0.2.50'), start + 3601_000));
  resetQuotas();
});

test('endpoints de pedidos, pagos y cuentas: 503 not_enabled con el mensaje acordado', async () => {
  for (const [method, path] of [['POST', '/quote.php'], ['POST', '/tony-submit-order.php'], ['POST', '/wompi-crear-pago.php'], ['GET', '/wompi-verificar.php?order=TONY-1'], ['GET', '/order.php?id=TONY-1'], ['POST', '/auth.php']]) {
    const response = await call(notEnabled, path, {method, body: method === 'POST' ? '{}' : undefined, headers: method === 'POST' ? {'content-type': 'application/json'} : {}});
    const body = await expectError(response, 503, 'not_enabled');
    assert.equal(body.error, MESSAGE);
    assert.equal(body.retryable, false);
    assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  }
  const preflight = await call(notEnabled, '/quote.php', {method: 'OPTIONS'});
  assert.equal(preflight.status, 204);
  const webhook = await call(notEnabled, '/wompi-webhook.php', {origin: '', body: '{}'});
  await expectError(webhook, 503, 'not_enabled');
});

test('GET / informa el estado sin secretos', async () => {
  const response = await call(status, '/', {method: 'GET', origin: ''});
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.auth, 'vercel-oidc');
  assert.deepEqual(body.models, ['google/gemini-3-pro-image', 'google/gemini-3.1-flash-image']);
  assert.ok(!JSON.stringify(body).includes('x'.repeat(40)));
});

test('una imagen generada inválida no llega al navegador', async () => {
  resetQuotas();
  const broken = createImageHandler('generate', {env, generateImage: async () => ({bytes: new TextEncoder().encode('no es imagen'), mime: 'image/png', provider: 'x', model: 'y', attempts: []})});
  await expectError(await ai(broken, '/generate.php', form({}, {image: [[PNG, 'image/png', 'a.png']]})), 502, 'invalid_generated_image');
});

// ---- Model chain with a simulated AI SDK ----
const okResult = {files: [{mediaType: 'image/png', uint8Array: new Uint8Array(PNG)}], text: ''};
const input = {operation: 'generate', image: {bytes: new Uint8Array(PNG), mime: 'image/png'}, assets: [{bytes: new Uint8Array(PNG), mime: 'image/png', type: 'Escudo', name: 'Escudo'}]};
function chain(responses, extraEnv = {}) {
  const seen = [];
  const generate = async options => { seen.push(options); const next = responses.shift(); if (next instanceof Error) throw next; return next; };
  const generator = createImageGenerator({generate, resolve: id => ({model: `modelo:${id}`, provider: 'vercel-ai-gateway'}), env: extraEnv});
  return {seen, run: () => generator({input, prompt: 'PROMPT', deadline: Date.now() + 185_000})};
}
const providerError = (statusCode, message = 'error') => Object.assign(new Error(message), {statusCode});

test('IA: una llamada por modelo con salida de imagen y opciones de Google', async () => {
  const {seen, run} = chain([okResult]);
  const result = await run();
  assert.equal(seen.length, 1);
  assert.equal(seen[0].model, 'modelo:google/gemini-3-pro-image');
  assert.equal(seen[0].maxRetries, 0);
  assert.deepEqual(seen[0].providerOptions.google.responseModalities, ['TEXT', 'IMAGE']);
  assert.deepEqual(seen[0].providerOptions.google.imageConfig, {aspectRatio: '3:4', imageSize: '1K'});
  const content = seen[0].messages[0].content;
  assert.deepEqual(content.map(part => part.type), ['file', 'text', 'file', 'text']);
  assert.equal(content[0].mediaType, 'image/png');
  assert.ok(content[1].text.startsWith('Original file 1: crest (escudo)'));
  assert.equal(content.at(-1).text, 'PROMPT');
  assert.ok(seen[0].abortSignal instanceof AbortSignal);
  assert.equal(result.fallbackUsed, false);
  assert.deepEqual(result.attempts, [{model: 'google/gemini-3-pro-image', status: 200}]);
});

test('IA: el respaldo solo se usa si el primero está saturado o no devuelve imagen', async () => {
  let run = chain([providerError(429, 'Rate limit exceeded'), okResult]);
  let result = await run.run();
  assert.equal(result.model, 'google/gemini-3.1-flash-image');
  assert.equal(result.fallbackUsed, true);
  assert.deepEqual(result.attempts.map(item => item.status), [429, 200]);
  run = chain([{files: [], text: 'No puedo'}, okResult]);
  result = await run.run();
  assert.equal(result.fallbackUsed, true);
  assert.deepEqual(result.attempts.map(item => item.status), [422, 200]);
  run = chain([providerError(400, 'Invalid request'), okResult]);
  await assert.rejects(run.run(), error => error instanceof HttpError && error.code === 'ai_error' && error.status === 502);
  assert.equal(run.seen.length, 1);
  run = chain([providerError(503, 'overloaded'), providerError(503, 'overloaded')]);
  await assert.rejects(run.run(), error => error.code === 'provider_busy' && error.status === 503);
  run = chain([providerError(401, 'Unauthenticated'), okResult]);
  await assert.rejects(run.run(), error => error.code === 'not_configured');
  assert.equal(run.seen.length, 1);
  run = chain([Object.assign(new Error('timeout'), {name: 'TimeoutError'}), okResult]);
  await assert.rejects(run.run(), error => error.code === 'ai_timeout' && error.status === 504);
  assert.equal(run.seen.length, 1, 'un timeout incierto no lanza otra llamada pagada');
  run = chain([providerError(402, 'Insufficient credits'), okResult]);
  await assert.rejects(run.run(), error => error.code === 'ai_credits');
  run = chain([providerError(429), okResult], {AI_IMAGE_FALLBACK_MODEL: ''});
  await assert.rejects(run.run(), error => error.code === 'provider_busy');
  assert.equal(run.seen.length, 1);
  assert.equal(isSaturated(providerError(500, 'Insufficient credit balance')), false);
});

test('IA: cadena de modelos configurable por variables de entorno', () => {
  assert.deepEqual(modelChain({}), ['google/gemini-3-pro-image', 'google/gemini-3.1-flash-image']);
  assert.deepEqual(modelChain({AI_IMAGE_MODEL: 'google/gemini-3.1-flash-image'}), ['google/gemini-3.1-flash-image']);
  assert.deepEqual(modelChain({AI_IMAGE_FALLBACK_MODEL: ''}), ['google/gemini-3-pro-image']);
});

test('detección de imágenes por contenido', () => {
  assert.deepEqual(sniffImage(new Uint8Array(PNG)), {mime: 'image/png', width: 4, height: 4});
  assert.deepEqual(sniffImage(new Uint8Array(JPEG)), {mime: 'image/jpeg', width: 160, height: 120});
  assert.deepEqual(sniffImage(new Uint8Array(WEBP)), {mime: 'image/webp', width: 200, height: 100});
  assert.equal(sniffImage(new TextEncoder().encode('<svg></svg>.............')), null);
});

test('vercel.json enruta cada .php del cliente a una función existente', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const routes = Object.fromEntries(config.rewrites.map(rule => [rule.source, rule.destination]));
  const expected = {'/session.php': '/api/session', '/generate.php': '/api/generate', '/magic_eraser.php': '/api/magic_eraser', '/finalize.php': '/api/finalize'};
  for (const [source, destination] of Object.entries(expected)) assert.equal(routes[source], destination);
  for (const name of ['quote', 'tony-submit-order', 'wompi-crear-pago', 'wompi-verificar', 'wompi-retorno', 'wompi-webhook', 'order', 'auth']) assert.equal(routes[`/${name}.php`], '/api/no-disponible');
  for (const destination of new Set(Object.values(routes))) assert.ok(existsSync(new URL(`..${destination}.js`, import.meta.url)), `${destination}.js no existe`);
  for (const file of Object.keys(config.functions)) assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), `${file} no existe`);
  assert.ok(config.functions['api/generate.js'].maxDuration >= 200);
});

test('las comprobaciones de backend/tests/run.php se cumplen con la misma composición', () => {
  const shirt = generatePrompt({side: 'front', product: 'shirt'});
  assert.ok(!shirt.includes('ONE MATCHING PAIR') && !shirt.includes('TWO GARMENTS') && shirt.includes('NO SHORTS'));
  const shirtFinal = finalizePrompt({side: 'back', product: 'shirt'});
  assert.ok(!shirtFinal.includes('UNA camisa y UNA') && shirtFinal.includes('sin calzoneta'));
  assert.ok(finalizePrompt({side: 'front', product: 'uniform'}).includes('UNA camisa y UNA sola calzoneta'));
});

test('prompts.php del backend PHP contiene los mismos textos', () => {
  const php = new URL('../../backend/pedido-api/prompts.php', import.meta.url);
  if (!existsSync(php)) return; // Standalone copy of ia-servidor: nothing to compare.
  const source = readFileSync(php, 'utf8').replace(/\r\n/g, '\n');
  const blocks = Object.fromEntries([...source.matchAll(/'([a-z_]+)' => <<<'TXT'\n([\s\S]*?)\nTXT,/g)].map(match => [match[1], match[2]]));
  assert.deepEqual(Object.keys(blocks).sort(), Object.keys(TEXT).sort());
  for (const [key, value] of Object.entries(TEXT)) assert.equal(blocks[key], value, `el fragmento ${key} difiere`);
});
