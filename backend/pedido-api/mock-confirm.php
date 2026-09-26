<?php
require __DIR__.'/services.php';
pedido_run('POST',function($session){
    if(!pedido_mock())pedido_fail('not_found','No disponible.',404);
    $input=pedido_json();$p=pedido_payment_owned((string)($input['reference']??''),$session);
    $p=pedido_mark_paid($p,'mock-'.hash('sha256',$p['reference']));return ['ok'=>true,'status'=>$p['status'],'mock'=>true];
});
