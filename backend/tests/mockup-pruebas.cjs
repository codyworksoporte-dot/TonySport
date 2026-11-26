// Uses copies in a temporary hosting layout and fake provider scripts. No external requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const {spawn} = require('node:child_process');
const {once} = require('node:events');
const {setTimeout: delay} = require('node:timers/promises');

const php = process.env.TONY_TEST_PHP || 'php';
const origin = 'https://codyworksoporte-dot.github.io';
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jgfcAAAAASUVORK5CYII=', 'base64');
const officialFixture = `<?php
header('Set-Cookie: should-not-leave-the-fixture=1');
header('X-Provider-Diagnostic: internal');
if (($_POST['placementRules'] ?? '') === 'temporary failure') {
    http_response_code(500);
    echo '{"error":"private fixture diagnostics"}';
    exit;
}
// A top-level require must preserve globals, as in a standalone PHP handler.
$fixtureResult = file_get_contents($_FILES['image']['tmp_name']);
function fixture_image() { global $fixtureResult; return $fixtureResult; }
echo json_encode(['success'=>true,'image'=>'data:image/png;base64,'.base64_encode(fixture_image()),'mime'=>'image/png','secret'=>'fixture']);
exit;
`;

async function run() {
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'tony-mockup-bridge-'));
    const docroot = path.join(sandbox, 'public_html');
    const official = path.join(docroot, 'mockup-prueba');
    fs.mkdirSync(official, {recursive: true});
    fs.cpSync(path.resolve(__dirname, '../mockup-pruebas'), path.join(docroot, 'mockup-pruebas'), {recursive: true});
    for (const name of ['generate', 'finalize', 'magic_eraser']) fs.writeFileSync(path.join(official, name + '.php'), officialFixture);
    const portProbe = net.createServer().listen(0, '127.0.0.1');
    await once(portProbe, 'listening');
    const port = portProbe.address().port;
    await new Promise(resolve => portProbe.close(resolve));
    const service = spawn(php, ['-n', '-S', '127.0.0.1:' + port, '-t', docroot], {windowsHide: true, stdio: 'ignore'});
    const done = once(service, 'exit').catch(() => {});
    const base = 'http://127.0.0.1:' + port + '/mockup-pruebas/';
    const send = (name, data, from = origin) => fetch(base + name + '.php', {method: 'POST', headers: {Origin: from}, body: data});
    function form() {
        const packet = new FormData();
        packet.set('side', 'front');
        packet.set('image', new Blob([pixel], {type: 'image/png'}), 'fixture.png');
        return packet;
    }
    try {
        let ready;
        for (let i = 0; i < 35; i++) {
            try { ready = await fetch(base + 'generate.php', {method: 'OPTIONS', headers: {Origin: origin}}); break; }
            catch { await delay(100); }
        }
        assert.equal(ready?.status, 204);
        assert.equal(ready.headers.get('Access-Control-Allow-Origin'), origin);
        const foreign = await send('generate', form(), 'https://unrelated.example');
        assert.equal(foreign.status, 403);
        assert.equal(foreign.headers.get('Access-Control-Allow-Origin'), null);
        const invalid = form();
        invalid.set('image', new Blob(['not an image'], {type: 'image/png'}), 'fixture.png');
        assert.equal((await send('generate', invalid)).status, 422);
        assert.equal(fs.existsSync(path.join(sandbox, '.tony-mockup-pruebas')), false);
        for (const name of ['generate', 'magic_eraser', 'finalize']) {
            const packet = form();
            if (name === 'magic_eraser') for (const [axis, n] of Object.entries({x: 0, y: 0, w: .25, h: .2})) packet.set(axis, String(n));
            if (name === 'finalize') packet.append('assets[]', new Blob([pixel]), 'logo.png');
            const r = await send(name, packet);
            assert.equal(r.status, 200);
            assert.deepEqual(await r.json(), {ok:true, success:true, mime:'image/png', image:'data:image/png;base64,' + pixel.toString('base64')});
            assert.equal(r.headers.get('Access-Control-Allow-Origin'), origin);
            assert.equal(r.headers.get('set-cookie'), null);
            assert.equal(r.headers.get('x-provider-diagnostic'), null);
        }
        const failure = form();
        failure.set('placementRules', 'temporary failure');
        const r = await send('generate', failure);
        assert.equal(r.status, 502);
        assert.doesNotMatch(await r.text(), /private fixture diagnostics/);
        assert.equal(r.headers.get('Access-Control-Allow-Origin'), origin);
        const quota = await Promise.all(Array.from({length:4}, () => send('generate', form())));
        assert.deepEqual(quota.map(r => r.status).sort(), [200,200,429,429]);
        assert.equal(fs.existsSync(path.join(docroot, '.tony-mockup-pruebas')), false);
        assert.equal(JSON.parse(fs.readFileSync(path.join(sandbox, '.tony-mockup-pruebas', 'quota.json'))).calls.length, 6);
        console.log('Puente PHP verificado con proveedor ficticio: 3 operaciones, preflight, validación, privacidad y cuota.');
    } finally {
        service.kill();
        await done;
        if (path.dirname(sandbox) !== os.tmpdir() || !path.basename(sandbox).startsWith('tony-mockup-bridge-')) throw new Error('Directorio temporal inesperado');
        fs.rmSync(sandbox, {recursive:true, force:true});
    }
}
run().catch(error => {console.error(error); process.exitCode = 1;});
