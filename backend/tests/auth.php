<?php
declare(strict_types=1);
require_once __DIR__.'/../pedido-api/auth-service.php';
$private=sys_get_temp_dir().'/tony-auth-unit-'.bin2hex(random_bytes(6));mkdir($private,0700,true);
putenv('TONY_PRIVATE_DIR='.$private);putenv('TONY_ENV=test');putenv('TONY_API_MOCK=true');putenv('TONY_AUTH_ENABLED=true');
putenv('TONY_APP_SECRET=synthetic-auth-test-secret-not-for-production');putenv('TONY_FRONTEND_URL=http://localhost:3000/TonySport');
$count=0;
function check(bool $ok,string $name): void {global $count;$count++;if(!$ok)throw new RuntimeException('FAIL '.$name);echo 'PASS '.$name.PHP_EOL;}
function rejects(callable $work,string $code): void {try{$work();throw new RuntimeException('Expected '.$code);}catch(PedidoError $e){check($code===$e->reason,$code);}}
function call_auth(string $action,array $data=[]): array {return tony_auth_dispatch(array_merge($data,['action'=>$action]));}
function mailed(callable $work): string {
    global $private;$before=glob($private.'/mail-*.json');$work();$after=array_values(array_diff(glob($private.'/mail-*.json'),$before));
    check(count($after)===1,'one local-only mail captured');$mail=json_decode(file_get_contents($after[0]),true);
    check(strpos($mail['body'],'http://localhost:3000/TonySport/cuenta/#accion=')!==false,'configured return URL and fragment');
    preg_match('/token=([a-f0-9]{64})/',$mail['body'],$match);return $match[1];
}
$email='customer@example.test';$password='a long synthetic passphrase';
try {
    rejects(function(){call_auth('register',['email'=>"a@example.test\r\nBcc: other@example.test",'password'=>'long enough password']);},'invalid_email');
    rejects(function()use($email){call_auth('register',['email'=>$email,'password'=>'short']);},'weak_password');
    rejects(function(){tony_auth_password(str_repeat('a',73));},'weak_password');
    rejects(function(){call_auth('login',['email'=>[]]);},'invalid_input');
    $verify=mailed(function()use($email,$password){$r=call_auth('register',['email'=>$email,'password'=>$password]);check(!isset($r['token']),'registration never returns a secret');});
    $key=tony_auth_key($email);$pending=pedido_get('auth_pending',$key);
    check($pending['hash']!==$password&&password_verify($password,$pending['hash']),'password hash, never plaintext');
    check(pedido_get('auth_link',$verify)===null,'link secret stored only hashed');
    rejects(function()use($email,$password){call_auth('login',['email'=>$email,'password'=>$password]);},'invalid_credentials');
    rejects(function(){pedido_session_create();},'login_required');
    call_auth('verify',['token'=>$verify]);check(pedido_get('auth_user',$key)!==null,'verified account created');
    rejects(function()use($verify){call_auth('verify',['token'=>$verify]);},'invalid_link');
    rejects(function()use($email){call_auth('login',['email'=>$email,'password'=>'incorrect password']);},'invalid_credentials');
    $login=call_auth('login',['email'=>$email,'password'=>$password]);$_SERVER['HTTP_AUTHORIZATION']='Bearer '.$login['token'];
    check(strlen($login['token'])===64&&$login['user']['email']===$email,'verified login returns opaque session');
    check(!isset($login['user']['hash']),'public user has no credential hash');
    $owner=pedido_session();check($owner===hash('sha256','account:'.$login['user']['id']),'orders belong to account');
    check(call_auth('session')['user']===$login['user'],'session validation');
    $reset=mailed(function()use($email){call_auth('recover',['email'=>$email]);});
    $known=call_auth('recover',['email'=>'nobody@example.test']);
    check($known['message']==='Si ese correo tiene una cuenta, recibirás un enlace para crear una nueva contraseña.','no account enumeration in recovery response');
    rejects(function()use($reset){call_auth('verify',['token'=>$reset]);},'invalid_link');
    $newPassword='another long synthetic passphrase';call_auth('reset',['token'=>$reset,'password'=>$newPassword]);
    rejects(function(){pedido_session();},'session_expired');
    rejects(function()use($reset,$newPassword){call_auth('reset',['token'=>$reset,'password'=>$newPassword]);},'invalid_link');
    $login=call_auth('login',['email'=>$email,'password'=>$newPassword]);$_SERVER['HTTP_AUTHORIZATION']='Bearer '.$login['token'];check(pedido_session()===$owner,'account ownership stable across logins');
    rejects(function(){call_auth('change',['currentPassword'=>'wrong','password'=>'yet another long passphrase']);},'invalid_credentials');
    call_auth('change',['currentPassword'=>$newPassword,'password'=>$password]);rejects(function(){call_auth('session');},'session_expired');
    $login=call_auth('login',['email'=>$email,'password'=>$password]);$_SERVER['HTTP_AUTHORIZATION']='Bearer '.$login['token'];call_auth('logout');rejects(function(){pedido_session();},'session_expired');
    $expired=mailed(function(){call_auth('register',['email'=>'expired@example.test','password'=>'a separate synthetic passphrase']);});
    $link=pedido_get('auth_link',hash('sha256',$expired));$link['expiresAt']=time()-1;pedido_put('auth_link',hash('sha256',$expired),$link);
    rejects(function()use($expired){call_auth('verify',['token'=>$expired]);},'invalid_link');
    $stale=mailed(function(){call_auth('register',['email'=>'new@example.test','password'=>'first synthetic passphrase']);});
    $latest=mailed(function(){call_auth('register',['email'=>'new@example.test','password'=>'second synthetic passphrase']);});
    rejects(function()use($stale){call_auth('verify',['token'=>$stale]);},'invalid_link');call_auth('verify',['token'=>$latest]);
    $other=call_auth('login',['email'=>'new@example.test','password'=>'second synthetic passphrase']);$_SERVER['HTTP_AUTHORIZATION']='Bearer '.$other['token'];check(pedido_session()!==$owner,'different accounts never share order ownership');
    $session=pedido_get('auth_session',hash('sha256',$other['token']));$session['expiresAt']=time()-1;pedido_put('auth_session',hash('sha256',$other['token']),$session);rejects(function(){tony_auth_require();},'session_expired');
    for($i=0;$i<4;$i++)call_auth('recover',['email'=>'limited@example.test']);rejects(function(){call_auth('recover',['email'=>'limited@example.test']);},'rate_limit');
    putenv('TONY_AUTH_ENABLED=false');rejects(function(){call_auth('session');},'auth_unavailable');
    $guest=pedido_session_create();$_SERVER['HTTP_AUTHORIZATION']='Bearer '.$guest['sessionToken'];check(strlen(pedido_session())===64,'legacy order mode preserved until activation');
    putenv('TONY_AUTH_ENABLED=true');rejects(function(){pedido_session();},'session_expired');
    echo "All $count auth checks passed. No real emails sent.".PHP_EOL;
}finally {foreach(glob($private.'/*')as$file)@unlink($file);@rmdir($private);}
