<?php
declare(strict_types=1);
// Pure arithmetic bridge for the TS/PHP parity test. It never opens storage or calls a service.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
putenv('TONY_PRICES_FILE='.dirname(__DIR__,2).'/data/pedido/prices.json');
require __DIR__.'/../pedido-api/domain.php';
$raw=stream_get_contents(STDIN,16*1024*1024);
try{
    $cases=json_decode($raw,true,64,JSON_THROW_ON_ERROR);
    if(!is_array($cases)||count($cases)>1000)throw new RuntimeException('Invalid test cases');
    $results=[];foreach($cases as$case)$results[]=pedido_quote($case['order'],$case['deliveryKind']);
    echo json_encode($results,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
}catch(Throwable $e){fwrite(STDERR,'Price parity input failed.'.PHP_EOL);exit(1);}
