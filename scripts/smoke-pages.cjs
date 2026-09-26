const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
  const page = await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  const base = 'http://127.0.0.1:4173/TonySport';
  const failures = [];
  page.on('pageerror', error => failures.push(`JS: ${error.message}`));
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:4173/') && response.status() >= 400) failures.push(`${response.status()}: ${response.url()}`);
  });
  for (const route of ['/', '/producto/', '/carrito/', '/configurador/', '/configurador/archivo/', '/tony-news/']) {
    const response = await page.goto(`${base}${route}`, {waitUntil:'networkidle'});
    if (response?.status() !== 200 || !await page.locator('main h1').count()) failures.push(`Ruta ${route} no abrió correctamente`);
    const brokenLinks = await page.locator('a[href^="/"]').evaluateAll(links => links.map(link => link.getAttribute('href')).filter(href => href && !href.startsWith('/TonySport/')));
    if (brokenLinks.length) failures.push(`Enlaces fuera del sitio en ${route}: ${brokenLinks.join(', ')}`);
  }
  await page.goto(`${base}/`, {waitUntil:'networkidle'});
  await page.getByRole('link',{name:/Explora Producto/}).click();
  await page.waitForURL(`${base}/producto/`);
  await page.goto(`${base}/configurador/`, {waitUntil:'networkidle'});
  await page.getByRole('link',{name:/Abrir un borrador del editor anterior/}).click();
  await page.waitForURL(`${base}/configurador/archivo/`);
  await page.getByRole('heading',{name:/VÍSTELO A TU MANERA/}).waitFor();
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('GitHub Pages: seis rutas y sus assets responden; navegación a Producto y al editor archivado correcta.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
