// Local runner for the same handlers that Vercel deploys.
//   node dev/local.mjs --simulado          no model call: answers with the received image
//   AI_GATEWAY_API_KEY=... node dev/local.mjs   real Gemini through AI Gateway
// Then start the web with NEXT_PUBLIC_TONY_API_BASE=http://127.0.0.1:8787
import http from 'node:http';
import {Readable} from 'node:stream';
import {createImageHandler, createNotEnabledHandler, createSessionHandler, createStatusHandler} from '../lib/handlers.js';
import {authMode} from '../lib/ai.js';

const args = process.argv.slice(2);
const simulated = args.includes('--simulado');
const port = Number(args.find(arg => arg.startsWith('--port='))?.slice(7) || process.env.PORT || 8787);

const echo = async ({input}) => ({bytes: input.image.bytes, mime: input.image.mime, provider: 'simulado', model: 'sin-modelo', fallbackUsed: false, attempts: []});
const deps = simulated ? {generateImage: echo} : {};
const notEnabled = createNotEnabledHandler();
const routes = new Map([
  ['/', createStatusHandler()],
  ['/session.php', createSessionHandler()],
  ['/generate.php', createImageHandler('generate', deps)],
  ['/magic_eraser.php', createImageHandler('magic_eraser', deps)],
  ['/finalize.php', createImageHandler('finalize', deps)],
  ...['quote', 'tony-submit-order', 'wompi-crear-pago', 'wompi-verificar', 'wompi-retorno', 'wompi-webhook', 'order', 'mock-confirm', 'auth'].map(name => [`/${name}.php`, notEnabled]),
]);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    const handler = routes.get(url.pathname);
    if (!handler) { res.writeHead(404, {'Content-Type': 'application/json'}); res.end('{"ok":false,"code":"not_found"}'); return; }
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(key, value);
    headers.set('x-real-ip', req.socket.remoteAddress || 'local');
    const hasBody = !['GET', 'HEAD', 'OPTIONS'].includes(req.method || 'GET');
    const request = new Request(url, {method: req.method, headers, ...(hasBody ? {body: Readable.toWeb(req), duplex: 'half'} : {})});
    const response = await handler.fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500, {'Content-Type': 'application/json'});
    res.end('{"ok":false,"code":"local_error"}');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Servidor de IA de Tony en http://127.0.0.1:${port} (${simulated ? 'modo simulado, sin llamadas a modelos' : `autenticación: ${authMode()}`}).`);
  if (!simulated && authMode() === 'vercel-oidc') console.log('Aviso: fuera de Vercel no hay token OIDC. Usa --simulado, define AI_GATEWAY_API_KEY o ejecuta "vercel env pull".');
});
