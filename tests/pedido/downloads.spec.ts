import {expect, test} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {calculatePedido} from '../../lib/pedido/pricing';
import {completePedido} from './pricing.fixtures';

function browserBundle() {
  const modules = ['lib/asset-path.ts','lib/pedido/pricing.ts','lib/pedido/order.ts','lib/pedido/downloads.ts'];
  const functions = modules.map(file => `${JSON.stringify(file)}:function(module,exports,require){${ts.transpileModule(fs.readFileSync(path.resolve(file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText}}`).join(',');
  const table = fs.readFileSync(path.resolve('data/pedido/prices.json'),'utf8');
  return `(() => {const process={env:{TONY_ASSET_BASE:''}};const modules={${functions}};const cache={};const paths={'../asset-path':'lib/asset-path.ts','./order':'lib/pedido/order.ts','./pricing':'lib/pedido/pricing.ts'};function require(name){if(name==='../../data/pedido/prices.json')return ${table};name=paths[name]||name;if(cache[name])return cache[name].exports;const m={exports:{}};cache[name]=m;modules[name](m,m.exports,require);return m.exports;}window.tonyDownload=require('lib/pedido/downloads.ts');})();`;
}

test('documentos PDF multipágina y PNG se descargan con datos sintéticos', async ({page}, testInfo) => {
  await page.setViewportSize({width:1440,height:1100});
  await page.setContent('<button id="download">Descargar documento de prueba</button>');
  await page.addScriptTag({content:browserBundle()});
  const images = await page.evaluate(() => {
    const art=document.createElement('canvas');art.width=600;art.height=800;
    const context=art.getContext('2d')!;context.fillStyle='#173D2C';context.fillRect(0,0,600,800);
    context.fillStyle='#9DE041';context.beginPath();context.moveTo(130,180);context.lineTo(250,120);context.lineTo(350,120);context.lineTo(470,180);context.lineTo(540,300);context.lineTo(450,355);context.lineTo(440,690);context.lineTo(160,690);context.lineTo(150,355);context.lineTo(60,300);context.closePath();context.fill();
    context.fillStyle='#173D2C';context.font='bold 42px Arial';context.textAlign='center';context.fillText('EQUIPO DE PRUEBA',300,350);context.font='bold 160px Arial';context.fillText('99',300,540);
    const design=art.toDataURL('image/png');art.width=620;art.height=160;context.fillStyle='white';context.fillRect(0,0,620,160);context.strokeStyle='#123629';context.lineWidth=4;context.beginPath();context.moveTo(70,115);context.bezierCurveTo(280,-35,160,170,390,70);context.lineTo(480,105);context.stroke();
    return {design,signature:art.toDataURL('image/png')};
  });
  const order=completePedido(99);order.players[98].name='ULTIMO JUGADOR DE PRUEBA';
  order.design.finalFront=images.design;order.design.finalBack=images.design;
  const prices=calculatePedido(order,'home');
  const data={draft:order,buyer:{name:'CLIENTE DE PRUEBA',dui:'00000000-0',phone:'00000000',email:'prueba@example.invalid'},delivery:{kind:'home',branch:'',department:'San Salvador',city:'Distrito de prueba',address:'Dirección sintética para verificar el documento',reference:'Datos de prueba'},signature:images.signature,receipt:{id:'TEST-PDF-001',status:'Recibido para revisión',paymentStatus:'transfer_pending',...prices},termsVersion:'VERSIÓN DE PRUEBA'};
  await page.evaluate(data => {
    const win=window as unknown as {tonyDownload:{downloadPedidoDocument:(kind:string,data:unknown)=>Promise<void>}; pdfCanvases:HTMLCanvasElement[]; pdfText:string[]};
    win.pdfCanvases=[];win.pdfText=[];
    const create=document.createElement.bind(document),fill=CanvasRenderingContext2D.prototype.fillText;
    document.createElement=((name:string,options?:ElementCreationOptions)=>{const element=create(name,options);if(name==='canvas')win.pdfCanvases.push(element as HTMLCanvasElement);return element;}) as typeof document.createElement;
    CanvasRenderingContext2D.prototype.fillText=function(...args:Parameters<typeof fill>){win.pdfText.push(String(args[0]));return fill.apply(this,args);};
    document.querySelector('button')!.onclick=()=>void win.tonyDownload.downloadPedidoDocument('production',data);
  },data);
  const production=page.waitForEvent('download');await page.getByRole('button').click();const download=await production;
  await download.saveAs(testInfo.outputPath('production-99-players.pdf'));
  const bytes=fs.readFileSync(await download.path());expect(bytes.subarray(0,8).toString()).toBe('%PDF-1.4');
  expect(bytes.toString('latin1')).toMatch(/\/Count [5-9]/);
  const drawn=await page.evaluate(()=>(window as unknown as {pdfText:string[]}).pdfText);
  expect(drawn).toContain('ULTIMO JUGADOR DE PRUEBA');expect(drawn).toContain('Anticipo pendiente de verificación');expect(drawn).not.toContain('Anticipo confirmado');
  await page.evaluate(()=>{
    const pages=(window as unknown as {pdfCanvases:HTMLCanvasElement[]}).pdfCanvases;
    document.body.innerHTML='';document.body.style.cssText='margin:0;background:#b7c4ba;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px';
    pages.forEach(canvas=>{canvas.style.width='100%';canvas.style.height='auto';document.body.append(canvas);});
  });
  await page.screenshot({path:testInfo.outputPath('production-contact-sheet.png'),fullPage:true});
  const png=page.waitForEvent('download');await page.evaluate(async design=>{
    await (window as unknown as {tonyDownload:{downloadDesign:(data:string,name:string)=>Promise<void>}}).tonyDownload.downloadDesign(design,'Tony-diseño-prueba');
  },images.design);
  const image=await png;expect(image.suggestedFilename()).toBe('Tony-diseño-prueba.png');
  const pngBytes=fs.readFileSync(await image.path());expect(pngBytes.subarray(0,8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));
  const paymentOrder=completePedido();paymentOrder.design.finalFront=images.design;paymentOrder.design.finalBack=images.design;
  const paymentData={...data,draft:paymentOrder,receipt:{...data.receipt,id:'TEST-PAYMENT-001',paymentStatus:'rejected',...calculatePedido(paymentOrder,'home')}};
  const paymentDownload=page.waitForEvent('download');
  await page.evaluate(async next=>{
    await (window as unknown as {tonyDownload:{downloadPedidoDocument:(kind:string,data:unknown)=>Promise<void>}}).tonyDownload.downloadPedidoDocument('payment',next);
  },paymentData);
  const paymentPdf=await paymentDownload;await paymentPdf.saveAs(testInfo.outputPath('payment-rejected.pdf'));
  expect(paymentPdf.suggestedFilename()).toBe('Tony-Orden-Pago-TEST-PAYMENT-001.pdf');
  expect(await page.evaluate(()=>(window as unknown as {pdfText:string[]}).pdfText)).toContain('Pago no aprobado');
  const rejection=await page.evaluate(async next=>{
    try {await (window as unknown as {tonyDownload:{downloadPedidoDocument:(kind:string,data:unknown)=>Promise<void>}}).tonyDownload.downloadPedidoDocument('payment',next);return '';}
    catch(error){return (error as Error).message;}
  },{...paymentData,receipt:{...paymentData.receipt,totalCents:1}});
  expect(rejection).toContain('Los importes del pedido cambiaron');
});
