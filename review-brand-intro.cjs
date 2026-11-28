const { mkdir } = require('node:fs/promises');
const { chromium } = require('playwright');

async function review() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    await mkdir('output/brand-intro', { recursive: true });
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'no-preference' });
      await page.clock.install();
      await page.clock.pauseAt(Date.now() + 250);
      await page.goto(process.env.TONY_PREVIEW_URL || 'http://127.0.0.1:3000/', { waitUntil: 'commit' });
      const dialog = page.locator('.brand-intro[open]');
      await dialog.locator('.brand-screen-art img').evaluate(img => img.decode());
      await page.screenshot({ path: `output/brand-intro/${width}-entrada.png` });
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'detached' });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

review().catch(error => { console.error(error); process.exitCode = 1; });
