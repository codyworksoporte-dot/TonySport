<?php
declare(strict_types=1);

// This package is deliberately independent of Next.js/GitHub Pages.
class PedidoError extends RuntimeException {
    public $status; public $reason;
    public function __construct(string $reason, string $message, int $status = 422) {
        parent::__construct($message); $this->status = $status; $this->reason = $reason;
    }
}
function pedido_fail(string $code, string $message, int $status = 422): void { throw new PedidoError($code, $message, $status); }
function pedido_env(string $name, string $default = ''): string { $value = getenv($name); return $value === false ? $default : trim($value); }
function pedido_mock(): bool {
    if (pedido_env('TONY_API_MOCK') !== 'true') return false;
    $env = pedido_env('TONY_ENV'); $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!in_array($env, ['test', 'development'], true) || (PHP_SAPI !== 'cli' && !in_array($ip, ['127.0.0.1', '::1'], true))) {
        pedido_fail('mock_forbidden', 'La simulación solo está disponible en pruebas locales.', 503);
    }
    if (PHP_SAPI !== 'cli') {
        $frontHost=parse_url(pedido_env('TONY_FRONTEND_URL'),PHP_URL_HOST);
        $requestHost=parse_url('http://'.($_SERVER['HTTP_HOST']??''),PHP_URL_HOST);
        if(!in_array($frontHost,['localhost','127.0.0.1','::1','[::1]'],true)||!in_array($requestHost,['localhost','127.0.0.1','::1','[::1]'],true)||isset($_SERVER['HTTP_X_FORWARDED_FOR']))pedido_fail('mock_forbidden','La simulación no está disponible a través de un dominio público o proxy.',503);
    }
    return true;
}
function pedido_secret(): string {
    $secret = pedido_env('TONY_APP_SECRET');
    if (strlen($secret) < 32) pedido_fail('not_configured', 'El servicio aún no está configurado.', 503);
    return $secret;
}
function pedido_frontend(): string {
    $url = rtrim(pedido_env('TONY_FRONTEND_URL'), '/'); $p = parse_url($url);
    if (!$p || empty($p['host']) || !empty($p['user']) || !empty($p['pass']) || !empty($p['query']) || !empty($p['fragment']) || (($p['scheme'] ?? '') !== 'https' && !(pedido_mock() && ($p['scheme'] ?? '') === 'http'))) {
        pedido_fail('not_configured', 'El servicio aún no está configurado.', 503);
    }
    return $url;
}
function pedido_origin(string $url): string {
    $p = parse_url($url); return ($p['scheme'] ?? '') . '://' . ($p['host'] ?? '') . (isset($p['port']) ? ':' . $p['port'] : '');
}
function pedido_allowed_origins(): array {
    $csv=pedido_env('TONY_ALLOWED_ORIGINS');$origins=$csv===''?[pedido_origin(pedido_frontend())]:array_map('trim',explode(',',$csv));
    foreach($origins as$origin){$p=parse_url($origin);$local=$p&&in_array($p['host']??'',['localhost','127.0.0.1','::1','[::1]'],true);
        if(!$p||empty($p['host'])||isset($p['user'])||isset($p['pass'])||isset($p['path'])||isset($p['query'])||isset($p['fragment'])||strpos($origin,'*')!==false||(($p['scheme']??'')!=='https'&&!(($p['scheme']??'')==='http'&&$local)))pedido_fail('not_configured','La lista de orígenes permitidos no está configurada correctamente.',503);
    }
    return array_values(array_unique($origins));
}
function pedido_db(): PDO {
    static $db;
    if ($db) return $db;
    $dir = pedido_env('TONY_PRIVATE_DIR');
    if (!$dir || !is_dir($dir) || !is_writable($dir)) pedido_fail('not_configured', 'El almacenamiento privado no está configurado.', 503);
    $real = str_replace('\\', '/', (string)realpath($dir));
    foreach ([__DIR__, $_SERVER['DOCUMENT_ROOT'] ?? ''] as $public) {
        if (!$public) continue;
        $root = rtrim(str_replace('\\', '/', (string)realpath($public)), '/');
        if ($root && (strcasecmp($real, $root) === 0 || stripos($real . '/', $root . '/') === 0)) pedido_fail('unsafe_storage', 'El almacenamiento debe estar fuera de la carpeta pública.', 503);
    }
    $db = new PDO('sqlite:' . $real . '/pedido.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout=5000');
    $db->exec('CREATE TABLE IF NOT EXISTS records (bucket TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(bucket,id))');
    $db->exec('CREATE TABLE IF NOT EXISTS used_transactions (transaction_id TEXT PRIMARY KEY, reference TEXT NOT NULL)');
    @chmod($real . '/pedido.sqlite', 0600);
    return $db;
}
function pedido_get(string $bucket, string $id): ?array {
    $stmt = pedido_db()->prepare('SELECT payload FROM records WHERE bucket=? AND id=?'); $stmt->execute([$bucket, $id]); $v = $stmt->fetchColumn();
    return $v === false ? null : json_decode($v, true, 64, JSON_THROW_ON_ERROR);
}
function pedido_put(string $bucket, string $id, array $value): void {
    $stmt = pedido_db()->prepare('INSERT OR REPLACE INTO records(bucket,id,payload) VALUES(?,?,?)');
    $stmt->execute([$bucket, $id, json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)]);
}
function pedido_atomic(callable $work) {
    $db = pedido_db(); $db->exec('BEGIN IMMEDIATE');
    try { $value = $work(); $db->exec('COMMIT'); return $value; }
    catch (Throwable $error) { $db->exec('ROLLBACK'); throw $error; }
}
function pedido_rate(string $scope, int $limit, int $window): void {
    $bucket = (int)floor(time() / $window); $id = hash_hmac('sha256', $scope . ':' . $bucket, pedido_secret());
    pedido_atomic(function () use ($id, $limit, $window) {
        $row = pedido_get('rate', $id) ?? ['count' => 0];
        if ($row['count'] >= $limit) pedido_fail('rate_limit', 'Espera un momento antes de intentarlo de nuevo.', 429);
        $row['count']++; $row['expiresAt'] = time() + $window; pedido_put('rate', $id, $row);
    });
}
function pedido_ip(): string { return (string)($_SERVER['REMOTE_ADDR'] ?? 'cli'); }
function pedido_session_create(): array {
    if (pedido_env('TONY_AUTH_ENABLED') === 'true') {
        require_once __DIR__.'/auth-service.php'; $identity=tony_auth_require();
        return ['ok'=>true,'sessionToken'=>$identity['token'],'expiresAt'=>gmdate(DATE_ATOM,$identity['expiresAt']),'mock'=>pedido_mock()];
    }
    pedido_rate('session:' . pedido_ip(), 12, 3600);
    $token = bin2hex(random_bytes(32)); $id = hash('sha256', $token); $expires = time() + 8 * 3600;
    pedido_put('session', $id, ['expiresAt' => $expires]);
    return ['ok' => true, 'sessionToken' => $token, 'expiresAt' => gmdate(DATE_ATOM, $expires), 'mock' => pedido_mock()];
}
function pedido_session(): string {
    if (pedido_env('TONY_AUTH_ENABLED') === 'true') {
        require_once __DIR__.'/auth-service.php'; $identity=tony_auth_require();
        // Stable account ownership across browser sessions. Guest order records are not reassigned.
        return hash('sha256','account:'.$identity['user']['id']);
    }
    $auth = (string)($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (!preg_match('/^Bearer ([a-f0-9]{64})$/D', $auth, $m)) pedido_fail('unauthorized', 'Vuelve a abrir tu sesión de pedido.', 401);
    $id = hash('sha256', $m[1]); $s = pedido_get('session', $id);
    if (!$s || ($s['expiresAt'] ?? 0) < time()) pedido_fail('session_expired', 'Tu sesión venció. Inicia otra para continuar.', 401);
    return $id;
}
function pedido_raw(int $max = 25165824): string {
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > $max) pedido_fail('too_large', 'Los archivos superan el límite de 24 MB.', 413);
    $stream = fopen('php://input', 'rb'); $raw = stream_get_contents($stream, $max + 1); fclose($stream);
    if (strlen($raw) > $max) pedido_fail('too_large', 'Los archivos superan el límite permitido.', 413);
    return $raw;
}
function pedido_json(): array {
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) pedido_fail('content_type', 'Envía los datos como JSON.', 415);
    try { $data = json_decode(pedido_raw(), true, 48, JSON_THROW_ON_ERROR); } catch (JsonException $e) { pedido_fail('invalid_json', 'Los datos enviados no son válidos.', 400); }
    if (!is_array($data) || array_is_list_compat($data)) pedido_fail('invalid_json', 'Los datos enviados no son válidos.', 400);
    return $data;
}
function array_is_list_compat(array $value): bool { return $value === [] || array_keys($value) === range(0, count($value) - 1); }
function pedido_canonical($value) {
    if (!is_array($value)) return $value;
    if (!array_is_list_compat($value)) ksort($value);
    foreach ($value as $key => $v) $value[$key] = pedido_canonical($v);
    return $value;
}
function pedido_hash(array $value): string { return hash('sha256', json_encode(pedido_canonical($value), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)); }
function pedido_idempotent(string $session, string $action, array $input, callable $work): array {
    $key = (string)($_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? '');
    if (!preg_match('/^[A-Za-z0-9_-]{16,100}$/D', $key)) pedido_fail('idempotency_required', 'Falta el identificador único de la solicitud.', 400);
    $id = hash('sha256', $session . ':' . $action . ':' . $key); $hash = pedido_hash($input);
    $existing = pedido_atomic(function () use ($id, $hash) {
        $old = pedido_get('idempotency', $id);
        if ($old) {
            if (!hash_equals($old['hash'], $hash)) pedido_fail('idempotency_conflict', 'Esta solicitud ya se utilizó con datos distintos.', 409);
            if (isset($old['response'])) return $old['response'];
            pedido_fail('request_pending', 'La solicitud está en proceso de comprobación. Conserva este identificador.', 409);
        }
        pedido_put('idempotency', $id, ['hash' => $hash, 'startedAt' => time()]); return null;
    });
    if ($existing !== null) return $existing;
    // Persist the intent before any external call. An uncertain timeout must never cause a second charge/link.
    $result = $work();
    pedido_put('idempotency', $id, ['hash' => $hash, 'response' => $result]); return $result;
}
function pedido_reference(): string { return 'TONY-' . strtoupper(bin2hex(random_bytes(12))); }
function pedido_run(string $method, callable $handler, bool $public = false, bool $webhook = false): void {
    ini_set('display_errors', '0'); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); header('X-Content-Type-Options: nosniff'); header('Referrer-Policy: no-referrer');
    try {
        pedido_mock(); pedido_secret();
        if (!$webhook) {
            $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
            if (!in_array($origin,pedido_allowed_origins(),true)) pedido_fail('origin_forbidden', 'Este origen no está autorizado.', 403);
            header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, Idempotency-Key'); header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); return; }
        }
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) pedido_fail('method_not_allowed', 'Método no permitido.', 405);
        if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 24 * 1024 * 1024) pedido_fail('too_large', 'Los archivos superan el límite de 24 MB.', 413);
        $session = $public ? '' : pedido_session();
        pedido_rate('request:' . pedido_ip(), $webhook ? 300 : 120, 60);
        if ($session) pedido_rate('request:' . $session, 60, 60);
        $data = $handler($session); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    } catch (PedidoError $e) {
        http_response_code($e->status); if ($e->status === 429) header('Retry-After: 60');
        echo json_encode(['ok' => false, 'success' => false, 'code' => $e->reason, 'error' => $e->getMessage(), 'retryable' => in_array($e->status, [429,502,503,504], true)]);
    } catch (Throwable $e) {
        // Never expose provider bodies, credentials, uploaded images or buyer details.
        http_response_code(503); echo json_encode(['ok' => false, 'success' => false, 'code' => 'service_error', 'error' => 'No pudimos completar la solicitud. Inténtalo más tarde.', 'retryable' => true]);
    }
}
