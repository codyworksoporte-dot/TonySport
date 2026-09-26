<?php
declare(strict_types=1);
require_once __DIR__.'/services.php';
require_once __DIR__.'/prompts.php';

function pedido_uploaded(array $file,int $max=8388608): array {
    if(($file['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK||empty($file['tmp_name'])||!is_uploaded_file($file['tmp_name']))pedido_fail('upload_failed','No pudimos recibir la imagen.',400);
    $size=filesize($file['tmp_name']);if($size===false||$size>$max)pedido_fail('too_large','La imagen supera el tamaño permitido.',413);
    return pedido_image_bytes((string)file_get_contents($file['tmp_name']),'',$max);
}
function pedido_ai_input(string $operation): array {
    if(stripos($_SERVER['CONTENT_TYPE']??'','multipart/form-data')!==0)pedido_fail('content_type','Envía las imágenes como formulario multipart.',415);
    if(!isset($_FILES['image'])||!is_array($_FILES['image']))pedido_fail('image_required','Adjunta la imagen del uniforme.',400);
    foreach(array_keys($_FILES)as$key)if(!in_array($key,['image','assets'],true))pedido_fail('unexpected_upload','El archivo no corresponde a este formulario.');
    $total=0;foreach($_FILES as$file){$temps=is_array($file['tmp_name']??null)?$file['tmp_name']:[$file['tmp_name']??''];foreach($temps as$tmp)if(is_string($tmp)&&is_uploaded_file($tmp))$total+=(int)filesize($tmp);}if($total>24*1024*1024)pedido_fail('too_large','El conjunto de archivos supera 24 MB.',413);
    if($operation!=='finalize'&&isset($_FILES['assets']))pedido_fail('unexpected_upload','Los elementos adicionales solo se usan al finalizar.');
    $image=pedido_uploaded($_FILES['image']);$side=pedido_choice($_POST['side']??'front',['front','back'],'vista');
    $product=pedido_choice($_POST['product']??'uniform',['uniform','shirt'],'producto');
    $input=[['type'=>'image','mime_type'=>$image['mime'],'data'=>$image['data']]];
    if($operation==='generate'){
        $extra=pedido_text($_POST['placementRules']??$_POST['placement_rules']??$_POST['prompt']??'','indicaciones',4000,false);$prompt=pedido_prompt_generate($side,$extra,$product);
    }elseif($operation==='magic_eraser'){
        $rect=[];foreach(['x','y','w','h']as$key){$v=$_POST[$key]??null;if(!is_string($v)||!is_numeric($v)||!is_finite((float)$v)||(float)$v<0||(float)$v>1)pedido_fail('invalid_region','Selecciona una región válida para borrar.');$rect[$key]=(float)$v;}
        if($rect['w']<=0||$rect['h']<=0||$rect['x']+$rect['w']>1.00001||$rect['y']+$rect['h']>1.00001)pedido_fail('invalid_region','La región debe quedar dentro de la imagen.');
        $prompt=pedido_prompt_erase($side,$rect['x'],$rect['y'],$rect['w'],$rect['h']);
    }else{
        $prompt=pedido_prompt_finalize($side,$product);
        try{$meta=json_decode($_POST['assets_meta']??'[]',true,16,JSON_THROW_ON_ERROR);}catch(Throwable $e){pedido_fail('invalid_assets','Los elementos del diseño no son válidos.');}
        if(!is_array($meta)||count($meta)>8)pedido_fail('invalid_assets','Adjunta hasta 8 elementos originales.');
        if(isset($_FILES['assets'])){
            $files=$_FILES['assets'];if(!is_array($files['tmp_name']??null)||count($files['tmp_name'])>8)pedido_fail('too_many_assets','Adjunta hasta 8 elementos originales.');
            foreach($files['tmp_name']as$i=>$tmp){$asset=pedido_uploaded(['tmp_name'=>$tmp,'error'=>$files['error'][$i]??UPLOAD_ERR_NO_FILE],4194304);$label=$meta[$i]??[];
                if(!is_array($label))pedido_fail('invalid_assets','Los datos del elemento no son válidos.');
                $type=pedido_text($label['type']??'elemento','tipo de elemento',50);$name=pedido_text($label['name']??'original','nombre del elemento',100);
                $input[]=['type'=>'text','text'=>'Archivo original '.($i+1).': '.$type.' / '.$name];$input[]=['type'=>'image','mime_type'=>$asset['mime'],'data'=>$asset['data']];
            }
        }
    }
    $input[]=['type'=>'text','text'=>$prompt];return ['input'=>$input,'source'=>$image];
}
function pedido_extract_ai(array $response): array {
    $image=$response['output_image']??null;
    if(!$image)foreach(($response['steps']??[])as$step)foreach(($step['content']??[])as$content)if(($content['type']??'')==='image'&&!empty($content['data'])){$image=$content;break 2;}
    if(!is_array($image)||!is_string($image['data']??null)||!is_string($image['mime_type']??null)||strlen($image['data'])>16000000)pedido_fail('no_generated_image','No se recibió una imagen generada. Puedes conservar tu diseño e intentarlo después.',502);
    $bytes=base64_decode($image['data'],true);if($bytes===false)pedido_fail('invalid_generated_image','La imagen generada no es válida.',502);
    return pedido_image_bytes($bytes,$image['mime_type'],12000000);
}
function pedido_ai(string $operation,string $session): array {
    pedido_feature('TONY_AI_ENABLED');pedido_rate('ai-session:'.$session,8,3600);pedido_rate('ai-ip:'.pedido_ip(),20,3600);pedido_rate('ai-short:'.$session,2,60);
    $request=pedido_ai_input($operation);
    if(pedido_mock())return ['ok'=>true,'success'=>true,'image'=>'data:'.$request['source']['mime'].';base64,'.$request['source']['data'],'mime'=>$request['source']['mime'],'provider'=>'mock','model'=>'mock','fallback_used'=>false,'attempts'=>[],'mock'=>true];
    $key=pedido_env('GEMINI_API_KEY');if(!$key)pedido_fail('not_configured','La edición con IA aún no está configurada.',503);
    $model=pedido_env('GEMINI_IMAGE_MODEL','gemini-3-pro-image');$fallback=pedido_env('GEMINI_IMAGE_FALLBACK_MODEL','gemini-3.1-flash-image');
    $models=array_values(array_unique(array_filter([$model,$fallback])));$attempts=[];$last=null;
    foreach($models as$i=>$name){
        if(!preg_match('/^gemini-[a-z0-9.-]{1,80}$/D',$name))pedido_fail('invalid_model','El modelo de imágenes no está configurado correctamente.',503);
        try{
            $response=pedido_http('https://generativelanguage.googleapis.com/v1beta/interactions','POST',['Content-Type: application/json','x-goog-api-key: '.$key],json_encode(['model'=>$name,'input'=>$request['input'],'store'=>false,'response_format'=>['type'=>'image','mime_type'=>'image/jpeg','aspect_ratio'=>'3:4','image_size'=>'1K']],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),90,20000000);
            $image=pedido_extract_ai($response);$attempts[]=['model'=>$name,'status'=>200];
            return ['ok'=>true,'success'=>true,'image'=>'data:'.$image['mime'].';base64,'.$image['data'],'mime'=>$image['mime'],'provider'=>'gemini','model'=>$name,'fallback_used'=>$i>0,'attempts'=>$attempts];
        }catch(PedidoError $e){$last=$e;$attempts[]=['model'=>$name,'status'=>$e->status];if(!in_array($e->reason,['provider_busy','no_generated_image'],true))throw $e;}
    }
    if($last)throw $last;pedido_fail('ai_unavailable','No pudimos generar la imagen.',503);return [];
}
