const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const ts=require('typescript');
const {startMock}=require('./mock-server.cjs');

(async()=>{
  const root=path.resolve(__dirname,'../..');let assetHits=0;
  const artwork=fs.readFileSync(path.join(root,'public/assets/pedido/guides/welcome.webp'));
  const staticServer=http.createServer((req,res)=>{
    if(req.url==='/TonySport/assets/pedido/guides/welcome.webp'){assetHits++;res.writeHead(200,{'Content-Type':'image/webp','Content-Length':artwork.length});res.end(artwork);}else{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>staticServer.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${staticServer.address().port}`;
  const server=await startMock({origin});const originalFetch=global.fetch,originalWindow=global.window,originalStorage=global.sessionStorage;
  const storage=new Map();global.sessionStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};global.window={location:new URL(origin)};
  global.fetch=(url,init={})=>{if(String(url).startsWith(server.base+'/')){const headers=new Headers(init.headers);headers.set('Origin',origin);return originalFetch(url,{...init,headers});}return originalFetch(url,init);};
  const module={exports:{}};
  const compiled=ts.transpileModule(fs.readFileSync(path.join(root,'lib/pedido/api.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('require','module','exports','process',compiled)(id=>{if(id==='../asset-path')return {siteAsset:value=>'/TonySport'+value};throw new Error(`Unexpected import ${id}`);},module,module.exports,{env:{NEXT_PUBLIC_TONY_API_BASE:server.base}});
  const api=module.exports;let count=0;const check=(condition,label)=>{assert.ok(condition,label);count++;console.log(`PASS ${label}`);};
  try{
    await assert.rejects(api.verifyPayment('TONY-'+'A'.repeat(24)),/misma pestaña/);check(storage.size===0,'return never silently creates a new session');
    const order=structuredClone(server.fixtures.order);order.design.front='/assets/pedido/guides/welcome.webp';order.design.back='/TonySport/assets/pedido/guides/welcome.webp';
    const delivery=server.fixtures.delivery;const quote=await api.quotePedido(order,delivery);
    check(quote.totalCents===8394&&assetHits===1,'client resolves and deduplicates catalogue images with Pages prefix');
    check(order.design.front.startsWith('/assets/'),'normalization does not mutate editor draft');
    const created=await api.createPayment(order,delivery,quote.depositCents,'client-create-payment-0001');
    check(created.mock===true&&created.amountCents===quote.depositCents,'client verifies local mock link and exact cents');
    let verified=await api.verifyPayment(created.reference);
    check(verified.snapshot.order.design.front.startsWith('data:image/webp;base64,')&&!verified.paid&&verified.url===created.url,'backend recovers normalized snapshot and same pending link');
    const token=storage.get('tony:pedido:session:v279');
    await fetch(`${server.base}/mock-confirm.php`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({reference:created.reference})});
    verified=await api.verifyPayment(created.reference);check(verified.paid,'same session retrieves confirmed mock deposit');
    const receipt=await api.submitPedido({order,delivery,buyer:{...server.fixtures.buyer,email:''},payment:{method:'wompi',bank:'',reference:created.reference},signature:server.fixtures.signature,termsAccepted:true},'client-submit-order-00001');
    check(receipt.status==='confirmed'&&receipt.panelStatus==='sent'&&assetHits===1,'payment and submit snapshots match identical cached artwork');
    check((await api.trackPedido(receipt.id)).id===receipt.id,'client tracking contract matches server');
    check([...storage.keys()].length===1&&[...storage.keys()][0]==='tony:pedido:session:v279','client persists only opaque session token');
    for(const operation of ['generate','magic_eraser','finalize']){
      const auth=await (await fetch(`${server.base}/session.php`,{method:'POST'})).json();storage.set('tony:pedido:session:v279',auth.sessionToken);
      const fields=operation==='magic_eraser'?{side:'front',region:{x:.1,y:.1,width:.2,height:.2}}:operation==='finalize'?{side:'front',product:'shirt',assets:[{type:'Escudo',name:'Synthetic',data:server.fixtures.signature}]}:{side:'front',product:'shirt',gender:'Hombre',config:order.config};
      const result=await api.aiImage(operation,server.fixtures.signature,fields);check(result===server.fixtures.signature,`client multipart ${operation} interoperates with PHP mock`);
    }
    const foreign=structuredClone(order);foreign.design.front='https://untrusted.invalid/art.png';await assert.rejects(api.quotePedido(foreign,delivery),/catálogo Tony/);check(true,'foreign image URLs rejected without fetching');
    console.log(`All ${count} client/PHP integration checks passed using loopback only.`);
  }finally{global.fetch=originalFetch;global.window=originalWindow;global.sessionStorage=originalStorage;await server.close();await new Promise(resolve=>staticServer.close(resolve));}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
