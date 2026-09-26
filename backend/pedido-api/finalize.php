<?php
require __DIR__.'/ai.php';
pedido_run('POST',function($session){return pedido_ai('finalize',$session);});
