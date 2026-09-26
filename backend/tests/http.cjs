const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {startMock}=require('./mock-server.cjs');

(async()=>{
  const server=await startMock();let checks=0;
  const check=(value,label)=>{assert.ok(value,label);checks++;console.log(`PASS ${label}`);};
  async function request(file,{method='POST',token,body,key,origin=server.origin,form}={}){
    const headers={};if(origin!==null)headers.Origin=origin;if(token)headers.Authorization=`Bearer ${token}`;if(key)headers['Idempotency-Key']=key;
    if(body!==undefined)headers['Content-Type']='application/json';
    const response=await fetch(`${server.base}/${file}`,{method,headers,body:form||(body===undefined?undefined:JSON.stringify(body)),redirect:'manual'});
    const text=await response.text();return {response,data:text?JSON.parse(text):null};
  }
  try{
    let r=await request('session.php',{method:'OPTIONS'});check(r.response.status===204&&r.response.headers.get('access-control-allow-origin')===server.origin,'exact-origin preflight');
    r=await request('session.php',{origin:server.origin+'.attacker.invalid'});check(r.response.status===403&&!r.response.headers.has('access-control-allow-origin'),'reject similar origin');
    r=await request('session.php',{origin:null});check(r.response.status===403,'reject absent browser origin');
    r=await request('session.php');const token=r.data.sessionToken;check(r.response.status===200&&token.length===64&&r.data.mock===true,'create bearer session');
    r=await request('quote.php',{body:{order:server.fixtures.order,delivery:server.fixtures.delivery}});check(r.response.status===401,'quote requires authentication');
    r=await request('quote.php',{token,body:{order:server.fixtures.order,delivery:server.fixtures.delivery}});check(r.response.status===200&&r.data.quote.totalCents===8394,'HTTP server recalculates quote');const quote=r.data.quote;
    const paymentBody={order:server.fixtures.order,delivery:server.fixtures.delivery,amountCents:quote.depositCents};
    r=await request('wompi-crear-pago.php',{token,key:'http-create-payment-00001',body:{...paymentBody,amountCents:1}});check(r.response.status===409,'reject manipulated deposit');
    r=await request('wompi-crear-pago.php',{token,key:'http-create-payment-00002',body:paymentBody});check(r.response.status===200&&r.data.mock===true&&!r.data.url.includes('wompi.sv'),'mock cannot emit live payment link');const payment=r.data;
    const repeated=await request('wompi-crear-pago.php',{token,key:'http-create-payment-00002',body:paymentBody});check(repeated.data.reference===payment.reference,'HTTP payment idempotency');
    r=await request(`wompi-verificar.php?order=${payment.reference}`,{method:'GET',token});check(r.data.paid===false&&r.data.snapshot.order.id===server.fixtures.order.id&&r.data.url===payment.url,'authorized snapshot and existing pending link recovery');
    const other=await request('session.php');r=await request(`wompi-verificar.php?order=${payment.reference}`,{method:'GET',token:other.data.sessionToken});check(r.response.status===404,'other session cannot inspect payment');
    const submit={...server.fixtures,payment:{method:'wompi',bank:'',reference:payment.reference},termsAccepted:true};delete submit.blankSignature;
    r=await request('tony-submit-order.php',{token,key:'http-submit-unpaid-00001',body:submit});check(r.response.status===409&&r.data.code==='payment_pending','unpaid submission blocked');
    r=await request('mock-confirm.php',{token,body:{reference:payment.reference}});check(r.data.status==='deposit_paid','explicit local mock confirmation');
    r=await request('tony-submit-order.php',{token,key:'http-submit-paid-0000001',body:submit});check(r.response.status===200&&r.data.receipt.status==='confirmed','verified payment and signed order accepted');const receipt=r.data.receipt;
    r=await request(`order.php?id=${receipt.id}`,{method:'GET',token});check(r.data.receipt.id===receipt.id&&!JSON.stringify(r.data).includes(server.fixtures.buyer.email),'tracking returns receipt without customer data');
    const changed=structuredClone(submit);changed.order.players[0].name='CHANGED';r=await request('tony-submit-order.php',{token,key:'http-submit-changed-00001',body:changed});check(r.response.status===409&&r.data.code==='payment_snapshot_changed','changed order cannot reuse payment');
    const checkout=JSON.parse(fs.readFileSync(path.join(__dirname,'../../data/pedido/checkout.json'),'utf8'));
    const transfer={...submit,payment:{method:'transfer',bank:checkout.banks[0].bank,receiptName:'fixture.png',receiptData:server.fixtures.signature}};
    r=await request('tony-submit-order.php',{token,key:'http-transfer-000000001',body:transfer});check(r.data.receipt.status==='transfer_review'&&r.data.receipt.paymentStatus==='awaiting_review','transfer remains pending review');
    r=await request('wompi-webhook.php',{origin:null,body:{ResultadoTransaccion:'ExitosaAprobada'}});check(r.response.status===403&&r.data.code==='invalid_signature','unsigned webhook blocked');
    const returned=await fetch(`${server.base}/wompi-retorno.php?order=${payment.reference}&esAprobada=true&idTransaccion=forged`,{redirect:'manual'});check(returned.status===303&&returned.headers.get('location')===`${server.origin}/configurador?wompi_order=${payment.reference}`,'return only redirects and ignores claimed payment');
    const bytes=Buffer.from(server.fixtures.signature.split(',')[1],'base64');
    for(const operation of ['generate','magic_eraser','finalize']){
      const auth=await request('session.php');const form=new FormData();form.set('image',new Blob([bytes],{type:'image/png'}),'fixture.png');form.set('side','front');
      if(operation==='magic_eraser'){form.set('x','0.1');form.set('y','0.1');form.set('w','0.2');form.set('h','0.2');}
      r=await request(`${operation}.php`,{token:auth.data.sessionToken,form});check(r.response.status===200&&r.data.mock===true&&r.data.provider==='mock',`multipart ${operation} isolated from provider`);
    }
    const invalidSession=await request('session.php');const bad=new FormData();bad.set('image',new Blob(['fake image'],{type:'image/png'}),'fake.png');
    r=await request('generate.php',{token:invalidSession.data.sessionToken,form:bad});check(r.response.status===422&&r.data.code==='invalid_image','reject spoofed image MIME');
    check(!JSON.stringify(receipt).includes('receiptData')&&!JSON.stringify(receipt).includes('signature'),'receipt omits private files');
    console.log(`All ${checks} HTTP checks passed. Only loopback services were used.`);
  }finally{await server.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
