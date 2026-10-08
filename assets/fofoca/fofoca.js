/* Campanha FOFOCA. Segredos ficam na função /api/meta-events. */
(function () {
  'use strict';
  if (window.__fofocaInstalled) return;
  window.__fofocaInstalled = true;
  const config = JSON.parse(document.getElementById('fofoca-config').textContent);
  const search = new URLSearchParams(location.search);
  const attribution = { version: config.version };
  for (const [key, value] of search) {
    if (/^utm_[a-zA-Z0-9_]{1,40}$/.test(key)) attribution[key] = value.slice(0, 200);
  }
  const debug = search.get('debug') === '1';
  function cookie(name) {
    const entry = document.cookie.split('; ').find(value => value.startsWith(name + '='));
    return entry ? entry.slice(name.length + 1) : undefined;
  }
  const fbclid = search.get('fbclid');
  if (fbclid && /^[A-Za-z0-9_-]{1,500}$/.test(fbclid)) {
    document.cookie = '_fbc=fb.1.' + Date.now() + '.' + fbclid + '; Path=/; Max-Age=7776000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
  t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', config.pixelId);
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (/^G-[A-Z0-9]+$/.test(config.ga4Id)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.ga4Id);
    document.head.appendChild(script);
    window.gtag('js', new Date());
    window.gtag('config', config.ga4Id, { send_page_view: false, debug_mode: debug });
    window.gtag('event', 'page_view', { ...attribution, debug_mode: debug });
  }
  function track(name, extra = {}) {
    const id = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
    const data = { ...attribution, ...extra };
    window.fbq('track', name, data, { eventID: id });
    fetch('/api/meta-events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ event_name: name, event_id: id, event_source_url: location.origin + location.pathname, custom_data: data, fbp: cookie('_fbp'), fbc: cookie('_fbc') })
    }).then(response => {
      if (debug) console.info('[FOFOCA]', name, { ...data, event_id: id, server_status: response.status });
    }).catch(() => { if (debug) console.info('[FOFOCA]', name, 'Servidor indisponível; navegação preservada.'); });
  }
  track('PageView');
  document.addEventListener('click', function (event) {
    const target = event.target.closest && event.target.closest('a[data-whatsapp], a[data-location]');
    if (!target) return;
    const extra = { button: target.dataset.button, button_label: target.dataset.label || 'Como chegar' };
    if (target.hasAttribute('data-whatsapp')) {
      track('Lead', extra);
    } else {
      track('FindLocation', extra);
      window.gtag('event', 'como_chegar', { ...attribution, ...extra, debug_mode: debug, transport_type: 'beacon' });
    }
  });

  const video = document.getElementById('campaign-video');
  const toggle = document.getElementById('sound-toggle');
  const label = toggle.querySelector('span');
  const status = document.getElementById('video-status');
  let viewedWithSound = false;
  function checkSound() {
    const audible = !video.muted && video.volume > 0;
    toggle.setAttribute('aria-pressed', String(audible));
    label.textContent = audible ? 'Silenciar vídeo' : 'Toque para ouvir';
    if (audible && !video.paused && !video.ended && video.readyState >= 2 && !viewedWithSound) {
      viewedWithSound = true;
      track('ViewContent', { content_name: 'FOFOCA ' + config.version, content_type: 'video' });
    }
  }
  video.addEventListener('playing', checkSound);
  video.addEventListener('volumechange', checkSound);
  video.addEventListener('error', function () {
    status.textContent = 'Vídeo indisponível. Você pode falar com a loja abaixo.';
    toggle.disabled = true;
    label.textContent = 'Vídeo em breve';
  });
  toggle.addEventListener('click', function () {
    if (!config.videoReady) {
      status.textContent = 'Estamos preparando o vídeo. Garanta seu puff pelo WhatsApp abaixo.';
      return;
    }
    video.muted = !video.muted;
    video.controls = true;
    if (video.paused) {
      video.play().then(checkSound).catch(() => { status.textContent = 'Toque no play do vídeo para começar.'; });
    }
  });
  if (config.videoReady) {
    video.src = config.video;
    video.muted = true;
    video.play().catch(() => { status.textContent = 'Toque para reproduzir e ouvir.'; });
  }
})();
