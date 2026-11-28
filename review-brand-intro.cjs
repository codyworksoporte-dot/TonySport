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
      const dialog = page.getByRole('dialog', { name: 'Entrada de Tony Sportswear' });
      await dialog.locator('.intro-wordmark img').evaluate(img => img.decode());
      const moments = width === 390 ? [810, 1250] : [1000, 1760];
      for (const [index, time] of moments.entries()) {
        await dialog.evaluate((node, currentTime) => {
          for (const animation of node.getAnimations({ subtree: true })) {
            animation.pause();
            animation.currentTime = currentTime;
          }
        }, time);
        await page.screenshot({ path: `output/brand-intro/${width}-${index === 0 ? 'impacto' : 'brillo'}.png` });
      }
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'detached' });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

review().catch(error => { console.error(error); process.exitCode = 1; });
