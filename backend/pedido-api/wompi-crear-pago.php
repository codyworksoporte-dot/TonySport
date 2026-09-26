<?php
require __DIR__.'/services.php';
pedido_run('POST',function($session){return pedido_create_payment(pedido_json(),$session);});
