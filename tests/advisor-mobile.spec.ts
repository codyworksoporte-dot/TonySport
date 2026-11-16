import {expect, test, type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mockPedidoApi, expectNoOverflow} from './pedido/helpers';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
type Voice = {name:string;lang:string};
type Harness = {voices:Voice[];mode:string;said:string[];listeners:Set<unknown>;cancels:number};
const generic = {name:'es-us-x-sfb-local',lang:'es-US'};

async function setup(page:Page, voices:Voice[]=[generic], mode='ok') {
  await mockPedidoApi(page);
  await page.addInitScript(({voices,mode})=>{
    if(!localStorage.getItem('tony:pedido:quality:v1')) localStorage.setItem('tony:pedido:quality:v1','high');
    const harness:Harness={voices,mode,said:[],listeners:new Set(),cancels:0};
    (window as unknown as {__speech:Harness}).__speech=harness;
    let generation=0;
    const events=new EventTarget();
    (window as unknown as {SpeechSynthesisUtterance:unknown}).SpeechSynthesisUtterance=class {
      text:string;voice:unknown=null;lang='';rate=1;pitch=1;onend:unknown=null;onerror:unknown=null;onstart:unknown=null;
      constructor(text:string){this.text=text;}
    };
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{
      getVoices:()=>harness.voices,
      addEventListener(type:string,cb:EventListener){harness.listeners.add(cb);events.addEventListener(type,cb);},
      removeEventListener(type:string,cb:EventListener){harness.listeners.delete(cb);events.removeEventListener(type,cb);},
      dispatchEvent:(event:Event)=>events.dispatchEvent(event),
      cancel(){generation++;harness.cancels++;},resume(){},
      speak(utterance:SpeechSynthesisUtterance){
        const token=generation;
        harness.said.push(utterance.voice?.name||'');
        setTimeout(()=>{
          if(token!==generation)return;
          if(harness.mode==='hang')return;
          if(harness.mode!=='ok'){utterance.onerror?.({error:harness.mode} as SpeechSynthesisErrorEvent);return;}
          utterance.onstart?.(new Event('start') as SpeechSynthesisEvent);
          setTimeout(()=>{if(token===generation)utterance.onend?.(new Event('end') as SpeechSynthesisEvent);},100);
        },10);
      },
    }});
  },{voices,mode});
  await page.goto('/configurador');
  await expect(page.getByRole('region',{name:'Tu asesora Tony'})).toBeVisible();
}

