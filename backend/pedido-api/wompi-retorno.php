<?php
require __DIR__.'/core.php';
ini_set('display_errors','0');header('Cache-Control: no-store');header('Referrer-Policy: no-referrer');
try{
    $ref=(string)($_GET['order']??'');if(!preg_match('/^TONY-[A-F0-9]{24}$/D',$ref))$ref='';
    // Return parameters never change payment status. Only webhook/API reconciliation can do that.
    header('Location: '.pedido_frontend().'/configurador'.($ref?'?wompi_order='.rawurlencode($ref):''),true,303);
}catch(Throwable $e){http_response_code(503);echo 'El retorno no está configurado.';}
