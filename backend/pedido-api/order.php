<?php
require __DIR__.'/services.php';
pedido_run('GET',function($session){
    $id=(string)($_GET['id']??'');$record=preg_match('/^TONY-[A-F0-9]{24}$/D',$id)?pedido_get('order',$id):null;
    if(!$record||!hash_equals($record['owner'],$session))pedido_fail('not_found','No encontramos este pedido en tu sesión.',404);
    return ['ok'=>true,'receipt'=>pedido_receipt($record)];
});