for(const width of [320,390,768]) test(`automatic Spanish guidance has a compact accessible sound control at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});
  await setup(page);
  const card=page.getByRole('region',{name:'Tu asesora Tony'});
  await card.scrollIntoViewIfNeeded();
  for(const button of await page.locator('.advisor-sound-toggle, .advisor-quality button').all()) {
    const metrics=await button.evaluate(el=>({height:el.getBoundingClientRect().height,border:getComputedStyle(el).borderTopColor}));
    expect(metrics.height).toBeGreaterThanOrEqual(44);
    expect(metrics.border).not.toBe('rgba(0, 0, 0, 0)');
  }
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.said)).toContain(generic.name);
  await expect(card.locator('.advisor-sound-toggle')).toHaveCount(1);
  await expect(card.getByRole('button',{name:'Silenciar asesora',exact:true})).toBeVisible();
  await expect(card.getByRole('button',{name:/Pausar movimiento|Repetir guía|Usar versión ligera/})).toHaveCount(0);
  await expectNoOverflow(page,width);
  expect((await new AxeBuilder({page}).include('.advisor-studio').include('.advisor-quality').analyze()).violations).toEqual([]);
  if(width===390)await page.screenshot({path:'output/mobile-advisor-after.png'});
  await page.getByRole('button',{name:/^Gama baja/}).tap();
  await expect(card).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.listeners.size)).toBe(0);
  await page.reload();
  await expect(page.getByRole('button',{name:/^Gama baja/})).toHaveAttribute('aria-pressed','true');
  await expect(card).toHaveCount(0);
  await expect(page.locator('.advisor-text-guide')).toContainText('Toca Crear mi pedido y empezamos.');
});

test('late voices recover after the initial empty list and remain retryable',async({page})=>{
  await setup(page,[]);
  const card=page.getByRole('region',{name:'Tu asesora Tony'});
  await expect(card.locator('.advisor-voice-note')).toContainText('Puedes seguir la guía escrita.');
  await expect(card).not.toContainText('no tiene una voz femenina');
  await page.evaluate(voice=>{
    (window as unknown as {__speech:Harness}).__speech.voices=[voice];
    speechSynthesis.dispatchEvent(new Event('voiceschanged'));
  },generic);
  await expect(card.getByRole('button',{name:'Silenciar asesora'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.said.length)).toBeGreaterThan(0);
});

for(const mode of ['not-allowed','synthesis-failed','hang']) test(`audio ${mode} offers a direct tap to retry without hiding the advisor`,async({page})=>{
  await setup(page,[generic],mode);
  const card=page.getByRole('region',{name:'Tu asesora Tony'});
  const retry=card.getByRole('button',{name:'Reintentar sonido de la asesora',exact:true});
  await expect(retry).toBeVisible({timeout:6500});
  await expect(card.locator('.advisor-studio-message')).toContainText('Toca Crear mi pedido y empezamos.');
  const count=await page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.said.length);
  await page.evaluate(()=>{(window as unknown as {__speech:Harness}).__speech.mode='ok';});
  await retry.tap();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.said.length)).toBeGreaterThan(count);
  await expect(card.getByRole('button',{name:'Silenciar asesora'})).toBeVisible();
  await expect(card.locator('.advisor-voice-note')).toHaveCount(0);
});

test('muting stops narration and keeps the next step quiet until sound is enabled',async({page})=>{
  await setup(page);
  const card=page.getByRole('region',{name:'Tu asesora Tony'});
  const said=()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.said.length);
  await expect.poll(said).toBeGreaterThan(0);
  const count=await said(), cancels=await page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.cancels);
  await card.getByRole('button',{name:'Silenciar asesora',exact:true}).tap();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.cancels)).toBeGreaterThan(cancels);
  await page.getByRole('button',{name:/CREAR MI PEDIDO/}).tap();
  await expect(page.getByRole('heading',{name:'Escoge tu producto',exact:true})).toBeVisible();
  await expect(card.getByRole('button',{name:'Activar sonido de la asesora',exact:true})).toBeVisible();
  // Let the automatic narration debounce elapse before verifying that mute survived the cue change.
  await page.waitForTimeout(700);
  expect(await said()).toBe(count);
  await card.getByRole('button',{name:'Activar sonido de la asesora',exact:true}).tap();
  await expect.poll(said).toBeGreaterThan(count);
});

test('a blocked automatic voice retries on the next order interaction',async({page})=>{
  await setup(page,[generic],'not-allowed');
  await expect(page.getByRole('button',{name:'Reintentar sonido de la asesora',exact:true})).toBeVisible();
  const count=await page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.said.length);
  await page.evaluate(()=>{(window as unknown as {__speech:Harness}).__speech.mode='ok';});
  await page.getByRole('heading',{level:1}).tap();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.said.length)).toBeGreaterThan(count);
  await expect(page.getByRole('button',{name:'Silenciar asesora',exact:true})).toBeVisible();
});

test('no speech API still leaves written guidance and a lightweight mode',async({page})=>{
  await mockPedidoApi(page);
  await page.addInitScript(()=>{
    localStorage.setItem('tony:pedido:quality:v1','high');
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:undefined});
  });
  await page.goto('/configurador');
  const card=page.getByRole('region',{name:'Tu asesora Tony'});
  await expect(card.locator('.advisor-sound-toggle')).toBeDisabled();
  await expect(card).toContainText('Puedes seguir la guía escrita.');
  await page.getByRole('button',{name:/^Gama baja/}).tap();
  await expect(card).toHaveCount(0);
  await expect(page.getByRole('button',{name:/^Gama alta/})).toBeVisible();
});

test('leaving the order cancels speech and removes voice subscriptions',async({page})=>{
  await setup(page);
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.listeners.size)).toBe(1);
  await page.getByRole('button',{name:'Abrir menú'}).tap();
  await page.getByRole('dialog',{name:'Menú de Tony Sportswear'}).getByRole('link',{name:/Tony News/}).tap();
  await expect(page).toHaveURL(/\/tony-news$/,{timeout:20000});
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.listeners.size)).toBe(0);
  await page.goBack();
  await expect(page.getByRole('region',{name:'Tu asesora Tony'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.listeners.size)).toBe(1);
});
