<?php
declare(strict_types=1);
require_once __DIR__ . '/core.php';

function pedido_prices(): array {
    static $table;
    if ($table) return $table;
    $path = pedido_env('TONY_PRICES_FILE');
    if (!$path || !is_file($path)) pedido_fail('not_configured', 'La tabla de precios aún no está configurada.', 503);
    $table = json_decode((string)file_get_contents($path), true, 32, JSON_THROW_ON_ERROR);
    if (($table['version'] ?? null) !== 279 || ($table['unit'] ?? '') !== 'cents') pedido_fail('price_version', 'La tabla de precios no es compatible.', 503);
    return $table;
}
function pedido_text($value, string $field, int $max = 120, bool $required = true): string {
    if (!is_string($value) || !mb_check_encoding($value, 'UTF-8') || mb_strlen($value) > $max || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', $value) || ($required && trim($value) === '')) pedido_fail('invalid_' . $field, 'Revisa el campo ' . $field . '.');
    return trim($value);
}
function pedido_int($value, string $field, int $min, int $max): int {
    if (!is_int($value) || $value < $min || $value > $max) pedido_fail('invalid_' . $field, 'Revisa la cantidad de ' . $field . '.'); return $value;
}
function pedido_choice($value, array $choices, string $field, bool $empty = false): string {
    if (!is_string($value) || (!in_array($value, $choices, true) && !($empty && $value === ''))) pedido_fail('invalid_' . $field, 'Selecciona una opción válida para ' . $field . '.'); return $value;
}
function pedido_bool($value, string $field): bool { if (!is_bool($value)) pedido_fail('invalid_' . $field, 'Revisa ' . $field . '.'); return $value; }
function pedido_array($value, string $field, int $max): array {
    if (!is_array($value) || !array_is_list_compat($value) || count($value) > $max) pedido_fail('invalid_' . $field, 'Revisa ' . $field . '.'); return $value;
}
function pedido_keys(array $value,array $allowed,string $field): void {
    foreach(array_keys($value)as$key)if(!in_array($key,$allowed,true))pedido_fail('unexpected_field','El campo '.$field.' contiene información no admitida.');
}
function pedido_image_bytes(string $bytes, string $expected = '', int $max = 8388608): array {
    if (!$bytes || strlen($bytes) > $max) pedido_fail('invalid_image_size', 'La imagen está vacía o supera el tamaño permitido.');
    $finfo = new finfo(FILEINFO_MIME_TYPE); $mime = $finfo->buffer($bytes);
    $size = @getimagesizefromstring($bytes);
    if (!in_array($mime, ['image/png', 'image/jpeg', 'image/webp'], true) || !$size || ($size['mime'] ?? '') !== $mime || ($expected && $expected !== $mime) || $size[0] < 1 || $size[1] < 1 || $size[0] * $size[1] > 20000000 || max($size[0], $size[1]) > 8192) pedido_fail('invalid_image', 'Usa una imagen PNG, JPG o WebP válida de hasta 20 megapíxeles.');
    return ['mime' => $mime, 'data' => base64_encode($bytes), 'width' => $size[0], 'height' => $size[1]];
}
function pedido_data_image($value, string $field, bool $required = true, string $mime = '', int $max = 8388608): ?string {
    if (!$required && ($value === null || $value === '')) return null;
    if (!is_string($value) || strlen($value) > (int)ceil($max * 4 / 3) + 100 || !preg_match('#^data:(image/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$#D', $value, $m)) pedido_fail('invalid_' . $field, 'Adjunta una imagen válida para ' . $field . '.');
    $bytes = base64_decode($m[2], true); if ($bytes === false) pedido_fail('invalid_' . $field, 'La imagen no es válida.');
    pedido_image_bytes($bytes, $mime ?: $m[1], $max); return $value;
}
function pedido_catalog($value): bool { return is_string($value) && preg_match('/^TONY-\d{3}$/D', $value) && (int)substr($value, 5) >= pedido_prices()['design']['catalogMin'] && (int)substr($value, 5) <= pedido_prices()['design']['catalogMax']; }
function pedido_order($value, bool $complete = false): array {
    if (!is_array($value)) pedido_fail('invalid_order', 'No pudimos leer el pedido.'); $p = pedido_prices(); $o = $value;
    pedido_keys($o,['version','id','product','gender','quantity','teamName','notes','shortsNumber','config','players','goalkeepers','socks','design'],'pedido');
    if (($o['version'] ?? null) !== 279) pedido_fail('invalid_version', 'La versión del pedido no es compatible.');
    pedido_text($o['id'] ?? null, 'pedido', 100); pedido_choice($o['product'] ?? null, array_keys($p['products']), 'producto');
    pedido_choice($o['gender'] ?? null, $p['genders'], 'género', !$complete);
    pedido_int($o['quantity'] ?? null, 'prendas', $complete ? $p['quantity']['min'] : 0, $p['quantity']['max']);
    pedido_text($o['teamName'] ?? null, 'equipo', 100, false); pedido_text($o['notes'] ?? null, 'notas', 2000, false); pedido_bool($o['shortsNumber'] ?? null, 'número de calzoneta');
    $c = $o['config'] ?? []; if (!is_array($c)) pedido_fail('invalid_config', 'Revisa la configuración.');
    pedido_keys($c,['mold','fabric','collar','sleeve','brand','brand3d','crest3d'],'configuración');
    foreach (['mold' => 'molds', 'fabric' => 'fabrics', 'collar' => 'collars', 'sleeve' => 'sleeves'] as $key => $table) pedido_choice($c[$key] ?? null, array_keys($p[$table]), $key, !$complete);
    pedido_choice($c['brand'] ?? null, $p['brands'], 'marca'); pedido_bool($c['brand3d'] ?? null, 'marca 3D'); pedido_bool($c['crest3d'] ?? null, 'escudo 3D');
    $players = pedido_array($o['players'] ?? null, 'jugadores', $p['quantity']['max']);
    if (count($players) !== $o['quantity']) pedido_fail('quantity_mismatch', 'La cantidad debe coincidir con los jugadores.');
    $keepers = pedido_array($o['goalkeepers'] ?? null, 'porteros', 20); $ids = [];
    foreach (['players' => $players, 'goalkeepers' => $keepers] as $kind => $entries) {
        foreach ($entries as $row) {
            if (!is_array($row)) pedido_fail('invalid_player', 'Revisa las filas de jugadores.');
            pedido_keys($row,$kind==='goalkeepers'?['id','name','number','size','color']:['id','name','number','size'],'jugador');
            $id = pedido_text($row['id'] ?? null, 'identificador', 100); if (isset($ids[$id])) pedido_fail('duplicate_player', 'Hay filas duplicadas.'); $ids[$id] = true;
            pedido_text($row['name'] ?? null, 'nombre de jugador', 70, $complete);
            $num = pedido_text($row['number'] ?? null, 'número', 3, $complete); if ($num !== '' && !preg_match('/^\d{1,3}$/D', $num)) pedido_fail('invalid_number', 'Usa números de jugador entre 0 y 999.');
            pedido_choice($row['size'] ?? null, $p['sizes'], 'talla', !$complete);
            if ($kind === 'goalkeepers') pedido_text($row['color'] ?? null, 'color del portero', 60, $complete);
        }
    }
    if (!is_array($o['socks'] ?? null) || count($o['socks']) !== count($p['socks']['colors'])) pedido_fail('invalid_socks', 'Revisa las medias.');
    foreach ($p['socks']['colors'] as $color) pedido_int($o['socks'][$color] ?? null, 'medias', 0, 999);
    $d = $o['design'] ?? null; if (!is_array($d)) pedido_fail('invalid_design', 'Revisa el diseño.');
    pedido_keys($d,['source','catalogCode','front','back','layers','approved','finalFront','finalBack'],'diseño');
    pedido_choice($d['source'] ?? null, ['catalog', 'own'], 'origen del diseño');
    if (!is_string($d['catalogCode'] ?? null) || ($d['catalogCode'] !== '' && !pedido_catalog($d['catalogCode']))) pedido_fail('invalid_catalog', 'Selecciona un diseño Tony válido.');
    if ($complete && $d['source'] === 'catalog' && !pedido_catalog($d['catalogCode'])) pedido_fail('missing_catalog', 'Selecciona tu diseño Tony.');
    pedido_bool($d['approved'] ?? null, 'aprobación de diseño');
    foreach (['front', 'back', 'finalFront', 'finalBack'] as $key) pedido_data_image($d[$key] ?? null, $key, $complete && in_array($key, ['finalFront', 'finalBack'], true));
    if ($complete && !$d['approved']) pedido_fail('design_not_approved', 'Aprueba ambas vistas del diseño antes de continuar.');
    $layerIds=[];$designKeys=[];
    foreach (pedido_array($d['layers'] ?? null, 'elementos del diseño', 40) as $layer) {
        if (!is_array($layer)) pedido_fail('invalid_layer', 'Revisa los elementos del diseño.');
        pedido_keys($layer,['id','side','type','name','designKey','data','text','x','y','width','height','rotation','color','fontSize','visible'],'elemento');
        pedido_text($layer['id'] ?? null, 'elemento', 100); pedido_text($layer['name'] ?? null, 'nombre de elemento', 100, false);
        if(isset($layerIds[$layer['id']]))pedido_fail('duplicate_layer','Hay elementos con el mismo identificador.');$layerIds[$layer['id']]=true;
        pedido_choice($layer['type'] ?? null, ['Escudo', 'Marca', 'Sponsor', 'Texto'], 'tipo de elemento'); pedido_choice($layer['side'] ?? null, ['front', 'back'], 'vista'); pedido_bool($layer['visible'] ?? null, 'visibilidad');
        if (isset($layer['designKey'])) pedido_text($layer['designKey'], 'diseño del elemento', 200, false);
        if (isset($layer['text'])) pedido_text($layer['text'], 'texto', 150, false);
        if (isset($layer['data'])) pedido_data_image($layer['data'], 'elemento', false, '', 4194304);
        if(!empty($layer['designKey'])&&!empty($layer['data'])){$identity=$layer['type'].':'.$layer['designKey'];$hash=hash('sha256',$layer['data']);if(isset($designKeys[$identity])&&!hash_equals($designKeys[$identity],$hash))pedido_fail('design_key_conflict','Los elementos con el mismo diseño deben usar el mismo archivo.');$designKeys[$identity]=$hash;}
        foreach (['x' => [0,100], 'y' => [0,100], 'width' => [0.01,100], 'height' => [0.01,100], 'rotation' => [-360,360], 'fontSize' => [1,300]] as $key => $limits) {
            $n = $layer[$key] ?? null; if ((!is_int($n) && !is_float($n)) || !is_finite((float)$n) || $n < $limits[0] || $n > $limits[1]) pedido_fail('invalid_layer_geometry', 'Revisa la posición y tamaño del elemento.');
        }
        if (!is_string($layer['color'] ?? null) || !preg_match('/^#[a-fA-F0-9]{6}$/D', $layer['color'])) pedido_fail('invalid_color', 'Selecciona un color válido.');
    }
    return $o;
}
function pedido_delivery($value, bool $complete = true): array {
    if (!is_array($value)) pedido_fail('invalid_delivery', 'Revisa los datos de entrega.');
    pedido_keys($value,['kind','branch','department','city','address','reference','latitude','longitude'],'entrega');
    $d = $value; pedido_choice($d['kind'] ?? null, ['pickup','home'], 'entrega', !$complete);
    foreach (['branch' => 100, 'department' => 50, 'city' => 100, 'address' => 300, 'reference' => 300] as $key => $max) pedido_text($d[$key] ?? '', $key, $max, $complete && ($d['kind'] === 'pickup' ? $key === 'branch' : in_array($key, ['department','city','address'], true)));
    if ($complete && $d['kind'] === 'pickup') {
        $checkout=pedido_checkout(); $names=$checkout['branches'];
        if (!in_array($d['branch'], $names, true)) pedido_fail('invalid_branch', 'Selecciona una sucursal válida.');
    }
    if ($complete && $d['kind'] === 'home') pedido_choice($d['department'], ['Ahuachapán','Cabañas','Chalatenango','Cuscatlán','La Libertad','La Paz','La Unión','Morazán','San Miguel','San Salvador','San Vicente','Santa Ana','Sonsonate','Usulután'], 'departamento');
    foreach (['latitude' => [-90,90], 'longitude' => [-180,180]] as $key => $range) if (isset($d[$key]) && ((!is_int($d[$key]) && !is_float($d[$key])) || !is_finite((float)$d[$key]) || $d[$key] < $range[0] || $d[$key] > $range[1])) pedido_fail('invalid_coordinates', 'La ubicación no es válida.');
    return $d;
}
function pedido_checkout(): array {
    $path=pedido_env('TONY_CHECKOUT_FILE'); if (!$path||!is_file($path)) pedido_fail('not_configured','Las opciones de entrega y pago aún no están configuradas.',503);
    return json_decode((string)file_get_contents($path),true,32,JSON_THROW_ON_ERROR);
}
function pedido_buyer($value): array {
    if (!is_array($value)) pedido_fail('invalid_buyer', 'Completa los datos del responsable.');
    pedido_keys($value,['name','dui','phone','email'],'responsable');
    $b = []; $b['name'] = pedido_text($value['name'] ?? null, 'nombre', 100); $b['dui'] = pedido_text($value['dui'] ?? null, 'DUI', 10); $b['phone'] = pedido_text($value['phone'] ?? null, 'teléfono', 20); $b['email'] = pedido_text($value['email'] ?? '', 'correo', 254, false);
    if (!preg_match('/^\d{8}-\d$/D', $b['dui'])) pedido_fail('invalid_dui', 'Escribe el DUI con formato 00000000-0.');
    if (!preg_match('/^(?:\+?503[ -]?)?[267]\d{3}[ -]?\d{4}$/D', $b['phone'])) pedido_fail('invalid_phone', 'Escribe un teléfono válido de El Salvador.');
    if ($b['email'] !== '' && !filter_var($b['email'], FILTER_VALIDATE_EMAIL)) pedido_fail('invalid_email', 'Escribe un correo válido.'); return $b;
}
function pedido_quote(array $o, string $deliveryKind = ''): array {
    $p = pedido_prices(); $c = $o['config']; $field = count(array_filter($o['players'], function ($r) { return $r['size'] !== ''; }));
    $unit = $p['products'][$o['product']]['cents']; $extra = 0;
    foreach (['mold'=>'molds','fabric'=>'fabrics','collar'=>'collars','sleeve'=>'sleeves'] as $key=>$table) $extra += $c[$key] === '' ? 0 : $p[$table][$c[$key]];
    $sizeFee = function ($rows) use ($p) { $sum = 0; foreach ($rows as $r) $sum += $p['sizeExtras'][$r['size']] ?? 0; return $sum; };
    $unique = function ($type) use ($o) { $keys=[]; foreach ($o['design']['layers'] as $l) if ($l['type'] === $type) $keys[] = ($l['designKey'] ?? '') ?: (($l['data'] ?? '') ?: ($l['name'] ?: $l['id'])); return count(array_unique($keys)); };
    $q = ['currency'=>'USD','fieldQuantity'=>$field,'baseCents'=>$field*$unit,'garmentExtrasCents'=>$field*$extra,'sizeExtrasCents'=>$sizeFee($o['players'])];
    $q['creationDesignCents'] = $o['design']['source'] === 'catalog' && pedido_catalog($o['design']['catalogCode']) ? 0 : $p['design']['creationCents'];
    $q['crestDesignCount']=$unique('Escudo'); $q['brandDesignCount']=$unique('Marca'); $q['sponsorCount']=count(array_filter($o['design']['layers'], function($l){return $l['type']==='Sponsor';}));
    $q['crestDesignCents']=$q['crestDesignCount']*$p['design']['crestCents']; $q['brandDesignCents']=$q['brandDesignCount']*$p['design']['brandCents']; $q['sponsorCents']=$q['sponsorCount']*$p['design']['sponsorCents'];
    $q['designServicesCents']=$q['creationDesignCents']+$q['crestDesignCents']+$q['brandDesignCents']+$q['sponsorCents'];
    $q['crest3dCents']=$c['crest3d']?$field*$p['design']['threeDPerTypePerFieldPlayerCents']:0; $q['brand3dCents']=$c['brand3d']?$field*$p['design']['threeDPerTypePerFieldPlayerCents']:0; $q['threeDCents']=$q['crest3dCents']+$q['brand3dCents'];
    $q['sockQuantity']=array_sum($o['socks']); $q['socksCents']=$q['sockQuantity']*$p['socks']['pairCents'];
    $q['freeKeeper']=$o['product']==='uniform'&&$field>=$p['keeper']['freeUniformFieldQuantity']; $keepers=$q['freeKeeper']?array_slice($o['goalkeepers'],1):$o['goalkeepers'];
    $q['paidKeeperCount']=count($keepers); $q['keeperSizeExtrasCents']=$sizeFee($keepers); $q['keeperCents']=count($keepers)*($unit+$extra)+$q['keeperSizeExtrasCents'];
    $q['discountCents']=$c['brand']==='Tony'&&$o['product']==='uniform'?$field*$p['tonyUniformDiscountCents']:0;
    $q['deliveryCents']=$deliveryKind===''?0:$p['delivery'][$deliveryKind];
    $q['totalCents']=max(0,$q['baseCents']+$q['garmentExtrasCents']+$q['sizeExtrasCents']+$q['designServicesCents']+$q['threeDCents']+$q['socksCents']+$q['keeperCents']-$q['discountCents']+$q['deliveryCents']);
    $q['depositCents']=(int)floor($q['totalCents']*$p['deposit']['numerator']/$p['deposit']['denominator']+0.5); $q['balanceCents']=$q['totalCents']-$q['depositCents']; return $q;
}
