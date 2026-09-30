const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const reference = `TONY-${'A'.repeat(24)}`;
const paymentUrl = 'https://lk.wompi.sv/isolated-test-no-real-payment';
const amountCents = 3897;
const accountToken = 'a'.repeat(64), guestToken = 'b'.repeat(64);
const image = 'data:image/png;base64,AQ==';
const order = {version: 279, design: {front: image, back: image, finalFront: image, finalBack: image, layers: []}};
const delivery = {kind: 'pickup', branch: 'Sucursal de prueba'};

// Each case evaluates the real auth/API modules with isolated storage and fetch.
// No request reaches a server, payment provider or authentication service.
function environment({accounts, blocked = false}) {
  const saved = new Map(), calls = [], modules = new Map();
  const storage = {
    getItem(key) {if (blocked) throw new Error('Storage unavailable'); return saved.get(key) || null;},
    setItem(key, value) {if (blocked) throw new Error('Storage unavailable'); saved.set(key, String(value));},
    removeItem(key) {if (blocked) throw new Error('Storage unavailable'); saved.delete(key);},
  };
  const context = vm.createContext({
    process: {env: {NEXT_PUBLIC_TONY_API_BASE: 'https://tony-api.example.invalid/pedido-api', NEXT_PUBLIC_TONY_AUTH_ENABLED: String(accounts)}},
    sessionStorage: storage,
    window: {location: new URL('https://tony.example.invalid'), dispatchEvent() {}},
    URL, Headers, Blob, FormData, AbortController, AbortSignal, Event, setTimeout, clearTimeout,
    fetch: async (url, init = {}) => {
      const endpoint = new URL(url).pathname.split('/').pop();
      const headers = new Headers(init.headers), body = init.body ? JSON.parse(init.body) : {};
      calls.push({endpoint, body, authorization: headers.get('Authorization'), idempotencyKey: headers.get('Idempotency-Key')});
      let result;
      if (endpoint === 'auth.php' && body.action === 'login') {
        result = {ok: true, token: accountToken, user: {id: 'c'.repeat(32), email: 'test@example.invalid'}, expiresAt: Math.floor(Date.now()/1000) + 3600};
      } else if (endpoint === 'session.php') {
        result = {ok: true, sessionToken: guestToken};
      } else if (endpoint === 'wompi-crear-pago.php') {
        assert.equal(headers.get('Authorization'), `Bearer ${accounts ? accountToken : guestToken}`);
        result = {ok: true, url: paymentUrl, reference, amountCents, status: 'pending', quote: {currency: 'USD'}};
      } else if (endpoint === 'wompi-verificar.php') {
        assert.equal(headers.get('Authorization'), `Bearer ${accounts ? accountToken : guestToken}`);
        result = {ok: true, reference, amountCents, paid: false, status: 'pending', url: paymentUrl};
      } else throw new Error(`Unexpected mocked endpoint: ${endpoint}`);
      return {ok: true, status: 200, json: async () => result};
    },
  });
  function load(file) {
    const absolute = path.resolve(root, file);
    if (modules.has(absolute)) return modules.get(absolute).exports;
    const module = {exports: {}}; modules.set(absolute, module);
    const compiled = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
    const run = new vm.Script(`(function(require,module,exports){${compiled}\n})`, {filename: absolute}).runInContext(context);
    run(id => {
      if (id === 'react') return require('react');
      if (id.startsWith('.')) return load(`${path.relative(root, path.resolve(path.dirname(absolute), id))}.ts`);
      throw new Error(`Unexpected module import: ${id}`);
    }, module, module.exports);
    return module.exports;
  }
  return {calls, saved, auth: load('lib/auth.ts'), api: load('lib/pedido/api.ts'), reload: () => {modules.clear(); return load('lib/pedido/api.ts');}};
}

test('account payment uses its persisted login token and survives the payment return', async () => {
  const env = environment({accounts: true});
  await env.auth.accountRequest('login', {email: 'test@example.invalid', password: 'TEST-ONLY'});
  const created = await env.api.createPayment(order, delivery, amountCents, 'account-payment-test');
  assert.equal(created.reference, reference);
  assert.equal(created.url, paymentUrl);
  const payment = env.calls.find(call => call.endpoint === 'wompi-crear-pago.php');
  assert.equal(payment.idempotencyKey, 'account-payment-test');
  assert.equal(env.calls.filter(call => call.endpoint === 'session.php').length, 0);
  assert.equal(env.saved.size, 1);
  const returned = await env.reload().verifyPayment(reference);
  assert.equal(returned.reference, reference);
});

test('visitor payment keeps its existing session mechanism and survives return', async () => {
  const env = environment({accounts: false});
  const created = await env.api.createPayment(order, delivery, amountCents, 'visitor-payment-test');
  assert.equal(created.reference, reference);
  assert.equal(env.calls.filter(call => call.endpoint === 'session.php').length, 1);
  assert.equal(env.calls.filter(call => call.endpoint === 'wompi-crear-pago.php').length, 1);
  assert.equal((await env.reload().verifyPayment(reference)).reference, reference);
  assert.equal(env.calls.filter(call => call.endpoint === 'session.php').length, 1);
});

for (const accounts of [true, false]) {
  test(`${accounts ? 'account' : 'visitor'} with unavailable storage cannot create a payment`, async () => {
    const env = environment({accounts, blocked: true});
    if (accounts) await env.auth.accountRequest('login', {email: 'test@example.invalid', password: 'TEST-ONLY'});
    await assert.rejects(env.api.createPayment(order, delivery, amountCents, 'blocked-payment-test'), /no permite conservar la sesión/);
    assert.equal(env.calls.filter(call => call.endpoint === 'wompi-crear-pago.php').length, 0);
    assert.equal(env.saved.size, 0);
  });
}
