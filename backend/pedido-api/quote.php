<?php
require __DIR__ . '/domain.php';
pedido_run('POST', function () {
    $data=pedido_json(); $order=pedido_order($data['order']??null); $delivery=pedido_delivery($data['delivery']??['kind'=>''],false);
    return ['ok'=>true,'quote'=>pedido_quote($order,$delivery['kind']),'version'=>279];
});
