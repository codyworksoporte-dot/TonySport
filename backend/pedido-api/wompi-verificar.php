<?php
require __DIR__.'/services.php';
pedido_run('GET',function($session){
    pedido_rate('verify:'.$session,30,60);
    $p=pedido_verify_payment(pedido_payment_owned((string)($_GET['order']??''),$session));
    $result=['ok'=>true,'paid'=>$p['status']==='deposit_paid','status'=>$p['status'],'reference'=>$p['reference'],'amountCents'=>$p['amountCents'],'quote'=>$p['quote'],'snapshot'=>$p['snapshot'],'mock'=>$p['mock']];
    // The link was validated when created, and is exposed only after the session ownership check above.
    if(isset($p['url'])&&is_string($p['url']))$result['url']=$p['url'];
    return $result;
});
