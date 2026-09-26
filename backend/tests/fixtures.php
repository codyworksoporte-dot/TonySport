<?php
declare(strict_types=1);
function test_image(bool $blank=false): string {
    $image=imagecreatetruecolor(200,80);$white=imagecolorallocate($image,255,255,255);$black=imagecolorallocate($image,0,0,0);imagefill($image,0,0,$white);
    if(!$blank){imagesetthickness($image,4);imageline($image,12,45,62,16,$black);imageline($image,62,16,102,62,$black);imageline($image,102,62,182,25,$black);}
    ob_start();imagepng($image);$bytes=ob_get_clean();imagedestroy($image);return 'data:image/png;base64,'.base64_encode($bytes);
}
function test_order(int $quantity=6): array {
    $players=[];for($i=1;$i<=$quantity;$i++)$players[]=['id'=>'field-'.$i,'name'=>'JUGADOR DE PRUEBA '.$i,'number'=>(string)$i,'size'=>'M'];$image=test_image();
    return ['version'=>279,'id'=>'fixture-order','product'=>'uniform','gender'=>'Hombre','quantity'=>$quantity,'teamName'=>'EQUIPO DE PRUEBA','notes'=>'','shortsNumber'=>true,'config'=>['mold'=>'Estándar','fabric'=>'Slim Fit','collar'=>'V','sleeve'=>'Corta','brand'=>'Propia','brand3d'=>false,'crest3d'=>false],'players'=>$players,'goalkeepers'=>[],'socks'=>['Negro'=>0,'Blanco'=>0,'Azul negro'=>0,'Rojo'=>0,'Azul bandera'=>0],'design'=>['source'=>'catalog','catalogCode'=>'TONY-001','front'=>$image,'back'=>$image,'finalFront'=>$image,'finalBack'=>$image,'approved'=>true,'layers'=>[]]];
}
function test_layer(string $type,string $key,string $side='front'): array {return ['id'=>$type.'-'.$key.'-'.$side,'type'=>$type,'name'=>$key,'side'=>$side,'designKey'=>$key,'data'=>test_image(),'x'=>50,'y'=>50,'width'=>20,'height'=>20,'rotation'=>0,'color'=>'#FFFFFF','fontSize'=>36,'visible'=>true];}
function test_complex_order(): array {
    $o=test_order();$o['config']=['mold'=>'Raglan','fabric'=>'Dryfit','collar'=>'Chino','sleeve'=>'Larga','brand'=>'Tony','brand3d'=>true,'crest3d'=>true];
    foreach(['M','M','2XL','3XL','4XL','XL']as$i=>$size)$o['players'][$i]['size']=$size;
    $o['goalkeepers']=[['id'=>'keeper-1','name'=>'PORTERO DE PRUEBA','number'=>'99','size'=>'2XL','color'=>'Amarillo']];$o['socks']['Negro']=3;$o['design']['source']='own';$o['design']['catalogCode']='';
    $o['design']['layers']=[test_layer('Escudo','same-crest'),test_layer('Escudo','same-crest','back'),test_layer('Marca','one-brand'),test_layer('Sponsor','same-sponsor'),test_layer('Sponsor','same-sponsor','back')];return $o;
}
function test_delivery(): array {return ['kind'=>'home','branch'=>'','department'=>'San Salvador','city'=>'Municipio de prueba','address'=>'Dirección sintética para pruebas','reference'=>''];}
function test_buyer(): array {return ['name'=>'CLIENTE DE PRUEBAS','dui'=>'00000000-0','phone'=>'7000-0000','email'=>'test@example.invalid'];}
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__)echo json_encode(['order'=>test_order(),'delivery'=>test_delivery(),'buyer'=>test_buyer(),'signature'=>test_image(),'blankSignature'=>test_image(true)],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
