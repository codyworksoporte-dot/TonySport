import {expect, test, type Page} from '@playwright/test';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
type Sample = {phase:string;covered:boolean;at:number};
async function observe(page:Page) {
  await page.addInitScript(()=>{
    const samples:Sample[]=[];
    (window as unknown as {__transitions:Sample[]}).__transitions=samples;
    new MutationObserver(records=>records.forEach(record=>{
      if(!(record.target instanceof HTMLElement) || !record.target.matches('.route-transition'))return;
      samples.push({phase:record.target.dataset.phase!,covered:document.documentElement.dataset.routeCover==='true',at:performance.now()});
    })).observe(document,{subtree:true,attributes:true,attributeFilter:['data-phase']});
  });
  await page.goto('/');
  await expect(page.locator('.route-transition')).toHaveAttribute('data-art','mobile');
}
const phases = (page:Page)=>page.evaluate(()=>(window as unknown as {__transitions:Sample[]}).__transitions.map(s=>s.phase).join(' '));
async function news(page:Page) {
  await page.getByRole('button',{name:'Abrir menú'}).tap();
  await page.getByRole('dialog',{name:'Menú de Tony Sportswear'}).getByRole('link',{name:/Tony News/}).tap();
}

test('touch navigation shows Tony over the full viewport without delaying routing, including back and logo',async({page})=>{
  await observe(page);
  const transition=page.locator('.route-transition');
  await expect(transition.locator('.rt-panel,.rt-stage')).toHaveCount(0);
  await expect(page.locator('.tony-peek img')).toHaveCount(0);
  await page.route(/\/tony-news(?:\?|$)/,async route=>{await new Promise(resolve=>setTimeout(resolve,900));await route.continue();});
  await news(page);
  await expect(transition).toHaveAttribute('data-phase','cover');
  await expect(transition.locator('.rt-mobile')).toHaveCSS('opacity','1');
  expect(await transition.boundingBox()).toEqual({x:0,y:0,width:390,height:844});
  expect(await transition.locator('.rt-mobile').boundingBox()).toEqual({x:0,y:0,width:390,height:844});
  await expect(transition.locator('.rt-mobile')).toHaveCSS('background-color','rgb(11, 23, 16)');
  await expect(page.locator('html')).toHaveAttribute('data-route-cover','true');
  const animated=await transition.evaluate(el=>[...new Set(el.getAnimations({subtree:true}).flatMap(a=>(a.effect as KeyframeEffect).getKeyframes().flatMap(f=>Object.keys(f))))]);
  expect(animated.filter(p=>!['offset','computedOffset','easing','composite'].includes(p)).sort()).toEqual(['opacity','transform']);
  await expect(transition).toHaveCSS('pointer-events','none');
  await page.screenshot({path:'output/mobile-transition-after.png'});
  await expect(page).toHaveURL(/\/tony-news$/);
  await expect.poll(()=>phases(page)).toBe('cover wink reveal idle');
  expect(await page.evaluate(()=>(window as unknown as {__transitions:Sample[]}).__transitions.some(s=>s.covered))).toBe(true);
  const timings=await page.evaluate(()=>(window as unknown as {__transitions:Sample[]}).__transitions);
  expect(timings[3].at-timings[1].at).toBeLessThan(850);
  await expect(page.locator('html')).not.toHaveAttribute('data-route-cover',/.*/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(()=>phases(page)).toBe('cover wink reveal idle cover wink reveal idle');
  await news(page);
  await expect(page).toHaveURL(/\/tony-news$/);
  await expect(transition).toHaveAttribute('data-phase','idle');
  await page.locator('.tony-header-inner .brand').tap();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(()=>phases(page)).toBe('cover wink reveal idle cover wink reveal idle cover wink reveal idle cover wink reveal idle');
  await expect(page.locator('.lagarto-intro[open]')).toHaveCount(0);
});

test('motion changes interrupt the mobile transition and leave navigation usable',async({page})=>{
  await observe(page);
  await page.route(/\/tony-news(?:\?|$)/,async route=>{await new Promise(resolve=>setTimeout(resolve,900));await route.continue();});
  await news(page);
  await expect(page.locator('.route-transition')).toHaveAttribute('data-phase','cover');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.route-transition')).toHaveAttribute('data-phase','idle');
  await expect(page.locator('.route-transition')).toBeHidden();
  await expect(page).toHaveURL(/\/tony-news$/);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button',{name:'Pausar efectos',exact:true}).tap();
  await page.locator('.tony-header-inner .brand').tap();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.route-transition')).toHaveAttribute('data-phase','idle');
  await expect(page.locator('html')).not.toHaveAttribute('data-route-cover',/.*/);
});

test('rapid route changes restart one transition and clean up every animation',async({page})=>{
  await observe(page);
  await news(page);
  await expect(page).toHaveURL(/\/tony-news$/);
  await page.locator('.tony-header-inner .brand').tap();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.route-transition')).toHaveAttribute('data-phase','idle');
  await expect.poll(()=>page.locator('.route-transition').evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
  await expect(page.locator('.rt-mobile')).toHaveCount(1);
});

for(const viewport of [{width:320,height:568},{width:768,height:1024},{width:844,height:390}])test(`transition covers the viewport at ${viewport.width}x${viewport.height}`,async({page})=>{
  await page.setViewportSize(viewport);await observe(page);
  await page.route(/\/tony-news(?:\?|$)/,async route=>{await new Promise(resolve=>setTimeout(resolve,900));await route.continue();});
  await news(page);
  await expect(page.locator('.rt-mobile')).toHaveCSS('opacity','1');
  expect(await page.locator('.route-transition').boundingBox()).toEqual({x:0,y:0,...viewport});
  const emblem=await page.locator('.rt-mobile-content').boundingBox();
  expect(emblem!.y).toBeGreaterThanOrEqual(0);
  expect(emblem!.y+emblem!.height).toBeLessThanOrEqual(viewport.height);
  await expect(page).toHaveURL(/\/tony-news$/);
  await expect(page.locator('.route-transition')).toHaveAttribute('data-phase','idle');
  await expect(page.locator('html')).not.toHaveAttribute('data-route-cover',/.*/);
});
