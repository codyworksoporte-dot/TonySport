<?php
declare(strict_types=1);
require_once __DIR__.'/core.php';

function tony_auth_enabled(): bool { return pedido_env('TONY_AUTH_ENABLED') === 'true'; }
function tony_auth_email(array $data): string {
    $email = strtolower(trim((string)($data['email'] ?? '')));
    if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) pedido_fail('invalid_email', 'Escribe un correo electrónico válido.');
    return $email;
}
function tony_auth_key(string $email): string { return hash_hmac('sha256', 'account:'.$email, pedido_secret()); }
function tony_auth_password(string $password): void {
    $length = function_exists('mb_strlen') ? mb_strlen($password, 'UTF-8') : strlen($password);
    // Explicit bcrypt byte limit: never silently truncate a password.
    if ($length < 15 || strlen($password) > 72) pedido_fail('weak_password', 'Usa una frase de al menos 15 caracteres y hasta 72 bytes.');
}
function tony_auth_hash(string $password): string { return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]); }
function tony_auth_public(array $user): array { return ['id'=>$user['id'], 'email'=>$user['email']]; }
function tony_auth_mail(string $email, string $subject, string $message): void {
    if (pedido_mock()) {
        // Only permitted by core.php in local test/development. Never returned in HTTP responses.
        $path = pedido_env('TONY_PRIVATE_DIR').'/mail-'.bin2hex(random_bytes(8)).'.json';
        file_put_contents($path, json_encode(['to'=>$email,'subject'=>$subject,'body'=>$message], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), LOCK_EX); @chmod($path,0600); return;
    }
    $from = pedido_env('TONY_AUTH_MAIL_FROM');
    if (!filter_var($from, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $from)) pedido_fail('mail_not_configured', 'El correo de cuentas aún no está disponible. Inténtalo más tarde.', 503);
    $headers = ['From: Tony Sportswear <'.$from.'>', 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit'];
    if (!mail($email, '=?UTF-8?B?'.base64_encode($subject).'?=', $message, implode("\r\n", $headers))) pedido_fail('mail_unavailable', 'No pudimos enviar el correo. Vuelve a intentarlo más tarde.', 503);
}
function tony_auth_link(string $emailKey, string $kind, string $version, string $email): void {
    $token = bin2hex(random_bytes(32));
    pedido_put('auth_link', hash('sha256',$token), ['key'=>$emailKey,'kind'=>$kind,'version'=>$version,'expiresAt'=>time()+($kind==='verify'?86400:1800)]);
    $label = $kind==='verify' ? 'Confirma tu correo' : 'Recupera tu contraseña';
    // Fixed configured origin; fragment avoids including the secret in HTTP requests/referrers.
    $url = pedido_frontend().'/cuenta/#accion='.$kind.'&token='.$token;
    tony_auth_mail($email, $label.' · Tony Sportswear', $label." en Tony Sportswear:\n\n".$url."\n\nEste enlace se usa una sola vez y vence en ".($kind==='verify'?'24 horas':'30 minutos').".\nSi no lo solicitaste, ignora este mensaje. Nunca compartas tu contraseña.");
}
function tony_auth_require(): array {
    $header = (string)($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (!preg_match('/^Bearer ([a-f0-9]{64})$/D', $header, $match)) pedido_fail('login_required','Inicia sesión para continuar.',401);
    $id = hash('sha256',$match[1]); $session = pedido_get('auth_session',$id);
    $user = $session ? pedido_get('auth_user',$session['key']) : null;
    if (!$session || !$user || $session['expiresAt']<=time() || $session['version']!==$user['version']) pedido_fail('session_expired','Tu sesión venció. Inicia sesión de nuevo.',401);
    return ['user'=>$user,'key'=>$session['key'],'sessionId'=>$id,'token'=>$match[1],'expiresAt'=>$session['expiresAt']];
}
function tony_auth_consume(string $token, string $kind, callable $work): array {
    if (!preg_match('/^[a-f0-9]{64}$/D',$token)) pedido_fail('invalid_link','El enlace no es válido o ya venció. Solicita uno nuevo.');
    return pedido_atomic(function() use ($token,$kind,$work) {
        $id=hash('sha256',$token); $link=pedido_get('auth_link',$id);
        if (!$link || $link['kind']!==$kind || $link['expiresAt']<=time() || !empty($link['used'])) pedido_fail('invalid_link','El enlace no es válido o ya venció. Solicita uno nuevo.');
        $result=$work($link); $link['used']=true; pedido_put('auth_link',$id,$link); return $result;
    });
}
function tony_auth_dispatch(array $data): array {
    if (!tony_auth_enabled()) pedido_fail('auth_unavailable','El acceso con cuenta aún no está habilitado.',503);
    $action=(string)($data['action']??'');
    $allowed=['action','email','password','currentPassword','token'];
    foreach($data as $field=>$value) if (!in_array($field,$allowed,true) || !is_string($value) || strlen($value)>300) pedido_fail('invalid_input','Revisa los datos de la cuenta.');
    pedido_rate('auth:'.$action.':'.pedido_ip(), $action==='session'?90:20, 900);
    if (in_array($action,['register','login','recover','resend'],true)) {
        $email=tony_auth_email($data); $key=tony_auth_key($email);
        pedido_rate('auth:'.$action.':'.$key, $action==='login'?10:4, 900);
    }
    if ($action==='register') {
        $password=(string)($data['password']??''); tony_auth_password($password); $hash=tony_auth_hash($password);
        $pending=pedido_atomic(function() use ($key,$email,$hash) {
            if (pedido_get('auth_user',$key)) return null;
            $row=['email'=>$email,'hash'=>$hash,'version'=>bin2hex(random_bytes(16)),'expiresAt'=>time()+86400];
            pedido_put('auth_pending',$key,$row); return $row;
        });
        if ($pending) tony_auth_link($key,'verify',$pending['version'],$email);
        return ['ok'=>true,'message'=>'Si el correo puede registrarse, recibirás un enlace para confirmarlo. Si ya tienes cuenta, inicia sesión o recupera tu contraseña.'];
    }
    if ($action==='resend') {
        $pending=pedido_get('auth_pending',$key);
        if ($pending && $pending['expiresAt']>time() && !pedido_get('auth_user',$key)) tony_auth_link($key,'verify',$pending['version'],$email);
        return ['ok'=>true,'message'=>'Si hay un registro pendiente, recibirás un nuevo enlace de confirmación.'];
    }
    if ($action==='verify') {
        return tony_auth_consume((string)($data['token']??''),'verify',function($link) {
            $pending=pedido_get('auth_pending',$link['key']);
            if (!$pending || $pending['version']!==$link['version'] || $pending['expiresAt']<=time() || pedido_get('auth_user',$link['key'])) pedido_fail('invalid_link','El enlace ya no está vigente. Inicia sesión o solicita otro.');
            pedido_put('auth_user',$link['key'],['id'=>bin2hex(random_bytes(16)),'email'=>$pending['email'],'hash'=>$pending['hash'],'version'=>bin2hex(random_bytes(16)),'verifiedAt'=>time()]);
            $delete=pedido_db()->prepare('DELETE FROM records WHERE bucket=? AND id=?');$delete->execute(['auth_pending',$link['key']]);
            return ['ok'=>true,'message'=>'Correo confirmado. Ya puedes iniciar sesión.'];
        });
    }
    if ($action==='login') {
        $user=pedido_get('auth_user',$key);
        // A fixed cost-12 dummy hash performs the same password work for unknown accounts.
        $hash=$user['hash']??'$2y$12$9wmXmNXIqVBgvHR0gNwtZezXF95S.hsfrDhLF71ZXgDbSVhbHIGB2';
        $password=(string)($data['password']??'');
        if (strlen($password)>72 || !password_verify($password,$hash) || !$user) pedido_fail('invalid_credentials','No pudimos iniciar sesión. Revisa tus datos y confirma tu correo.',401);
        $token=bin2hex(random_bytes(32)); $expires=time()+8*3600;
        // Re-check under the same lock as reset/change to avoid issuing a session with stale credentials.
        pedido_atomic(function() use ($key,$user,$token,$expires) {
            $current=pedido_get('auth_user',$key);
            if (!$current || $current['version']!==$user['version']) pedido_fail('invalid_credentials','Vuelve a iniciar sesión.',401);
            pedido_put('auth_session',hash('sha256',$token),['key'=>$key,'version'=>$user['version'],'expiresAt'=>$expires]);
        });
        return ['ok'=>true,'token'=>$token,'user'=>tony_auth_public($user),'expiresAt'=>$expires];
    }
    if ($action==='recover') {
        $user=pedido_get('auth_user',$key);
        if ($user) tony_auth_link($key,'reset',$user['version'],$email);
        return ['ok'=>true,'message'=>'Si ese correo tiene una cuenta, recibirás un enlace para crear una nueva contraseña.'];
    }
    if ($action==='reset') {
        $password=(string)($data['password']??'');tony_auth_password($password);$hash=tony_auth_hash($password);
        return tony_auth_consume((string)($data['token']??''),'reset',function($link) use ($hash) {
            $user=pedido_get('auth_user',$link['key']);
            if (!$user || $user['version']!==$link['version']) pedido_fail('invalid_link','El enlace ya no está vigente. Solicita uno nuevo.');
            $user['hash']=$hash;$user['version']=bin2hex(random_bytes(16));pedido_put('auth_user',$link['key'],$user);
            return ['ok'=>true,'message'=>'Contraseña actualizada. Las sesiones anteriores se cerraron. Inicia sesión con tu nueva contraseña.'];
        });
    }
    if (in_array($action,['session','logout','change'],true)) {
        $identity=tony_auth_require();
        if ($action==='session') return ['ok'=>true,'user'=>tony_auth_public($identity['user']),'expiresAt'=>$identity['expiresAt']];
        if ($action==='logout') {
            $delete=pedido_db()->prepare('DELETE FROM records WHERE bucket=? AND id=?');$delete->execute(['auth_session',$identity['sessionId']]);
            return ['ok'=>true];
        }
        $password=(string)($data['password']??'');tony_auth_password($password);
        $currentPassword=(string)($data['currentPassword']??'');
        if (strlen($currentPassword)>72 || !password_verify($currentPassword,$identity['user']['hash'])) pedido_fail('invalid_credentials','La contraseña actual no es correcta.',422);
        $hash=tony_auth_hash($password);
        pedido_atomic(function() use ($identity,$hash) {
            $user=pedido_get('auth_user',$identity['key']);
            if (!$user || $user['version']!==$identity['user']['version']) pedido_fail('session_expired','Inicia sesión de nuevo.',401);
            $user['hash']=$hash;$user['version']=bin2hex(random_bytes(16));pedido_put('auth_user',$identity['key'],$user);
        });
        return ['ok'=>true,'message'=>'Contraseña actualizada. Inicia sesión de nuevo en tus dispositivos.'];
    }
    pedido_fail('invalid_action','Esta acción no está disponible.',400);
}
