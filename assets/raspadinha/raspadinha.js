/* Raspadinha: prévia local; campanha ativa usa estado autoritativo no servidor. */
(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('scratch-config').textContent);
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const storageKey = 'maicao:' + config.campaign;
  const attribution = { version: config.version, placement: (params.get('ponto') || params.get('utm_content') || 'nao_informado').slice(0, 120) };
  for (const [key, value] of params) if (/^utm_[a-zA-Z0-9_]{1,40}$/.test(key)) attribution[key] = value.slice(0, 200);
  let coupon = null, busy = false, started = false, ready = false, trackingReady = false;
  const canvas = $('scratch-canvas'), context = canvas.getContext('2d', { willReadFrequently: true });
  const date = value => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
  const time = value => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  const uuid = () => crypto.randomUUID();
  const expired = () => coupon && coupon.expiresAt && Date.now() >= coupon.expiresAt;
  const prizeText = () => coupon.prize === 'puff' ? 'UM PUFF' : '10% DE DESCONTO';
  const persisted = () => { try { localStorage.setItem(storageKey, JSON.stringify(coupon)); } catch { $('action-status').textContent = 'Este navegador não permite salvar sua participação. Salve a imagem do cupom.'; } };
  function readPreview() {
    try { const value = JSON.parse(localStorage.getItem(storageKey)); if (value && /^DEMO-C[1-5]-[A-F0-9]{8}$/.test(value.code) && ['puff','desconto'].includes(value.prize) && config.versions[value.attribution?.version]) return value; } catch { /* armazenamento privado indisponível */ }
    return null;
  }
  async function request(action, extra = {}) {
    const response = await fetch('/api/raspadinha-cupom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, attribution, ...extra }), signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Tente novamente em instantes.');
    return data;
  }
  function initTracking() {
    if (trackingReady) return;
    trackingReady = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (config.preview) return;
    if (!window.fbq) {
      const f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); }; f.queue = []; f.loaded = true; f.version = '2.0'; window._fbq = f;
      const script = document.createElement('script'); script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(script);
      f('init', config.pixelId);
    }
    if (/^G-[A-Z0-9]+$/.test(config.ga4Id)) {
      const script = document.createElement('script'); script.async = true; script.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.ga4Id; document.head.appendChild(script);
      window.gtag('js', new Date()); window.gtag('config', config.ga4Id, { send_page_view: false });
    }
  }
  function track(name, extra = {}, metaName) {
    const data = { ...(coupon?.attribution || attribution), page_version: config.version, campaign_id: config.campaign, prize: coupon?.prize || '', ...extra };
    if (config.preview) {
      window.dataLayer.push({ event: name, ...data, preview: true });
      if (params.get('debug') === '1') console.info('[Raspadinha • demonstração]', name, data);
      return;
    }
    window.gtag('event', name, { ...data, transport_type: 'beacon', debug_mode: params.get('debug') === '1' });
    if (metaName) {
      const id = uuid(); window.fbq('track', metaName, data, { eventID: id });
      const cookies = Object.fromEntries(document.cookie.split('; ').map(c => { const i = c.indexOf('='); return [c.slice(0, i), c.slice(i + 1)]; }));
      fetch('/api/meta-events', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: metaName, event_id: id, event_source_url: location.origin + location.pathname, custom_data: data, fbp: cookies._fbp, fbc: cookies._fbc }) }).catch(() => {});
    }
  }
  async function start() {
    if (started) return;
    started = true;
    track('raspadinha_iniciada');
    if (!config.preview) request('start').catch(() => {});
  }
  function previewIssue() {
    // Uma única participação compartilhada entre as cinco versões e abas.
    coupon = readPreview();
    if (coupon) return;
    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
    coupon = { code: 'DEMO-' + config.version.toUpperCase() + '-' + uuid().replaceAll('-', '').slice(0,8).toUpperCase(), prize: random < config.puffProbability ? 'puff' : 'desconto', attribution, createdAt: Date.now(), revealedAt: null, expiresAt: null, swapped: false };
    persisted();
  }
  async function reveal() {
    if (!ready || busy || coupon?.revealedAt) return;
    busy = true; $('reveal-button').disabled = true; $('loading-cover').hidden = false;
    start();
    try {
      if (config.preview) {
        const action = async () => { previewIssue(); if (!coupon.revealedAt) { coupon.revealedAt = Date.now(); coupon.expiresAt = coupon.revealedAt + config.validityDays * 86400000; persisted(); } };
        if (navigator.locks) await navigator.locks.request(storageKey, action); else await action();
      } else { coupon = (await request('reveal')).coupon; }
      track('raspadinha_revelada', {}, 'ViewContent');
      showResult(true);
    } catch { $('game-status').textContent = 'Não foi possível revelar agora. Toque abaixo para tentar novamente.'; $('reveal-button').disabled = false; }
    finally { $('loading-cover').hidden = true; busy = false; }
  }
  function showResult(focus = false) {
    $('ticket').hidden = true; $('reveal-button').hidden = true; $('game-status').hidden = true;
    $('result').hidden = false;
    $('prize-title').textContent = prizeText();
    $('coupon-code').textContent = coupon.code;
    $('coupon-date').textContent = date(coupon.expiresAt);
    $('preview-coupon').hidden = !config.preview;
    $('result-eyebrow').textContent = expired() ? 'ESSE CUPOM EXPIROU' : (coupon.swapped ? 'SEU BENEFÍCIO ESCOLHIDO' : 'OLHA O QUE VOCÊ GANHOU!');
    $('expiry-note').textContent = expired() ? 'O prazo de 7 dias terminou. Fale com a equipe para conhecer as ofertas atuais.' : 'Válido até ' + date(coupon.expiresAt) + ', às ' + time(coupon.expiresAt) + ' (horário de Brasília).';
    $('swap-prize').hidden = Boolean(coupon.swapped || expired());
    $('swap-prize').textContent = coupon.prize === 'puff' ? 'Prefiro 10% de desconto' : 'Prefiro ganhar um puff';
    $('swap-note').textContent = coupon.swapped ? 'Benefício atualizado. O anterior não vale mais. Salve a nova imagem.' : 'Pode trocar o benefício uma vez. Vale o benefício atual do cupom.';
    $('swap-note').hidden = expired();
    const a = coupon.attribution;
    const message = (config.preview ? '[TESTE — CUPOM DE DEMONSTRAÇÃO] ' : '') + (expired() ? 'Oi! Meu cupom expirou e quero conhecer as ofertas atuais. ' : 'Oi! Raspei e quero resgatar ' + (coupon.prize === 'puff' ? 'meu puff' : 'meus 10% de desconto') + ' na compra de um sofá. ') + 'Cupom: ' + coupon.code + '. Cartaz: ' + config.versions[a.version].poster + ' (' + a.version.toUpperCase() + '). Ponto: ' + a.placement + '. Validade: ' + date(coupon.expiresAt) + ' às ' + time(coupon.expiresAt) + '. Quais modelos vocês têm?';
    for (const id of ['whatsapp','floating-whatsapp']) $(id).href = 'https://wa.me/' + config.whatsapp + '?text=' + encodeURIComponent(message);
    $('whatsapp').querySelector('span').textContent = expired() ? 'Consultar ofertas no WhatsApp' : 'Garantir meu prêmio no WhatsApp';
    $('floating-whatsapp').hidden = false;
    if (focus) { $('prize-title').tabIndex = -1; $('prize-title').focus({ preventScroll: true }); }
  }
  $('swap-prize').addEventListener('click', async () => {
    if (busy || !coupon || expired() || coupon.swapped) return;
    busy = true; $('swap-prize').disabled = true;
    try {
      if (config.preview) {
        const action = async () => { coupon = readPreview() || coupon; if (!coupon.swapped) { coupon.prize = coupon.prize === 'puff' ? 'desconto' : 'puff'; coupon.swapped = true; persisted(); } };
        if (navigator.locks) await navigator.locks.request(storageKey, action); else await action();
      } else coupon = (await request('swap')).coupon;
      $('download-fallback').hidden = true;
      showResult(); track('beneficio_trocado');
      $('action-status').textContent = 'Benefício trocado! Seu código e sua validade continuam os mesmos.';
    } catch { $('action-status').textContent = 'Não foi possível trocar agora. Seu benefício anterior continua valendo.'; }
    finally { busy = false; $('swap-prize').disabled = false; }
  });
  $('reveal-button').addEventListener('click', reveal);
  canvas.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); } });
  let activePointer = null, last = null, samples = 0, scratched = false;
  function drawCover() {
    if (!context || scratched) return;
    const rect = canvas.getBoundingClientRect(), scale = Math.min(devicePixelRatio || 1, 2);
    if (!rect.width) return;
    canvas.width = Math.round(rect.width * scale); canvas.height = Math.round(rect.height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, '#e4e8ef'); gradient.addColorStop(.5, '#f5f6f8'); gradient.addColorStop(1, '#b9c3d3');
    context.fillStyle = gradient; context.fillRect(0, 0, rect.width, rect.height);
    context.strokeStyle = '#102c6b08'; context.lineWidth = 1;
    for (let x = -rect.height; x < rect.width; x += 14) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x + rect.height, rect.height); context.stroke(); }
    context.fillStyle = '#102c6b'; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.font = '800 ' + Math.min(27, rect.width * .08) + 'px Montserrat, sans-serif'; context.fillText('RASPE AQUI', rect.width / 2, rect.height / 2 - 12);
    context.font = '13px "DM Sans", sans-serif'; context.fillText('e descubra seu benefício', rect.width / 2, rect.height / 2 + 20);
  }
  function scratch(e) {
    if (!ready || busy || coupon?.revealedAt || !context) return;
    const rect = canvas.getBoundingClientRect();
    const p = { x: (e.clientX - rect.left) * canvas.width / rect.width, y: (e.clientY - rect.top) * canvas.height / rect.height };
    scratched = true;
    context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.globalCompositeOperation = 'destination-out';
    context.lineWidth = canvas.width * .14; context.lineCap = 'round'; context.lineJoin = 'round';
    context.beginPath(); context.moveTo(last?.x ?? p.x, last?.y ?? p.y); context.lineTo(p.x, p.y); context.stroke();
    context.beginPath(); context.arc(p.x, p.y, context.lineWidth / 2, 0, Math.PI * 2); context.fill(); context.restore(); last = p;
    if (++samples % 6 === 0) checkProgress();
  }
  function checkProgress() {
    if (!context || busy || coupon?.revealedAt) return;
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0, total = 0;
    for (let i = 3; i < data.length; i += 64) { if (data[i] < 100) transparent++; total++; }
    const ratio = transparent / total;
    $('game-status').textContent = ratio < .4 ? 'Continue raspando… sua surpresa está quase aparecendo.' : 'Pronto! Vamos revelar seu benefício.';
    if (ratio >= .4) reveal();
  }
  canvas.addEventListener('pointerdown', e => { if (!ready || busy || activePointer !== null) return; activePointer = e.pointerId; last = null; canvas.setPointerCapture(e.pointerId); start(); scratch(e); });
  canvas.addEventListener('pointermove', e => { if (activePointer === e.pointerId) scratch(e); });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(name, e => { if (activePointer === e.pointerId) { activePointer = null; last = null; checkProgress(); } });
  new ResizeObserver(drawCover).observe($('scratch-area'));
  document.fonts.ready.then(drawCover);
  function clickWhatsApp(button) {
    track('whatsapp_click', { button }, 'Lead');
    if (!config.preview) request('whatsapp').catch(() => {});
  }
  $('whatsapp').addEventListener('click', () => clickWhatsApp('principal'));
  $('floating-whatsapp').addEventListener('click', () => clickWhatsApp('flutuante'));
  $('directions').addEventListener('click', () => track('como_chegar', { button: 'como_chegar' }, 'FindLocation'));
  $('save-coupon').addEventListener('click', async () => {
    if (!coupon) return;
    $('save-coupon').disabled = true;
    try {
      const picture = document.createElement('canvas'); picture.width = 1080; picture.height = 1280;
      const c = picture.getContext('2d');
      c.fillStyle = '#f7f8fc'; c.fillRect(0, 0, 1080, 1280); c.fillStyle = '#102c6b'; c.fillRect(0, 0, 1080, 245);
      c.textAlign = 'center'; c.fillStyle = 'white'; c.font = 'bold 40px sans-serif'; c.fillText('OUTLET DO MAICÃO', 540, 115); c.font = '25px sans-serif'; c.fillText('Seu próximo sofá vem com uma surpresa.', 540, 170);
      c.fillStyle = '#102c6b'; c.font = 'bold 25px sans-serif'; c.fillText('SEU BENEFÍCIO', 540, 335);
      c.font = 'bold 76px sans-serif'; if (coupon.prize === 'puff') c.fillText('UM PUFF', 540, 455); else { c.fillText('10% DE', 540, 435); c.fillText('DESCONTO', 540, 525); }
      c.font = '32px sans-serif'; c.fillText('Na compra de qualquer sofá.', 540, 600);
      c.fillStyle = '#edc452'; c.fillRect(65, 662, 950, 125); c.fillStyle = '#102c6b'; c.font = 'bold 38px monospace'; c.fillText(coupon.code, 540, 740);
      c.font = '29px sans-serif'; c.fillText('Válido até ' + date(coupon.expiresAt) + ' às ' + time(coupon.expiresAt), 540, 853);
      c.font = '23px sans-serif'; c.fillText('Um benefício por compra. Vale o benefício atual do cupom.', 540, 908);
      c.fillText('Cartaz ' + coupon.attribution.version.toUpperCase() + ' · Ponto: ' + coupon.attribution.placement.slice(0, 40), 540, 955);
      c.fillText('Rua Oswaldo Oscar Barthelson, 1249', 540, 1040); c.fillText('Jardim Londres · Campinas — SP', 540, 1080);
      c.fillStyle = config.preview ? '#a72d24' : '#102c6b'; c.font = 'bold 24px sans-serif'; c.fillText(config.preview ? 'DEMONSTRAÇÃO — SEM VALIDADE COMERCIAL' : 'Apresente este cupom na loja ou no WhatsApp.', 540, 1190);
      const blob = await new Promise(resolve => picture.toBlob(resolve, 'image/png'));
      if (!blob) throw Error('image');
      const file = new File([blob], coupon.code + '.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Meu cupom • Outlet do Maicão' }); track('cupom_salvo'); return; } catch (e) { if (e.name === 'AbortError') return; } }
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
      $('coupon-preview').src = url; $('download-fallback').hidden = false;
      $('action-status').textContent = 'Se o download não abrir, toque e segure a imagem abaixo para salvar.';
      track('cupom_salvo');
    } catch { $('action-status').textContent = 'Não foi possível salvar a imagem. Você também pode tirar um print do cupom.'; }
    finally { $('save-coupon').disabled = false; }
  });
  window.addEventListener('storage', e => { if (config.preview && e.key === storageKey) { coupon = readPreview(); if (coupon?.revealedAt) showResult(); } });
  async function init() {
    try {
      if (config.preview) coupon = readPreview();
      else { const state = await request('state'); if (state.mode !== 'live') throw Error('unavailable'); coupon = state.coupon; }
      ready = true; initTracking(); track('page_view', {}, 'PageView');
      if (coupon?.revealedAt) showResult();
      else { $('game-status').textContent = 'Passe o dedo na área prateada para descobrir.'; $('reveal-button').disabled = false; drawCover(); }
    } catch {
      $('game-status').textContent = 'A raspadinha está temporariamente indisponível. Tente recarregar em instantes.';
    }
  }
  init();
})();
