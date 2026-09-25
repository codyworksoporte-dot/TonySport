import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../out/', import.meta.url)));
const base = '/TonySport';
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};

createServer(async (request, response) => {
  let path;
  try { path = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname); }
  catch { response.writeHead(400).end(); return; }
  if (path !== base && !path.startsWith(`${base}/`)) { response.writeHead(302, {Location:`${base}/`}).end(); return; }
  let relative = path.slice(base.length).replace(/^\//, '');
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  else if (!extname(relative)) relative += '/index.html';
  const filename = join(root, relative);
  if (relative.includes('..') || !filename.startsWith(root + sep)) { response.writeHead(404).end(); return; }
  try {
    const body = await readFile(filename);
    response.writeHead(200, {'Content-Type':mime[extname(filename)] || 'application/octet-stream'}).end(body);
  } catch { response.writeHead(404).end(); }
}).listen(4173, '127.0.0.1', () => console.log(`Vista estática: http://127.0.0.1:4173${base}/`));
