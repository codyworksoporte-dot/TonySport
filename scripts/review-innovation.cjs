/*
 * Full-site visual review after the November 2026 innovation pass: every route
 * at 1440 px and 390 px, full page, with page errors, console errors and
 * horizontal overflow collected. Output in output/innovation-review/.
 * Requires the local server on 127.0.0.1:3000.
 *   node scripts/review-innovation.cjs            (all routes)
 *   node scripts/review-innovation.cjs producto   (routes containing "producto")
 */
const {chromium} = require('@playwright/test');
const fs = require('fs');
const out = 'output/innovation-review';
fs.mkdirSync(out, {recursive: true});
const BASE = process.env.TONY_BASE_URL || 'http://127.0.0.1:3000';
const ROUTES = ['/', '/producto', '/catalogo', '/colecciones', '/configurador', '/carrito', '/recientes', '/resenas', '/cuenta', '/calidad', '/tiendas', '/entregas', '/ayuda', '/nosotros', '/contacto', '/comunidad', '/actualidad', '/patrocinio', '/tony-news'];
const filter = process.argv[2];

(async () => {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  const report = [];
  for (const [label, viewport, mobile] of [['desktop', {width: 1440, height: 1000}, false], ['mobile', {width: 390, height: 844}, true]]) {
    const context = await browser.newContext({viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1});
    await context.route(/^https?:\/\/(?!127\.0\.0\.1(?::\d+)?(?:\/|$)|localhost(?::\d+)?(?:\/|$))/, route => route.abort());
    await context.addInitScript(() => {sessionStorage.setItem('tony:intro:v2', '1'); localStorage.setItem('tony:pedido:quality:v1', 'high');});
    for (const route of ROUTES) {
      if (filter && !route.includes(filter)) continue;
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => {if (m.type() === 'error' && !/favicon|net::ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(m.text());});
      try {
        await page.goto(BASE + route, {waitUntil: 'networkidle', timeout: 60000});
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(600);
        const name = route === '/' ? 'home' : route.slice(1).replace(/\//g, '-');
        await page.screenshot({path: `${out}/${name}-${label}.png`, fullPage: true, caret: 'initial'});
        const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);
        const clipped = await page.locator('main h1,main h2,main h3,main input,main select,main button,main a').evaluateAll(elements => elements.filter(element => {const rect = element.getBoundingClientRect(); return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);}).map(element => `${element.tagName}:${(element.textContent || '').trim().slice(0, 40)}`));
        report.push({route, label, errors, overflow, clipped: clipped.slice(0, 6)});
      } catch (error) {
        report.push({route, label, errors: [...errors, String(error.message).split('\n')[0]], overflow: null, clipped: []});
      }
      await page.close();
    }
    await context.close();
  }
  await browser.close();
  const problems = report.filter(r => r.errors.length || (r.overflow || 0) > 0 || r.clipped.length);
  console.log(JSON.stringify({captured: report.length, problems}, null, 1));
})().catch(error => {console.error(error); process.exitCode = 1;});
