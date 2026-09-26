const {spawn, execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');

const root = path.resolve(__dirname, '../..');
const php = process.env.TONY_TEST_PHP || (process.platform === 'win32' ? 'C:\\wamp64\\bin\\php\\php7.4.9\\php.exe' : 'php');
async function freePort() {
  return new Promise((resolve,reject) => {const socket=net.createServer();socket.once('error',reject);socket.listen(0,'127.0.0.1',()=>{const port=socket.address().port;socket.close(()=>resolve(port));});});
}
async function startMock({port,origin='http://localhost:3000'}={}) {
  const privateDir=fs.mkdtempSync(path.join(os.tmpdir(),'tony-api-http-'));
  const selectedPort=port || await freePort();
  const env={...process.env,TONY_ENV:'test',TONY_API_MOCK:'true',TONY_APP_SECRET:'local-http-test-secret-never-use-in-production',TONY_PRIVATE_DIR:privateDir,TONY_PRICES_FILE:path.join(root,'data/pedido/prices.json'),TONY_CHECKOUT_FILE:path.join(root,'data/pedido/checkout.json'),TONY_FRONTEND_URL:origin,TONY_ALLOWED_ORIGINS:origin,TONY_AI_ENABLED:'false',TONY_WOMPI_ENABLED:'false',TONY_PANEL_ENABLED:'false',GEMINI_API_KEY:'',WOMPI_CLIENT_ID:'synthetic-test-merchant',WOMPI_CLIENT_SECRET:'synthetic-test-provider-secret',TONY_PANEL_TOKEN:''};
  const child=spawn(php,['-d','post_max_size=25M','-d','upload_max_filesize=8M','-d','display_errors=0','-S',`127.0.0.1:${selectedPort}`,'-t',path.join(root,'backend/pedido-api')],{env,windowsHide:true,stdio:['ignore','ignore','pipe']});
  let startupError;child.on('error',error=>{startupError=error;});child.stderr.on('data',()=>{});
  const base=`http://127.0.0.1:${selectedPort}`;
  async function close(){
    if(child.exitCode===null){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited;}
    const resolved=path.resolve(privateDir);
    if(path.dirname(resolved)!==path.resolve(os.tmpdir())||!path.basename(resolved).startsWith('tony-api-http-'))throw new Error('Refusing unsafe cleanup');
    fs.rmSync(resolved,{recursive:true,force:true});
  }
  try {
    for(let i=0;i<60;i++){
      if(startupError)throw startupError;
      if(child.exitCode!==null)throw new Error('PHP mock server exited unexpectedly');
      try{const response=await fetch(`${base}/session.php`,{method:'OPTIONS',headers:{Origin:origin},signal:AbortSignal.timeout(300)});if(response.status===204)return {base,origin,close,fixtures:JSON.parse(execFileSync(php,[path.join(__dirname,'fixtures.php')],{encoding:'utf8',windowsHide:true}))};}catch{}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    throw new Error('PHP mock server did not start');
  }catch(error){await close();throw error;}
}
module.exports={startMock};
if(require.main===module)startMock({port:Number(process.env.TONY_TEST_PORT||8787),origin:process.env.TONY_TEST_ORIGIN||'http://localhost:3000'}).then(server=>{
  console.log(`Local mock API: ${server.base}; allowed frontend: ${server.origin}; no external services.`);
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close().then(()=>process.exit(0)));
}).catch(error=>{console.error(error.message);process.exitCode=1;});
