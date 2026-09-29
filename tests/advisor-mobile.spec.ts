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
    if(!localStorage.getItem('tony:pedido:asesora:v2')) localStorage.setItem('tony:pedido:asesora:v2',JSON.stringify({visible:true,voice:false}));
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

for(const width of [320,390,768]) test(`advisor actions are visible buttons with Spanish device voices at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});
  await setup(page);
  const card=page.getByRole('region',{name:'Tu asesora Tony'});
  await expect(card).toContainText('Uso la voz en español disponible');
  await card.scrollIntoViewIfNeeded();
  for(const button of await card.getByRole('button').all()) {
    const metrics=await button.evaluate(el=>({height:el.getBoundingClientRect().height,border:getComputedStyle(el).borderTopColor}));
    expect(metrics.height).toBeGreaterThanOrEqual(44);
    expect(metrics.border).not.toBe('rgba(0, 0, 0, 0)');
  }
  await card.getByRole('button',{name:'Repetir',exact:true}).tap();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.said)).toContain(generic.name);
  await expectNoOverflow(page,width);
  expect((await new AxeBuilder({page}).include('.pedido-advisor-card').analyze()).violations).toEqual([]);
  if(width===390)await page.screenshot({path:'output/mobile-advisor-after.png'});
  await card.getByRole('button',{name:'No quiero asesora'}).tap();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button',{name:'Mostrar a tu asesora Tony'})).toBeVisible();
});

test('late voices recover after the initial empty list and remain retryable',async({page})=>{
  await setup(page,[]);
  const card=page.getByRole('region',{name:'Tu asesora Tony'});
  await expect(card.getByRole('button',{name:'Reintentar voz'})).toBeVisible();
  await expect(card).not.toContainText('no tiene una voz femenina');
  await card.getByRole('button',{name:'Reintentar voz'}).tap();
  await page.evaluate(voice=>{
    (window as unknown as {__speech:Harness}).__speech.voices=[voice];
    speechSynthesis.dispatchEvent(new Event('voiceschanged'));
  },generic);
  await expect(card.getByRole('button',{name:'Voz activada'})).toBeVisible();
  await card.getByRole('button',{name:'Repetir',exact:true}).tap();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.said.length)).toBeGreaterThan(0);
});

for(const mode of ['not-allowed','synthesis-failed','hang']) test(`audio ${mode} offers a direct tap to retry without hiding the advisor`,async({page})=>{
  await setup(page,[generic],mode);
  const card=page.getByRole('region',{name:'Tu asesora Tony'});
  await card.getByRole('button',{name:'Repetir',exact:true}).tap();
  const retry=card.getByRole('button',{name:'Escuchar guía'});
  await expect(retry).toBeVisible({timeout:6500});
  await expect(card).not.toHaveClass(/is-speaking/);
  const count=await page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.said.length);
  await page.evaluate(()=>{(window as unknown as {__speech:Harness}).__speech.mode='ok';});
  await retry.tap();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.said.length)).toBeGreaterThan(count);
  await expect(card.getByRole('button',{name:'Voz activada'})).toBeVisible();
  await expect(card.getByRole('status')).not.toContainText('reintentar');
});

test('no speech API still leaves a clear hide button and written guidance',async({page})=>{
  await mockPedidoApi(page);
  await page.addInitScript(()=>Object.defineProperty(window,'speechSynthesis',{configurable:true,value:undefined}));
  await page.goto('/configurador');
  const card=page.getByRole('region',{name:'Tu asesora Tony'});
  await expect(card.getByRole('button',{name:'Voz no disponible'})).toBeDisabled();
  await expect(card).toContainText('Puedes seguir por escrito');
  await card.getByRole('button',{name:'No quiero asesora'}).tap();
  await expect(page.getByRole('button',{name:'Mostrar a tu asesora Tony'})).toBeVisible();
});

test('leaving the order cancels speech and removes voice subscriptions',async({page})=>{
  await setup(page);
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.listeners.size)).toBe(1);
  await page.getByRole('button',{name:'Abrir menú'}).tap();
  await page.getByRole('dialog',{name:'Menú de Tony Sportswear'}).getByRole('link',{name:/Tony News/}).tap();
  await expect(page).toHaveURL(/\/tony-news$/);
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.listeners.size)).toBe(0);
  await page.goBack();
  await expect(page.getByRole('region',{name:'Tu asesora Tony'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__speech:Harness}).__speech.listeners.size)).toBe(1);
});
