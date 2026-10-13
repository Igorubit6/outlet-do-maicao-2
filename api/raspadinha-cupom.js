'use strict';
const { randomBytes } = require('node:crypto');
const { isLive } = require('../campaign/raspadinha-config');
const { cleanAttribution, operate } = require('../campaign/raspadinha-store');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control','no-store');
  const send = (status, body) => res.status(status).json(body);
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return send(405,{error:'method_not_allowed'}); }
  let origin;
  try { origin = new URL(req.headers.origin); } catch { return send(403,{error:'invalid_origin'}); }
  if (origin.host !== req.headers.host || !['https:','http:'].includes(origin.protocol)) return send(403,{error:'invalid_origin'});
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return send(415,{error:'json_required'});
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || Buffer.byteLength(JSON.stringify(body)) > 4096) throw Error();
  } catch { return send(400,{error:'invalid_body'}); }
  if (!['state','start','reveal','swap','whatsapp'].includes(body.action)) return send(400,{error:'invalid_action'});
  if (!isLive()) return send(200,{mode:'preview',coupon:null});
  const cookie = String(req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('maicao_participation='));
  let visitor = cookie?.slice('maicao_participation='.length);
  if (!/^[a-f0-9]{64}$/.test(visitor || '')) {
    visitor = randomBytes(32).toString('hex');
    res.setHeader('Set-Cookie','maicao_participation=' + visitor + '; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax' + (origin.protocol === 'https:' ? '; Secure' : ''));
  }
  try {
    const coupon = await operate(visitor, body.action, cleanAttribution(body.attribution && typeof body.attribution === 'object' ? body.attribution : {}));
    // O resultado só é enviado depois da revelação; o servidor ignora prêmios/códigos do cliente.
    return send(200,{mode:'live',coupon:coupon?.revealedAt ? coupon : null});
  } catch { return send(503,{error:'temporarily_unavailable'}); }
};
