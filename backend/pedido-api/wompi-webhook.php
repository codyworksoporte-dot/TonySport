<?php
require __DIR__.'/services.php';
pedido_run('POST',function(){return pedido_webhook(pedido_raw(1048576),(string)($_SERVER['HTTP_WOMPI_HASH']??''));},true,true);
