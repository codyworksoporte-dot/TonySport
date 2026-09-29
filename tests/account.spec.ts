import {test,expect} from '@playwright/test';
import {spawn,type ChildProcess} from 'node:child_process';
import {mkdtempSync,readdirSync,readFileSync,unlinkSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

test.describe('real local PHP accounts',()=>{
  test.skip(process.env.TONY_AUTH_TEST!=='true','Run separately with TONY_AUTH_TEST=true and TONY_TEST_PHP.');
  let php:ChildProcess,privateDir:string;
  test.beforeAll(async()=>{
    privateDir=mkdtempSync(path.join(tmpdir(),'tony-auth-browser-'));
    php=spawn(process.env.TONY_TEST_PHP||'php',['-S','127.0.0.1:8931','-t','backend/pedido-api'],{windowsHide:true,stdio:'ignore',env:{...process.env,TONY_ENV:'test',TONY_API_MOCK:'true',TONY_AUTH_ENABLED:'true',TONY_PRIVATE_DIR:privateDir,TONY_APP_SECRET:'synthetic-browser-test-not-a-production-secret',TONY_FRONTEND_URL:'http://127.0.0.1:3000',TONY_ALLOWED_ORIGINS:'http://127.0.0.1:3000'}});
    await expect.poll(async()=>{try{return(await fetch('http://127.0.0.1:8931/auth.php')).status;}catch{return 0;}}).toBe(403);
  });
  test.afterAll(async()=>{
    if(php){php.kill();await new Promise<void>(resolve=>php.exitCode!==null?resolve():php.once('exit',()=>resolve()));}
    if(privateDir&&path.dirname(path.resolve(privateDir))===path.resolve(tmpdir())&&path.basename(privateDir).startsWith('tony-auth-browser-')){for(const name of readdirSync(privateDir))unlinkSync(path.join(privateDir,name));rmdirSync(privateDir);}
  });
  function mailLink(kind:string){const mails=readdirSync(privateDir).filter(x=>x.startsWith('mail-')).map(x=>JSON.parse(readFileSync(path.join(privateDir,x),'utf8')));const mail=mails.find(x=>x.body.includes(`accion=${kind}`));return mail?.body.match(/http:\/\/127\.0\.0\.1:3000\/cuenta\/#[^\s]+/)?.[0] as string;}
  test('browse freely; register, verify, sign in, guard orders, recover and change password',async({page})=>{
    test.setTimeout(120000);await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/colecciones');await expect(page.getByRole('heading',{name:'TODAS LAS LÍNEAS. TU IDENTIDAD.'})).toBeVisible();
    await page.goto('/configurador?diseno=TONY-012');await expect(page.getByRole('link',{name:'Iniciar sesión o crear cuenta'})).toBeVisible();
    await page.getByRole('link',{name:'Iniciar sesión o crear cuenta'}).click();
    await page.getByRole('button',{name:'Crear una cuenta',exact:true}).click();
    await page.getByLabel('Correo electrónico',{exact:true}).fill('browser@example.test');await page.getByLabel('Contraseña',{exact:true}).fill('my synthetic browser passphrase');
    await page.getByRole('button',{name:'Crear cuenta y verificar correo'}).click();await expect(page.getByRole('status').filter({hasText:'recibirás un enlace'})).toBeVisible();
    await page.goto(mailLink('verify'));await expect(page).not.toHaveURL(/token=/);await page.getByRole('button',{name:'Confirmar mi correo',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Correo confirmado'})).toBeVisible();
    await page.getByLabel('Correo electrónico',{exact:true}).fill('browser@example.test');await page.getByLabel('Contraseña',{exact:true}).fill('my synthetic browser passphrase');
    await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();await expect(page.getByRole('link',{name:/^Crear mi uniforme/})).toBeVisible();
    await page.getByRole('button',{name:'Cambiar contraseña',exact:true}).click();await page.getByLabel('Contraseña actual',{exact:true}).fill('my synthetic browser passphrase');await page.getByLabel('Nueva contraseña',{exact:true}).fill('a changed synthetic passphrase');await page.getByRole('button',{name:'Guardar nueva contraseña'}).click();
    await expect(page.getByRole('status').filter({hasText:'Contraseña actualizada'})).toBeVisible();
    await page.getByRole('button',{name:'Olvidé mi contraseña'}).click();await page.getByLabel('Correo electrónico',{exact:true}).fill('browser@example.test');await page.getByRole('button',{name:'Enviar enlace de recuperación'}).click();await expect(page.getByRole('status').filter({hasText:'recibirás un enlace'})).toBeVisible();
    await page.goto(mailLink('reset'));await page.getByLabel('Nueva contraseña',{exact:true}).fill('a recovered synthetic passphrase');await page.getByRole('button',{name:'Guardar nueva contraseña'}).click();await expect(page.getByRole('status').filter({hasText:'Contraseña actualizada'})).toBeVisible();
    await page.getByLabel('Correo electrónico',{exact:true}).fill('browser@example.test');await page.getByLabel('Contraseña',{exact:true}).fill('a recovered synthetic passphrase');await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();await expect(page.getByRole('link',{name:/^Crear mi uniforme/})).toBeVisible();
    await page.screenshot({path:'output/account-mobile-authenticated.png',fullPage:true});
    await page.goto('/carrito');await expect(page.getByRole('heading',{name:/TU CARRITO/i})).toBeVisible();await expect(page.getByRole('link',{name:'Iniciar sesión o crear cuenta'})).toHaveCount(0);
    await page.goto('/cuenta');await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await expect(page.getByRole('button',{name:'Iniciar sesión',exact:true})).toBeVisible();
    await page.goto('/configurador/archivo');await expect(page.getByRole('link',{name:'Iniciar sesión o crear cuenta'})).toBeVisible();
  });
});
