const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { CONFIG, renderPage } = require('../campaign/fofoca-page');
const route = require('../api/fofoca');
const meta = require('../api/meta-events');

test('all versions render independently with correct OG, WhatsApp and c3-only comparison', () => {
  for (const version of ['c1', 'c2', 'c3']) {
    const html = renderPage(version);
    const current = CONFIG.versions[version];
    assert.ok(html.includes(`<meta property="og:title" content="${current.headline}">`));
    assert.ok(html.includes(`content="${CONFIG.siteUrl}/fofoca?v=${version}"`));
    for (const button of current.buttons) assert.ok(html.includes(encodeURIComponent(button.message)));
    assert.equal(html.includes('id="comparison-title"'), version === 'c3');
    assert.equal((html.match(/data-whatsapp /g) || []).length, current.buttons.length * 2 + 1);
    assert.ok(html.includes('loading="lazy"'));
    assert.ok(!html.includes('<nav') && !html.includes('index.html') && !html.includes('meta-tracking.js'));
    assert.ok(!html.includes('logo-nova.jpg') && !html.includes('Outlet do Maicão') && !html.includes('autoplay'));
    assert.ok(html.includes('id="reveal-content" hidden'));
    assert.ok(html.includes('Garanta seu puff até __/__/____.'));
    assert.ok(!html.includes('enquanto durar'));
  }
  assert.equal(renderPage(null), renderPage('c1'));
  assert.equal(renderPage('<script>alert(1)</script>'), renderPage('c1'));
});
test('route selects version in initial HTML, supports HEAD and preserves static site routes', () => {
  const response = () => ({ headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(n) { this.code=n; return this; }, end(html) { this.html=html; } });
  const res = response();
  route({ method: 'GET', url: '/api/fofoca?v=c2&utm_source=cartaz' }, res);
  assert.equal(res.code, 200);
  assert.ok(res.html.includes(CONFIG.versions.c2.headline));
  assert.equal(res.headers['Content-Type'], 'text/html; charset=utf-8');
  const head = response(); route({ method: 'HEAD', url: '/fofoca' }, head); assert.equal(head.html, '');
  const config = JSON.parse(fs.readFileSync(require.resolve('../vercel.json')));
  assert.ok(config.rewrites.every(rule => ['/fofoca', '/fofoca/'].includes(rule.source)));
});
function clientHarness() {
  const pixels = [], requests = [], ga = [], handlers = {}, videoHandlers = {}, toggleHandlers = {};
  const video = { paused: true, ended: false, muted: true, volume: 1, readyState: 0, addEventListener: (key, fn) => { videoHandlers[key] = fn; } };
  const label = { textContent: '' }, status = { textContent: '' };
  const toggle = { addEventListener: (key, fn) => { toggleHandlers[key] = fn; }, querySelector: () => label, setAttribute() {} };
  const config = { version: 'c3', pixelId: CONFIG.pixelId, ga4Id: '', videoReady: false };
  const revealContent = { hidden: true }, frame = { dataset: { src: 'https://maps.example' } };
  const document = { cookie: '', body: { classList: { add() {} } }, querySelectorAll: () => [frame], getElementById: id => ({ 'reveal-content': revealContent, 'fofoca-config': { textContent: JSON.stringify(config) }, 'campaign-video': video, 'sound-toggle': toggle, 'video-status': status }[id]), addEventListener: (key, fn) => { handlers[key] = fn; } };
  const window = { fbq: (...args) => pixels.push(args), gtag: (...args) => ga.push(args), crypto: { randomUUID: () => 'id-' + requests.length } };
  const context = { window, document, location: { protocol: 'https:', origin: 'https://outlet.example', pathname: '/fofoca', search: '?v=c3&utm_source=cartaz&utm_medium=qrcode&utm_campaign=fofoca&utm_content=fachada&utm_term=teste&debug=0' }, URLSearchParams, fetch: (url, options) => { requests.push(JSON.parse(options.body)); return Promise.resolve({ status: 200 }); }, console };
  vm.runInNewContext(fs.readFileSync(require.resolve('../assets/fofoca/fofoca.js'), 'utf8'), context);
  return { pixels, requests, ga, handlers, video, videoHandlers, toggleHandlers, status, revealContent, frame };
}
test('real actions carry UTMs, button and shared IDs; sound tracking requires audible playback', () => {
  const h = clientHarness();
  assert.equal(h.requests.length, 1);
  assert.equal(h.revealContent.hidden, true);
  assert.equal(h.frame.src, undefined);
  h.handlers.click({ target: { closest: () => ({ dataset: { button: 'oferta_yasmin' }, hasAttribute: () => true }) } });
  assert.equal(h.requests.length, 1); // O CTA não registra clique enquanto estiver bloqueado.
  h.videoHandlers.playing();
  assert.equal(h.revealContent.hidden, true); // Reprodução sozinha não revela a página.
  h.toggleHandlers.click(); // Placeholder: no ViewContent.
  assert.equal(h.revealContent.hidden, false);
  assert.equal(h.frame.src, 'https://maps.example');
  assert.equal(h.requests.length, 1);
  h.video.paused = false; h.video.readyState = 3;
  h.videoHandlers.playing(); // Muted autoplay: no ViewContent.
  assert.equal(h.requests.length, 1);
  h.video.muted = false; h.videoHandlers.volumechange(); h.videoHandlers.playing();
  assert.equal(h.requests.filter(r => r.event_name === 'ViewContent').length, 1);
  const link = { dataset: { button: 'oferta_yasmin', label: 'Quero a Yasmin' }, hasAttribute: name => name === 'data-whatsapp' };
  h.handlers.click({ target: { closest: () => link } });
  link.dataset = { button: 'como_chegar' }; link.hasAttribute = () => false;
  h.handlers.click({ target: { closest: () => link } });
  assert.deepEqual(h.requests.map(r => r.event_name), ['PageView', 'ViewContent', 'Lead', 'FindLocation']);
  for (const request of h.requests) {
    assert.equal(request.custom_data.version, 'c3');
    assert.equal(request.custom_data.utm_source, 'cartaz');
    assert.equal(request.custom_data.utm_content, 'fachada');
    assert.equal(request.custom_data.utm_term, 'teste');
    const browserEvent = h.pixels.find(args => args[0] === 'track' && args[3].eventID === request.event_id);
    assert.equal(browserEvent[1], request.event_name);
  }
  assert.equal(h.requests[2].custom_data.button, 'oferta_yasmin');
  assert.equal(h.ga[0][1], 'como_chegar');
  assert.equal(h.ga[0][2].utm_medium, 'qrcode');
});
test('API accepts campaign events and forwards allowed attribution without unknown fields', async () => {
  const oldFetch = global.fetch;
  process.env.META_CAPI_ACCESS_TOKEN = 'test-secret';
  const received = [];
  global.fetch = async (url, options) => { received.push(JSON.parse(options.body).data[0]); return { ok: true, json: async () => ({ events_received: 1 }) }; };
  try {
    for (const name of ['PageView', 'ViewContent', 'Lead', 'FindLocation']) {
      const res = { setHeader() {}, status(n) { this.code=n; return this; }, json(body) { this.body=body; } };
      await meta({ method: 'POST', headers: { host: 'outlet.example', origin: 'https://outlet.example', 'content-type': 'application/json', 'user-agent': 'Test' }, body: { event_name: name, event_id: 'campaign-id', event_source_url: 'https://outlet.example/fofoca?v=c3', custom_data: { version: 'c3', button: 'oferta_yasmin', utm_source: 'cartaz', utm_content: 'fachada', email: 'must-not-forward@example.com' } } }, res);
      assert.equal(res.code, 200);
    }
    for (const event of received) {
      assert.equal(event.custom_data.version, 'c3');
      assert.equal(event.custom_data.utm_source, 'cartaz');
      assert.equal(event.custom_data.email, undefined);
      assert.equal(event.event_id, 'campaign-id');
    }
  } finally { global.fetch = oldFetch; delete process.env.META_CAPI_ACCESS_TOKEN; }
});
