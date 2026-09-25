const { chromium } = require('@playwright/test');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:3000/configurador');
  await page.getByRole('button', { name: 'Crear lista de jugadores' }).waitFor();
  await page.waitForFunction(() => localStorage.getItem('tony-team-order-v2'));
  const sampleCrest = await page.evaluate(() => {
    const key = 'tony-team-order-v2';
    const order = JSON.parse(localStorage.getItem(key));
    order.quantity = '6'; order.team = 'C.D. ORIENTE';
    order.players = order.players.slice(0, 6).map((p, i) => ({ ...p, name: ['DIEGO', 'MARTÍNEZ', 'SOFÍA', 'ANDREA', 'CARLOS', 'GÓMEZ'][i], size: ['M', 'L', 'S', 'M', 'XL', 'L'][i], number: String([10, 7, 9, 1, 15, 23][i]) }));
    order.design.elements.brand = false; order.design.elements.teamName = false; order.design.variant = 'clean';
    order.design.color = '#F3F5EF'; order.design.accent = '#2264E8';
    order.garment.technique = 'full-sublimation';
    const layer = { x: 50, y: 48, width: 38, height: 7, rotation: 0, opacity: 1, visible: true, locked: false, color: '#2264E8', bold: true, side: 'front' };
    order.design.layers = [
      { ...layer, id: 'sample-sponsor', name: 'Patrocinador', kind: 'text', text: 'IMPULSO', y: 51, width: 34, height: 6, color: '#18322B' },
      { ...layer, id: 'sample-motto', name: 'Lema del equipo', kind: 'text', text: 'JUNTOS HASTA EL FINAL', side: 'back', y: 80, width: 35, height: 3.5 },
    ];
    localStorage.setItem(key, JSON.stringify(order));
    const c = document.createElement('canvas'); c.width = 300; c.height = 360;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#2264e8'; ctx.strokeStyle = '#e6eeff'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(150, 15); ctx.lineTo(275, 60); ctx.lineTo(255, 220); ctx.quadraticCurveTo(235, 290, 150, 340); ctx.quadraticCurveTo(65, 290, 45, 220); ctx.lineTo(25, 60); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 120px Arial'; ctx.textAlign = 'center'; ctx.fillText('O', 150, 198);
    ctx.font = 'bold 25px Arial'; ctx.fillText('ORIENTE', 150, 245); ctx.font = '20px Arial'; ctx.fillText('2026', 150, 278);
    return c.toDataURL();
  });
  await page.goto('http://127.0.0.1:3000/configurador?preview=studio#paso-3');
  await page.getByRole('region', { name: 'Editor de diseño del equipo' }).waitFor();
  await page.locator('#tds-file-crest').setInputFiles({name:'escudo-oriente.png',mimeType:'image/png',buffer:Buffer.from(sampleCrest.split(',')[1],'base64')});
  await page.locator('[data-layer-kind="image"]').waitFor();
  await page.locator('#tds-layer-width').fill('11');
  await page.locator('#tds-layer-width').press('Tab');
  // Keep global sticky navigation out of these isolated component captures.
  await page.addStyleTag({content:'.order-actions{position:static!important}.site-header,.skip-link{visibility:hidden!important}'});
  await page.locator('.tds').screenshot({ path: path.resolve('docs/studio-layers-desktop.png') });
  await page.getByRole('button', { name: 'Revisar mi pedido' }).click();
  await page.locator('.order-art-review').screenshot({ path: path.resolve('docs/studio-review-desktop.png') });
  await page.getByRole('button', { name: 'Editar diseño y preferencias' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /^Capas/ }).click();
  await page.getByRole('button', { name: 'Seleccionar capa Escudo del equipo', exact:true }).click();
  await page.locator('.tds').screenshot({ path: path.resolve('docs/studio-layers-mobile.png') });
  console.log(JSON.stringify({ errors, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) }));
  await browser.close();
})();
