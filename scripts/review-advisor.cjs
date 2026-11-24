/*
 * Captures Tony's advisor stage for review: the welcome scene and the guided
 * steps at 1440 px, the phone card at 390 px, and close-ups of her face while
 * a simulated voice speaks (the real voice is never played). Output goes to
 * output/advisor-review/. Requires the local server on 127.0.0.1:3000.
 *   node scripts/review-advisor.cjs
 */
const {chromium} = require('playwright');
const fs = require('fs');
const out = 'output/advisor-review';
fs.mkdirSync(out, {recursive: true});
const BASE = process.env.TONY_BASE_URL || 'http://127.0.0.1:3000';

async function prepare(context, {reduced = false} = {}) {
  await context.route(/^https?:\/\/(?!127\.0\.0\.1(?::\d+)?(?:\/|$)|localhost(?::\d+)?(?:\/|$))/, route => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('tony:pedido:quality:v1', 'high');
    sessionStorage.setItem('tony:intro-seen', '1');
    // A voice that only reports progress: onstart, one word boundary every 300 ms, onend at the estimated length.
    const voices = [{name: 'Microsoft Sabina - Spanish (Mexico)', lang: 'es-MX'}];
    let generation = 0;
    const said = [];
    window.__said = said;
    window.SpeechSynthesisUtterance = class {constructor(text) {this.text = text; this.voice = null; this.lang = ''; this.rate = 1; this.pitch = 1; this.onstart = null; this.onend = null; this.onerror = null; this.onboundary = null;}};
    Object.defineProperty(window, 'speechSynthesis', {configurable: true, value: {
      getVoices: () => voices, cancel() {generation++;}, resume() {}, pause() {}, addEventListener() {}, removeEventListener() {},
      speak(utterance) {
        const token = generation; said.push(utterance.text);
        setTimeout(() => {
          if (token !== generation) return;
          utterance.onstart?.({});
          const words = utterance.text.split(/\s+/); let index = 0, char = 0;
          const tick = setInterval(() => {
            if (token !== generation || index >= words.length) {clearInterval(tick); if (token === generation) utterance.onend?.({}); return;}
            utterance.onboundary?.({name: 'word', charIndex: char}); char += words[index].length + 1; index++;
          }, 300);
        }, 30);
      },
    }});
  });
  if (reduced) await context.emulateMedia?.({reducedMotion: 'reduce'});
}

