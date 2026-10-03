const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const handler = require('../api/meta-events');

function request(overrides = {}) {
  return { method: 'POST', headers: { origin: 'https://outlet.example', host: 'outlet.example', 'content-type': 'application/json', 'user-agent': 'Test', 'x-forwarded-for': '192.0.2.1' }, body: { event_name: 'Contact', event_id: 'event-123', event_source_url: 'https://outlet.example/premium.html?secret=removed', fbp: 'fb.1.123.456' }, ...overrides };
}
async function run(req) {
  const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler(req, res);
  return res;
}
test('rejects cross-origin, unsupported events and missing configuration', async () => {
  delete process.env.META_CAPI_ACCESS_TOKEN;
  assert.equal((await run(request({ method: 'GET' }))).code, 405);
  assert.equal((await run(request({ headers: { origin: 'https://evil.example', host: 'outlet.example' } }))).code, 403);
  const bad = request(); bad.body.event_name = 'Purchase';
  assert.equal((await run(bad)).code, 400);
  assert.equal((await run(request())).code, 503);
});
test('forwards deduplication ID with server credentials and strips query', async () => {
  const oldFetch = global.fetch;
  process.env.META_CAPI_ACCESS_TOKEN = 'test-secret';
  let captured;
  global.fetch = async (url, options) => { captured = { url, options }; return { ok: true, json: async () => ({ events_received: 1 }) }; };
  try {
    const result = await run(request());
    assert.equal(result.code, 200);
    const event = JSON.parse(captured.options.body).data[0];
    assert.equal(event.event_id, 'event-123');
    assert.equal(event.event_name, 'Contact');
    assert.equal(event.event_source_url, 'https://outlet.example/premium.html');
    assert.equal(event.user_data.client_ip_address, '192.0.2.1');
    assert.equal(captured.options.headers.Authorization, 'Bearer test-secret');
    assert.ok(!JSON.stringify(result.body).includes('test-secret'));
    global.fetch = async () => ({ ok: false, json: async () => ({ error: { message: 'test-secret' } }) });
    assert.deepEqual((await run(request())).body, { error: 'event_not_accepted' });
  } finally { global.fetch = oldFetch; delete process.env.META_CAPI_ACCESS_TOKEN; }
});
test('browser and server share IDs for page view and WhatsApp without blocking click', () => {
  const pixels = [], requests = []; let click;
  const window = { fbq: (...args) => pixels.push(args), crypto: { randomUUID: () => 'unique-' + requests.length } };
  const context = { window, location: { protocol: 'https:', origin: 'https://outlet.example', pathname: '/premium.html', search: '', href: 'https://outlet.example/premium.html' }, document: { cookie: '', addEventListener: (name, fn) => { click = fn; } }, URL, URLSearchParams, fetch: (url, opts) => { requests.push(JSON.parse(opts.body)); return Promise.resolve(); } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/meta-tracking.js'), 'utf8'), context);
  click({ target: { closest: () => ({ href: 'https://wa.me/5519996524100' }) } });
  assert.deepEqual(requests.map(x => x.event_name), ['PageView', 'Contact']);
  const tracked = pixels.filter(x => x[0] === 'track');
  assert.equal(tracked[0][3].eventID, requests[0].event_id);
  assert.equal(tracked[1][3].eventID, requests[1].event_id);
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/meta-tracking.js'), 'utf8'), context);
  assert.equal(requests.length, 2);
});
