'use strict';
const { randomBytes, randomInt, createHash } = require('node:crypto');
const { CONFIG, versionOf } = require('./raspadinha-config');
function cleanAttribution(input = {}) {
  const result = { version: versionOf(input.version), placement: String(input.placement || 'nao_informado').slice(0,120) };
  for (const [key,value] of Object.entries(input)) if (/^utm_[a-zA-Z0-9_]{1,40}$/.test(key) && typeof value === 'string') result[key] = value.slice(0,200);
  return result;
}
function newCoupon(attribution, now = Date.now()) {
  return { code: versionOf(attribution.version).toUpperCase() + '-' + randomBytes(8).toString('hex').toUpperCase(), prize: randomInt(1000000) < CONFIG.puffProbability * 1000000 ? 'puff' : 'desconto', attribution: cleanAttribution(attribution), createdAt: now, revealedAt: null, expiresAt: null, swapped: false, startedAt: null, whatsappClicks: 0 };
}
const TTL = 31536000;
// Criação e mutações atômicas: abas concorrentes nunca emitem dois benefícios.
const MUTATE = `
local raw = redis.call('GET', KEYS[1])
local c
if raw then c = cjson.decode(raw) else c = cjson.decode(ARGV[1]) end
local action = ARGV[2]
local now = tonumber(ARGV[3])
if action == 'start' and c.startedAt == cjson.null then c.startedAt = now end
if action == 'reveal' and c.revealedAt == cjson.null then
 c.startedAt = c.startedAt == cjson.null and now or c.startedAt
 c.revealedAt = now
 c.expiresAt = now + tonumber(ARGV[4])
end
if action == 'swap' then
 if c.revealedAt == cjson.null then return redis.error_reply('reveal_required') end
 if c.expiresAt <= now then return redis.error_reply('expired') end
 if not c.swapped then
  c.prize = c.prize == 'puff' and 'desconto' or 'puff'
  c.swapped = true
 end
end
if action == 'whatsapp' and c.revealedAt ~= cjson.null then c.whatsappClicks = c.whatsappClicks + 1 end
local encoded = cjson.encode(c)
redis.call('SET', KEYS[1], encoded, 'EX', ARGV[5])
redis.call('SET', ARGV[6] .. c.code, KEYS[1], 'EX', ARGV[5])
return encoded
`;
async function command(values) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  const response = await fetch(url, { method:'POST', headers:{Authorization:'Bearer ' + token,'Content-Type':'application/json'}, body:JSON.stringify(values), signal:AbortSignal.timeout(7000) });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error('store_unavailable');
  return data.result;
}
async function operate(visitor, action, attribution) {
  const key = CONFIG.campaign + ':visitor:' + createHash('sha256').update(visitor).digest('hex');
  if (action === 'state') { const value = await command(['GET',key]); return value ? JSON.parse(value) : null; }
  return JSON.parse(await command(['EVAL', MUTATE, '1', key, JSON.stringify(newCoupon(attribution)), action, String(Date.now()), String(CONFIG.validityDays * 86400000), String(TTL), CONFIG.campaign + ':code:']));
}
module.exports = { cleanAttribution, newCoupon, operate, MUTATE };