(async () => {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  const errors = [];
  const report = {};
  // Desktop.
  const desktop = await browser.newContext({viewport: {width: 1440, height: 1000}, deviceScaleFactor: 1});
  await prepare(desktop);
  const page = await desktop.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
  await page.goto(`${BASE}/configurador`, {waitUntil: 'domcontentloaded'});
  await page.locator('.advisor-stage[data-state="ready"]').waitFor({timeout: 30000});
  await page.waitForTimeout(900);
  await page.screenshot({path: `${out}/welcome-1440.png`, fullPage: false});
  await page.locator('.advisor-studio').screenshot({path: `${out}/welcome-stage.png`});
  // Face while speaking: trigger the voice through the sound button and capture at two moments.
  await page.getByRole('button', {name: /Silenciar asesora|Activar sonido|Reintentar sonido/}).click();
  await page.getByRole('button', {name: /Activar sonido de la asesora|Reintentar sonido/}).click();
  await page.waitForTimeout(260);
  const stage = page.locator('.advisor-stage-wrap');
  await stage.screenshot({path: `${out}/speaking-a.png`});
  await page.waitForTimeout(420);
  await stage.screenshot({path: `${out}/speaking-b.png`});
  await page.waitForTimeout(380);
  await stage.screenshot({path: `${out}/speaking-c.png`});
  report.said = await page.evaluate(() => window.__said);
  // Contact sheets: the face every 180 ms while she speaks, then the whole stage every 600 ms at rest.
  const sharp = require('sharp');
  async function sheet(name, shots, every, clip) {
    const frames = [];
    for (let i = 0; i < shots; i++) {frames.push(clip ? await page.screenshot({clip}) : await stage.screenshot()); await page.waitForTimeout(every);}
    const metas = await Promise.all(frames.map(f => sharp(f).metadata()));
    const w = metas[0].width, h = metas[0].height;
    await sharp({create: {width: w * shots, height: h, channels: 4, background: {r: 0, g: 0, b: 0, alpha: 1}}}).composite(frames.map((input, i) => ({input, left: w * i, top: 0}))).png().toFile(`${out}/${name}.png`);
    // Mean absolute difference between consecutive frames, to prove there is motion and measure how much.
    const raws = await Promise.all(frames.map(f => sharp(f).removeAlpha().raw().toBuffer()));
    report[name] = raws.slice(1).map((r, i) => {let sum = 0; for (let k = 0; k < r.length; k++) sum += Math.abs(r[k] - raws[i][k]); return +(sum / r.length).toFixed(3);});
  }
  const box = await stage.boundingBox();
  // Mute, then unmute: the second tap narrates the current advice again.
  await page.getByRole('button', {name: /Silenciar asesora/}).click().catch(() => {});
  await page.getByRole('button', {name: /Activar sonido de la asesora|Reintentar sonido/}).click().catch(() => {});
  await page.waitForTimeout(160);
  await sheet('speaking-face-sheet', 7, 180, {x: box.x + box.width * .36, y: box.y + box.height * .04, width: box.width * .28, height: box.height * .3});
  await page.waitForTimeout(2500);
  await sheet('idle-stage-sheet', 5, 600);
  // Step 1 and 2: the guided layout with her at the left.
  await page.getByRole('button', {name: /CREAR MI PEDIDO/}).click();
  await page.getByRole('heading', {name: 'Escoge tu producto', exact: true}).waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({path: `${out}/step1-1440.png`, fullPage: false});
  await page.getByRole('button', {name: /Uniformes Full Sublimados/}).click();
  await page.locator('.pedido-step-footer').getByRole('button', {name: /Continuar/}).click();
  await page.getByRole('heading', {name: '¿Para quién es?', exact: true}).waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({path: `${out}/step2-1440.png`, fullPage: false});
  await page.screenshot({path: `${out}/step2-1440-full.png`, fullPage: true});
  const studio = await page.locator('.advisor-studio').boundingBox(), choices = await page.locator('[data-advisor="gender"]').boundingBox();
  report.desktop = {studio, choices, scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth)};
  await desktop.close();
  // Phone.
  const phone = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
  await prepare(phone);
  const mobile = await phone.newPage();
  mobile.on('pageerror', e => errors.push(e.message));
  await mobile.goto(`${BASE}/configurador`, {waitUntil: 'domcontentloaded'});
  await mobile.locator('.advisor-stage[data-state="ready"]').waitFor({timeout: 30000});
  await mobile.waitForTimeout(700);
  await mobile.screenshot({path: `${out}/welcome-390.png`});
  await mobile.getByRole('button', {name: /CREAR MI PEDIDO/}).tap();
  await mobile.getByRole('button', {name: /Uniformes Full Sublimados/}).tap();
  await mobile.locator('.pedido-step-footer').getByRole('button', {name: /Continuar/}).tap();
  await mobile.getByRole('heading', {name: '¿Para quién es?', exact: true}).waitFor();
  await mobile.waitForTimeout(700);
  await mobile.screenshot({path: `${out}/step2-390.png`});
  await mobile.locator('.advisor-studio').screenshot({path: `${out}/step2-390-card.png`});
  const mStudio = await mobile.locator('.advisor-studio').boundingBox(), mChoices = await mobile.locator('[data-advisor="gender"]').boundingBox();
  report.mobile = {studio: mStudio, choices: mChoices, scrollWidth: await mobile.evaluate(() => document.documentElement.scrollWidth)};
  await phone.close();
  await browser.close();
  console.log(JSON.stringify({errors, ...report}, null, 1));
})().catch(e => {console.error(e); process.exit(1);});
