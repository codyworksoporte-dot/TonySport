<?php
require __DIR__.'/services.php';
pedido_run('POST',function($session){return pedido_submit(pedido_json(),$session);});
