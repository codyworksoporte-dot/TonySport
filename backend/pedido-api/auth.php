<?php
declare(strict_types=1);
require_once __DIR__.'/auth-service.php';
pedido_run('POST',function() {
    if ((int)($_SERVER['CONTENT_LENGTH']??0)>4096) pedido_fail('too_large','La solicitud de cuenta es demasiado grande.',413);
    return tony_auth_dispatch(pedido_json());
},true);
