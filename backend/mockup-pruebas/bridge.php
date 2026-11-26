<?php
// Install in its own directory alongside the existing mockup-prueba directory.
const TONY_PREVIEW_ORIGIN = 'https://codyworksoporte-dot.github.io';
const TONY_PREVIEW_MAX_BODY = 4718592;
const TONY_PREVIEW_MAX_IMAGE = 4194304;
const TONY_PREVIEW_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function tony_preview_headers(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Vary: Origin');
    if (($_SERVER['HTTP_ORIGIN'] ?? '') === TONY_PREVIEW_ORIGIN) {
        header('Access-Control-Allow-Origin: ' . TONY_PREVIEW_ORIGIN);
    }
}

function tony_preview_stop(int $status, string $message): void {
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

function tony_preview_image($path): bool {
    if (!is_string($path) || !is_uploaded_file($path) || filesize($path) > TONY_PREVIEW_MAX_IMAGE) return false;
    $info = @getimagesize($path);
    return $info && in_array($info['mime'], TONY_PREVIEW_TYPES, true) && $info[0] * $info[1] <= 20000000;
}

function tony_preview_validate(string $script): void {
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data;') !== 0) {
        tony_preview_stop(415, 'Envía el diseño como formulario de imágenes.');
    }
    $size = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($size <= 0 || $size > TONY_PREVIEW_MAX_BODY) tony_preview_stop(413, 'Reduce el tamaño del diseño.');

    $fields = ['side', 'product', 'placementRules', 'spec', 'x', 'y', 'w', 'h', 'assets_meta'];
    foreach ($_POST as $name => $value) {
        if (!in_array($name, $fields, true) || !is_string($value) || strlen($value) > 16000) {
            tony_preview_stop(422, 'Los datos del diseño no son válidos.');
        }
    }
    if (!in_array($_POST['side'] ?? '', ['front', 'back'], true)) tony_preview_stop(422, 'Selecciona la cara de la prenda.');
    if ($script === 'magic_eraser.php') {
        $region = [];
        foreach (['x', 'y', 'w', 'h'] as $axis) {
            $v = $_POST[$axis] ?? '';
            if (!is_numeric($v) || (float)$v < 0 || (float)$v > 1) tony_preview_stop(422, 'Selecciona una zona válida.');
            $region[$axis] = (float)$v;
        }
        if (!$region['w'] || !$region['h'] || $region['x'] + $region['w'] > 1.000001 || $region['y'] + $region['h'] > 1.000001) {
            tony_preview_stop(422, 'Selecciona una zona dentro de la imagen.');
        }
    }
    $assets = $_FILES['assets']['tmp_name'] ?? [];
    if (array_diff(array_keys($_FILES), ['image', 'assets']) || !is_array($assets) || count($assets) > 8 ||
        (isset($_FILES['assets']) && $script !== 'finalize.php') || !tony_preview_image($_FILES['image']['tmp_name'] ?? null)) {
        tony_preview_stop(422, 'Adjunta una imagen PNG, JPEG o WebP válida.');
    }
    foreach ($assets as $file) {
        if (!tony_preview_image($file)) tony_preview_stop(422, 'Revisa las imágenes de los elementos originales.');
    }
}

// Serialize each reservation before starting a provider call. The private file stores
// at most a day's worth of timestamps and salted IP hashes, never images or API keys.
function tony_preview_reserve(): void {
    $private = dirname(__DIR__, 2) . '/.tony-mockup-pruebas';
    if (!is_dir($private) && !@mkdir($private, 0700) && !is_dir($private)) {
        tony_preview_stop(503, 'El control de uso del generador no está disponible.');
    }
    $lock = @fopen($private . '/quota.lock', 'c+b');
    if (!$lock || !flock($lock, LOCK_EX)) tony_preview_stop(503, 'No se pudo reservar el uso del generador.');
    try {
        $path = $private . '/quota.json';
        $state = is_file($path) ? json_decode((string)@file_get_contents($path), true) : ['salt' => bin2hex(random_bytes(24)), 'calls' => []];
        if (!is_array($state) || !is_string($state['salt'] ?? null) || !is_array($state['calls'] ?? null)) {
            tony_preview_stop(503, 'El registro de uso del generador requiere revisión.');
        }
        $now = time();
        $client = hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown', $state['salt']);
        $day = [];
        $hour = 0;
        $personal = 0;
        foreach ($state['calls'] as $call) {
            if ($call[0] <= $now - 86400) continue;
            $day[] = $call;
            if ($call[0] > $now - 3600) {
                $hour++;
                if ($call[1] === $client) $personal++;
            }
        }
        if (count($day) >= 16 || $hour >= 8 || $personal >= 6) tony_preview_stop(429, 'Se alcanzó el límite de imágenes de la prueba. Inténtalo más tarde.');
        $day[] = [$now, $client];
        $state['calls'] = $day;
        $encoded = json_encode($state);
        // Keep the old, complete state if a worker is interrupted while writing.
        $pending = $private . '/quota.pending';
        if (file_put_contents($pending, $encoded) !== strlen($encoded) || !rename($pending, $path)) {
            tony_preview_stop(503, 'No se pudo registrar la reserva del generador.');
        }
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

// Runs on normal completion and on exit from the included official PHP script.
function tony_preview_response(string $output): string {
    $result = strlen($output) <= 13000000 ? json_decode($output, true) : null;
    $mime = $result['mime'] ?? '';
    $image = $result['image'] ?? null;
    if (is_array($result) && (($result['success'] ?? $result['ok'] ?? false) === true) &&
        in_array($mime, TONY_PREVIEW_TYPES, true) && is_string($image)) {
        $prefix = 'data:' . $mime . ';base64,';
        if (strncmp($image, $prefix, strlen($prefix)) === 0) {
            $bytes = base64_decode(substr($image, strlen($prefix)), true);
            $info = $bytes ? @getimagesizefromstring($bytes) : false;
            if ($info && $info['mime'] === $mime) {
                http_response_code(200);
                return json_encode(['ok' => true, 'success' => true, 'mime' => $mime, 'image' => $image], JSON_UNESCAPED_SLASHES);
            }
        }
    }
    $status = http_response_code();
    http_response_code($status === 429 ? 429 : 502);
    return json_encode(['success' => false, 'error' => $status === 429
        ? 'El proveedor alcanzó su límite de uso. Inténtalo más tarde.'
        : 'El generador de Tony no pudo devolver la imagen. Tu diseño se conserva.']);
}

function tony_preview_prepare(string $script): string {
    ini_set('display_errors', '0');
    tony_preview_headers();
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== TONY_PREVIEW_ORIGIN) tony_preview_stop(403, 'Origen no autorizado.');
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if ($method === 'OPTIONS') {
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        http_response_code(204);
        exit;
    }
    if ($method !== 'POST') tony_preview_stop(405, 'Utiliza POST para generar una imagen.');
    if (!in_array($script, ['generate.php', 'magic_eraser.php', 'finalize.php'], true)) tony_preview_stop(404, 'Operación desconocida.');
    $target = dirname(__DIR__) . '/mockup-prueba/' . $script;
    if (!is_file($target) || !is_readable($target)) tony_preview_stop(503, 'El generador de Tony no está disponible.');
    tony_preview_validate($script);
    tony_preview_reserve();
    // Older scripts set their own headers. Pass only the JSON and CORS headers
    // of this bridge to the preview site, even on an exit or a provider error.
    header_register_callback(static function () {
        header_remove();
        tony_preview_headers();
    });
    ob_start('tony_preview_response');
    return $target;
}
