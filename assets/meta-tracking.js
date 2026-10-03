/* Meta Pixel + server events. Credentials stay exclusively on the server. */
(function () {
  'use strict';
  if (!/^https?:$/.test(location.protocol) || window.__outletMetaInstalled) return;
  window.__outletMetaInstalled = true;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
  s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', '1832634061075614');
  const cookie = name => {
    const entry = document.cookie.split('; ').find(v => v.startsWith(name + '='));
    return entry ? entry.slice(name.length + 1) : undefined;
  };
  const clickId = new URLSearchParams(location.search).get('fbclid');
  if (clickId && /^[A-Za-z0-9_-]{1,500}$/.test(clickId)) {
    document.cookie = '_fbc=fb.1.' + Date.now() + '.' + clickId + '; Path=/; Max-Age=7776000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }
  function track(name) {
    const id = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
    const data = name === 'Contact' ? { content_name: 'WhatsApp' } : {};
    window.fbq('track', name, data, { eventID: id });
    fetch('/api/meta-events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ event_name: name, event_id: id, event_source_url: location.origin + location.pathname, fbp: cookie('_fbp'), fbc: cookie('_fbc') })
    }).catch(function () { /* Tracking must never interrupt navigation. */ });
  }
  track('PageView');
  document.addEventListener('click', function (event) {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    try {
      const url = new URL(link.href, location.href);
      if (url.hostname === 'wa.me' || url.hostname === 'api.whatsapp.com') track('Contact');
    } catch (_) {}
  });
})();
