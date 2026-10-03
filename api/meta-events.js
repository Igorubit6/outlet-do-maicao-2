'use strict';
const { isIP } = require('node:net');
const PIXEL_ID = '1832634061075614';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const respond = (status, body) => res.status(status).json(body);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return respond(405, { error: 'method_not_allowed' });
  }
  let origin;
  try { origin = new URL(req.headers.origin); } catch (_) { return respond(403, { error: 'invalid_origin' }); }
  if (origin.host !== req.headers.host || !['https:', 'http:'].includes(origin.protocol)) return respond(403, { error: 'invalid_origin' });
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return respond(415, { error: 'json_required' });
  let body;
  try {
    if (typeof req.body === 'string' && Buffer.byteLength(req.body) > 4096) throw Error();
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || Buffer.byteLength(JSON.stringify(body)) > 4096) throw Error();
  } catch (_) { return respond(400, { error: 'invalid_body' }); }
  if (!['PageView', 'Contact'].includes(body.event_name) || typeof body.event_id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(body.event_id)) return respond(400, { error: 'invalid_event' });
  let source;
  try { source = new URL(body.event_source_url); } catch (_) { return respond(400, { error: 'invalid_source' }); }
  if (source.origin !== origin.origin) return respond(400, { error: 'invalid_source' });
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) return respond(503, { error: 'configuration_required' });
  const userData = {};
  const forwarded = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
  const ip = String(forwarded).split(',')[0].trim();
  if (isIP(ip)) userData.client_ip_address = ip;
  if (req.headers['user-agent']) userData.client_user_agent = String(req.headers['user-agent']).slice(0, 1024);
  for (const field of ['fbp', 'fbc']) {
    if (typeof body[field] === 'string' && /^fb\.\d+\.\d+\.[A-Za-z0-9_-]{1,500}$/.test(body[field])) userData[field] = body[field];
  }
  const event = { event_name: body.event_name, event_id: body.event_id, event_time: Math.floor(Date.now() / 1000), action_source: 'website', event_source_url: source.origin + source.pathname, user_data: userData };
  if (body.event_name === 'Contact') event.custom_data = { content_name: 'WhatsApp' };
  const payload = { data: [event] };
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  const version = process.env.META_GRAPH_API_VERSION || 'v23.0';
  if (!/^v\d+\.\d+$/.test(version)) return respond(503, { error: 'configuration_required' });
  try {
    const response = await fetch(`https://graph.facebook.com/${version}/${PIXEL_ID}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(8000)
    });
    const result = await response.json();
    if (!response.ok || !(result.events_received >= 1)) return respond(502, { error: 'event_not_accepted' });
    return respond(200, { received: true });
  } catch (_) { return respond(502, { error: 'upstream_unavailable' }); }
};
