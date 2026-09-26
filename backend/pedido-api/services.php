<?php
declare(strict_types=1);
require_once __DIR__.'/domain.php';

function pedido_feature(string $flag): void {
    if (!pedido_mock() && pedido_env($flag)!=='true') pedido_fail('not_configured','Este servicio todavía no está habilitado.',503);
}
function pedido_https(string $url): string {
    $parts=parse_url($url);
    if (!$parts || ($parts['scheme']??'')!=='https' || empty($parts['host']) || isset($parts['user']) || isset($parts['pass']) || isset($parts['fragment'])) pedido_fail('not_configured','La dirección del servicio no es válida.',503);
    return $url;
}
function pedido_http(string $url,string $method,array $headers,?string $body=null,int $timeout=30,int $max=25165824): array {
    if (pedido_mock()) pedido_fail('mock_external_blocked','Las pruebas no pueden llamar servicios externos.',503);
    pedido_https($url); $response=''; $oversize=false;
    $ch=curl_init($url);
    curl_setopt_array($ch,[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_HTTPHEADER=>$headers,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>$timeout,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_WRITEFUNCTION=>function($handle,$chunk)use(&$response,&$oversize,$max){if(strlen($response)+strlen($chunk)>$max){$oversize=true;return 0;}$response.=$chunk;return strlen($chunk);}]);
    if($body!==null)curl_setopt($ch,CURLOPT_POSTFIELDS,$body);
    $ok=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
    if($ok===false || $oversize) pedido_fail('provider_unavailable','El proveedor no respondió a tiempo. Comprueba el estado antes de volver a intentar.',502);
    if($status<200||$status>=300)pedido_fail(in_array($status,[408,429,500,502,503,504],true)?'provider_busy':'provider_rejected','El proveedor no pudo completar esta solicitud.',502);
    try{$data=json_decode($response,true,64,JSON_THROW_ON_ERROR);}catch(Throwable $e){pedido_fail('invalid_provider_response','El proveedor devolvió una respuesta no válida.',502);}
    if(!is_array($data))pedido_fail('invalid_provider_response','El proveedor devolvió una respuesta no válida.',502);
    return $data;
}
function pedido_wompi(string $method,string $path,?array $payload=null): array {
    pedido_feature('TONY_WOMPI_ENABLED');
    $client=pedido_env('WOMPI_CLIENT_ID');$secret=pedido_env('WOMPI_CLIENT_SECRET');
    if(!$client||!$secret)pedido_fail('not_configured','El pago en línea aún no está configurado.',503);
    // Fixed provider origins: never accept an endpoint or redirect from the browser.
    $oauth=pedido_http('https://id.wompi.sv/connect/token','POST',['Content-Type: application/x-www-form-urlencoded'],http_build_query(['grant_type'=>'client_credentials','audience'=>'wompi_api','client_id'=>$client,'client_secret'=>$secret]),20,1048576);
    if(empty($oauth['access_token'])||!is_string($oauth['access_token']))pedido_fail('provider_auth','No se pudo conectar con el proveedor de pago.',502);
    return pedido_http('https://api.wompi.sv'.$path,$method,['Authorization: Bearer '.$oauth['access_token'],'Content-Type: application/json','Accept: application/json'],$payload===null?null:json_encode($payload,JSON_THROW_ON_ERROR),30,2097152);
}
function pedido_cents($value): int {
    if(!is_int($value)&&!is_float($value))pedido_fail('invalid_payment_amount','El importe de la transacción no es válido.',409);
    if(!is_finite((float)$value)||$value<0||$value>1000000||abs($value*100-round($value*100))>0.00001)pedido_fail('invalid_payment_amount','El importe de la transacción no es válido.',409);
    return (int)round($value*100);
}
function pedido_payment_owned(string $reference,string $session): array {
    if(!preg_match('/^TONY-[A-F0-9]{24}$/D',$reference))pedido_fail('not_found','No encontramos este pedido en tu sesión.',404);
    $payment=pedido_get('payment',$reference);
    if(!$payment||!hash_equals($payment['owner'],$session))pedido_fail('not_found','No encontramos este pedido en tu sesión.',404);
    return $payment;
}
function pedido_create_payment(array $data,string $session): array {
    pedido_keys($data,['order','delivery','buyer','amountCents'],'solicitud de pago');
    pedido_feature('TONY_WOMPI_ENABLED');$o=pedido_order($data['order']??null,true);$d=pedido_delivery($data['delivery']??null);$q=pedido_quote($o,$d['kind']);
    if(($data['amountCents']??null)!==$q['depositCents'])pedido_fail('amount_mismatch','El anticipo debe coincidir con el 50% calculado por el servidor.',409);
    $buyer=!empty($data['buyer']['name'])?pedido_buyer($data['buyer']):null;
    pedido_rate('create-payment:'.$session,5,3600);
    return pedido_idempotent($session,'create-payment',$data,function()use($o,$d,$q,$buyer,$session){
        $ref=pedido_reference();$record=['reference'=>$ref,'owner'=>$session,'snapshot'=>['order'=>$o,'delivery'=>$d],'snapshotHash'=>pedido_hash(['order'=>$o,'delivery'=>$d]),'buyer'=>$buyer,'quote'=>$q,'amountCents'=>$q['depositCents'],'status'=>'creating','createdAt'=>gmdate(DATE_ATOM),'mock'=>pedido_mock()];
        pedido_put('payment',$ref,$record);
        if(pedido_mock()){
            $record['linkId']='mock-'.bin2hex(random_bytes(8));$record['url']=pedido_frontend().'/configurador?wompi_order='.rawurlencode($ref).'&mock_payment=1';
        }else{
            $api=rtrim(pedido_https(pedido_env('TONY_API_PUBLIC_URL')),'/');$return=$api.'/wompi-retorno.php?order='.rawurlencode($ref);
            $result=pedido_wompi('POST','/EnlacePago',['identificadorEnlaceComercio'=>$ref,'monto'=>$q['depositCents']/100,'nombreProducto'=>'Anticipo 50% pedido Tony Sportswear','configuracion'=>['urlRedirect'=>$return,'urlRetorno'=>$return,'urlWebhook'=>$api.'/wompi-webhook.php','esMontoEditable'=>false,'esCantidadEditable'=>false,'cantidadPorDefecto'=>1,'duracionInterfazIntentoMinutos'=>30,'notificarTransaccionCliente'=>true],'limitesDeUso'=>['cantidadMaximaPagosExitosos'=>1,'cantidadMaximaPagosFallidos'=>5]]);
            if(!is_int($result['idEnlace']??null)||$result['idEnlace']<1||($result['estaProductivo']??null)!==true||!is_string($result['urlEnlace']??null)||pedido_origin($result['urlEnlace'])!=='https://lk.wompi.sv')pedido_fail('payment_link_invalid','No se pudo obtener un enlace de pago verificado.',502);
            $record['linkId']=$result['idEnlace'];$record['url']=$result['urlEnlace'];
        }
        $record['status']='pending';pedido_put('payment',$ref,$record);
        return ['ok'=>true,'url'=>$record['url'],'reference'=>$ref,'idEnlace'=>$record['linkId'],'amountCents'=>$q['depositCents'],'quote'=>$q,'status'=>'pending','mock'=>pedido_mock()];
    });
}
function pedido_assert_transaction(array $p,array $link,array $tx): string {
    if(($link['idAplicativo']??null)!==pedido_env('WOMPI_CLIENT_ID')||($link['nombreEnlace']??null)!==$p['reference']||(string)($link['idEnlace']??'')!==(string)$p['linkId']||($link['estaProductivo']??null)!==true||pedido_cents($link['monto']??null)!==$p['amountCents'])pedido_fail('payment_identity_mismatch','No coincide la identidad del enlace de pago.',409);
    $id=$tx['idTransaccion']??null;
    if(!is_string($id)||!preg_match('/^[a-zA-Z0-9-]{8,100}$/D',$id)||($tx['esAprobada']??null)!==true||($tx['esReal']??null)!==true||pedido_cents($tx['monto']??null)!==$p['amountCents'])pedido_fail('payment_not_verified','El anticipo todavía no se ha verificado.',409);
    $linked=$link['transacciones']??[];if(isset($link['transaccionCompra']))$linked[]=$link['transaccionCompra'];$found=false;
    foreach($linked as $entry)if(is_array($entry)&&($entry['idTransaccion']??null)===$id&&($entry['esAprobada']??null)===true&&($entry['esReal']??null)===true&&pedido_cents($entry['monto']??null)===$p['amountCents'])$found=true;
    if(!$found)pedido_fail('transaction_not_linked','La transacción no pertenece a este enlace.',409);
    return $id;
}
function pedido_mark_paid(array $p,string $transaction): array {
    return pedido_atomic(function()use($p,$transaction){
        $current=pedido_get('payment',$p['reference']);if(!$current)pedido_fail('not_found','El pago no existe.',404);
        $stmt=pedido_db()->prepare('SELECT reference FROM used_transactions WHERE transaction_id=?');$stmt->execute([$transaction]);$old=$stmt->fetchColumn();
        if($old!==false&&$old!==$p['reference'])pedido_fail('transaction_reused','La transacción ya fue aplicada a otro pedido.',409);
        if(($current['status']??'')==='deposit_paid'&&($current['transactionId']??'')!==$transaction)pedido_fail('payment_already_settled','El anticipo ya fue acreditado.',409);
        $stmt=pedido_db()->prepare('INSERT OR IGNORE INTO used_transactions(transaction_id,reference) VALUES(?,?)');$stmt->execute([$transaction,$p['reference']]);
        $current['status']='deposit_paid';$current['transactionId']=$transaction;$current['paidAt']=$current['paidAt']??gmdate(DATE_ATOM);pedido_put('payment',$p['reference'],$current);return $current;
    });
}
function pedido_verify_payment(array $p,?string $transaction=null): array {
    if($p['status']==='deposit_paid')return $p;
    if(!isset($p['linkId']))return $p;
    if(pedido_mock())return $p; // Test acknowledgement is a separate localhost-only endpoint.
    $link=pedido_wompi('GET','/EnlacePago/'.rawurlencode((string)$p['linkId']));
    if($transaction===null){$entries=$link['transacciones']??[];if(isset($link['transaccionCompra']))$entries[]=$link['transaccionCompra'];foreach($entries as $entry)if(is_array($entry)&&($entry['esAprobada']??null)===true){$transaction=$entry['idTransaccion']??null;break;}}
    if(!$transaction)return $p;
    if(!preg_match('/^[a-zA-Z0-9-]{8,100}$/D',$transaction))pedido_fail('invalid_transaction','La transacción no es válida.',409);
    $tx=pedido_wompi('GET','/TransaccionCompra/'.rawurlencode($transaction));
    if(($tx['idTransaccion']??null)!==$transaction)pedido_fail('transaction_mismatch','La transacción no coincide.',409);
    return pedido_mark_paid($p,pedido_assert_transaction($p,$link,$tx));
}
function pedido_webhook(string $raw,string $hash): array {
    pedido_feature('TONY_WOMPI_ENABLED');$secret=pedido_env('WOMPI_CLIENT_SECRET');
    if(!$secret||!preg_match('/^[a-fA-F0-9]{64}$/D',$hash)||!hash_equals(hash_hmac('sha256',$raw,$secret),strtolower($hash)))pedido_fail('invalid_signature','Firma del webhook no válida.',403);
    try{$event=json_decode($raw,true,32,JSON_THROW_ON_ERROR);}catch(Throwable $e){pedido_fail('invalid_webhook','El webhook no es válido.',400);}
    if(!is_array($event))pedido_fail('invalid_webhook','El webhook no es válido.',400);
    if(($event['ResultadoTransaccion']??'')!=='ExitosaAprobada')return ['ok'=>true,'ignored'=>true];
    $ref=$event['EnlacePago']['IdentificadorEnlaceComercio']??'';$p=is_string($ref)?pedido_get('payment',$ref):null;
    if(!$p)pedido_fail('not_found','No existe este enlace.',404);
    if(($event['Aplicativo']['Id']??null)!==pedido_env('WOMPI_CLIENT_ID')||(string)($event['EnlacePago']['Id']??'')!==(string)($p['linkId']??'')||($event['EsProductiva']??null)!==true||pedido_cents($event['Monto']??null)!==$p['amountCents'])pedido_fail('webhook_mismatch','El webhook no coincide con el enlace.',409);
    $transaction=$event['IdTransaccion']??'';if(!is_string($transaction)||!preg_match('/^[a-zA-Z0-9-]{8,100}$/D',$transaction))pedido_fail('invalid_transaction','La transacción no es válida.',400);
    if($p['status']==='deposit_paid'&&($p['transactionId']??'')!==$transaction)pedido_fail('payment_already_settled','El anticipo ya fue acreditado.',409);
    pedido_verify_payment($p,$transaction);return ['ok'=>true];
}
function pedido_signature($value): string {
    $image=pedido_data_image($value,'firma',true,'image/png',1048576);$bytes=base64_decode(substr($image,strpos($image,',')+1),true);$size=getimagesizefromstring($bytes);
    if($size[0]<64||$size[1]<24||$size[0]>2048||$size[1]>1024)pedido_fail('invalid_signature_image','Dibuja tu firma en el espacio indicado.');
    $gd=@imagecreatefromstring($bytes);if(!$gd)pedido_fail('invalid_signature_image','La firma no es válida.');
    $colors=[];for($y=0;$y<$size[1];$y+=max(1,(int)floor($size[1]/100)))for($x=0;$x<$size[0];$x+=max(1,(int)floor($size[0]/200))){$pixel=imagecolorat($gd,$x,$y);$colors[$pixel]=true;if(count($colors)>1)break 2;}imagedestroy($gd);
    if(count($colors)<2)pedido_fail('blank_signature','Dibuja tu firma antes de confirmar.');return $image;
}
function pedido_receipt(array $record): array {
    return ['id'=>$record['id'],'reference'=>$record['id'],'status'=>$record['status'],'paymentStatus'=>$record['payment']['status'],'panelStatus'=>$record['panelStatus'],'currency'=>'USD','totalCents'=>$record['quote']['totalCents'],'depositCents'=>$record['quote']['depositCents'],'balanceCents'=>$record['quote']['balanceCents'],'createdAt'=>$record['createdAt'],'mock'=>$record['mock']];
}
function pedido_panel_send(array $record): bool {
    if(pedido_mock())return true;
    $url=pedido_https(pedido_env('TONY_PANEL_URL'));$token=pedido_env('TONY_PANEL_TOKEN');if(!$token)pedido_fail('not_configured','El envío del pedido aún no está configurado.',503);
    // The server's validated total and payment status replace every client assertion.
    $payload=['id'=>$record['id'],'version'=>279,'order'=>$record['order'],'buyer'=>$record['buyer'],'delivery'=>$record['delivery'],'payment'=>$record['payment'],'signature'=>$record['signature'],'termsAccepted'=>true,'termsVersion'=>$record['termsVersion'],'designs'=>['front'=>$record['order']['design']['finalFront'],'back'=>$record['order']['design']['finalBack']],'quote'=>$record['quote']];
    $result=pedido_http($url,'POST',['Content-Type: application/json','X-Tony-Token: '.$token,'Idempotency-Key: '.$record['id']],json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR),30,1048576);
    if(($result['ok']??null)!==true&&($result['success']??null)!==true)pedido_fail('panel_not_acknowledged','El pedido está guardado y pendiente de confirmación de recepción.',502);
    if(isset($result['id'])&&$result['id']!==$record['id'])pedido_fail('panel_reference_mismatch','El pedido está guardado y pendiente de confirmación de recepción.',502);
    return true;
}
function pedido_submit(array $data,string $session): array {
    pedido_keys($data,['order','buyer','delivery','payment','signature','termsAccepted','designs'],'solicitud');
    pedido_feature('TONY_PANEL_ENABLED');
    $o=pedido_order($data['order']??null,true);$d=pedido_delivery($data['delivery']??null);$b=pedido_buyer($data['buyer']??null);$q=pedido_quote($o,$d['kind']);
    if(($data['termsAccepted']??false)!==true)pedido_fail('terms_required','Acepta las condiciones antes de confirmar.');$signature=pedido_signature($data['signature']??null);
    if(isset($data['designs'])&&(!is_array($data['designs'])||($data['designs']['front']??null)!==$o['design']['finalFront']||($data['designs']['back']??null)!==$o['design']['finalBack']))pedido_fail('design_snapshot_mismatch','Las imágenes finales no coinciden con el diseño aprobado.',409);
    $payment=$data['payment']??null;if(!is_array($payment))pedido_fail('payment_required','Selecciona la forma de pago.');
    pedido_keys($payment,['method','bank','receiptName','receiptData','reference'],'pago');
    pedido_choice($payment['method']??null,['wompi','transfer'],'forma de pago');$checkout=pedido_checkout();$ref='';$pay=[];$paidRecord=null;
    if($payment['method']==='wompi'){
        $ref=pedido_text($payment['reference']??null,'referencia',40);$paidRecord=pedido_payment_owned($ref,$session);
        if(!hash_equals($paidRecord['snapshotHash'],pedido_hash(['order'=>$o,'delivery'=>$d])))pedido_fail('payment_snapshot_changed','El diseño o la entrega cambió después de crear el anticipo.',409);
        if($paidRecord['buyer']!==null&&!hash_equals(pedido_hash($paidRecord['buyer']),pedido_hash($b)))pedido_fail('buyer_changed','El responsable no coincide con el anticipo.',409);
        if($paidRecord['quote']!==$q)pedido_fail('price_changed','El precio cambió después de crear el anticipo. Comunícate con Tony.',409);
        $paidRecord=pedido_verify_payment($paidRecord);
        if($paidRecord['status']!=='deposit_paid')pedido_fail('payment_pending','El anticipo todavía no se ha verificado.',409);
        $pay=['method'=>'wompi','status'=>'deposit_paid','reference'=>$ref,'amountCents'=>$q['depositCents'],'transactionId'=>$paidRecord['transactionId']];
    }else{
        $bank=pedido_choice($payment['bank']??null,array_column($checkout['banks'],'bank'),'banco');
        $proof=pedido_data_image($payment['receiptData']??null,'comprobante',true,'',6291456);$name=pedido_text($payment['receiptName']??'comprobante','nombre del comprobante',100);
        $pay=['method'=>'transfer','status'=>'awaiting_review','bank'=>$bank,'amountCents'=>$q['depositCents'],'receiptName'=>$name,'receiptData'=>$proof];
    }
    pedido_rate('submit:'.$session,8,3600);
    return pedido_idempotent($session,'submit',$data,function()use($o,$d,$b,$q,$signature,$pay,$checkout,$session,$ref){
        $id=$ref?:pedido_reference();
        $record=pedido_atomic(function()use($id,$o,$d,$b,$q,$signature,$pay,$checkout,$session){
            $old=pedido_get('order',$id);
            if($old){if(!hash_equals($old['submissionHash'],pedido_hash([$o,$d,$b,$signature,$pay])))pedido_fail('order_already_submitted','Este anticipo ya está asociado a un pedido confirmado.',409);return $old;}
            $new=['id'=>$id,'owner'=>$session,'status'=>$pay['method']==='wompi'?'confirmed':'transfer_review','panelStatus'=>'pending','order'=>$o,'delivery'=>$d,'buyer'=>$b,'quote'=>$q,'signature'=>$signature,'payment'=>$pay,'termsAccepted'=>true,'termsVersion'=>$checkout['termsVersion'],'submissionHash'=>pedido_hash([$o,$d,$b,$signature,$pay]),'createdAt'=>gmdate(DATE_ATOM),'mock'=>pedido_mock()];
            pedido_put('order',$id,$new);return $new;
        });
        $shouldSend=pedido_atomic(function()use($id){$current=pedido_get('order',$id);if(isset($current['panelAttemptedAt']))return false;$current['panelAttemptedAt']=gmdate(DATE_ATOM);pedido_put('order',$id,$current);return true;});
        if($shouldSend){
            $record=pedido_get('order',$id);
            try{pedido_panel_send($record);$record['panelStatus']='sent';$record['sentAt']=gmdate(DATE_ATOM);pedido_put('order',$id,$record);}catch(PedidoError $e){$record['panelStatus']='pending';$record['panelErrorCode']=$e->reason;pedido_put('order',$id,$record);}
        }else{$record=pedido_get('order',$id);}
        return ['ok'=>true,'receipt'=>pedido_receipt($record)];
    });
}
