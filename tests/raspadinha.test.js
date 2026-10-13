'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { CONFIG, versionOf } = require('../campaign/raspadinha-config');
const { renderPage } = require('../campaign/raspadinha-page');
const { cleanAttribution, newCoupon } = require('../campaign/raspadinha-store');
const api = require('../api/raspadinha-cupom');
const res = () => ({ headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(b){this.body=b;} });
const req = body => ({method:'POST',headers:{origin:'https://outlet.example',host:'outlet.example','content-type':'application/json'},body});

test('five server-rendered versions, safe fallback, preview labeling and current conditions', () => {
  for (const version of Object.keys(CONFIG.versions)) {
    const html = renderPage(version);
    assert.ok(html.includes(CONFIG.versions[version].title));
    assert.ok(html.includes(`content="${CONFIG.siteUrl}/raspadinha?v=${version}"`));
    assert.ok(html.includes('PRÉVIA INTERATIVA'));
    assert.ok(html.includes('sem validade comercial'));
    assert.ok(html.includes('até 18x'));
    assert.ok(!html.includes('21x'));
    assert.ok(html.includes('id="result" class="result" aria-labelledby="prize-title" hidden'));
    assert.ok(html.includes('loading="lazy"'));
  }
  assert.equal(renderPage('<script>'),renderPage('c1'));
  assert.equal(versionOf('__proto__'),'c1');
});
test('attribution excludes arbitrary fields and coupon ignores client prize and dates', () => {
  const source = cleanAttribution({version:'c5',placement:'academia_layout4',utm_source:'cartaz',utm_content:'ponto',email:'secret',prize:'desconto',expiresAt:999999});
  assert.deepEqual(source,{version:'c5',placement:'academia_layout4',utm_source:'cartaz',utm_content:'ponto'});
  const c = newCoupon(source,1000);
  assert.match(c.code,/^C5-[A-F0-9]{16}$/);
  assert.equal(c.expiresAt,null);
  assert.equal(c.revealedAt,null);
  assert.equal(c.createdAt,1000);
  assert.ok(['puff','desconto'].includes(c.prize));
  assert.equal(c.attribution.utm_content,'ponto');
});
test('coupon API validates origin/body and remains preview without activation', async () => {
  for (const [request,status] of [[{...req({action:'state'}),method:'GET'},405],[{...req({action:'state'}),headers:{host:'outlet.example',origin:'https://evil.example','content-type':'application/json'}},403],[req({action:'invent'}),400],[req('{bad'),400]]) {
    const response = res(); await api(request,response); assert.equal(response.code,status);
  }
  const response = res(); await api(req({action:'reveal'}),response);
  assert.deepEqual(response.body,{mode:'preview',coupon:null});
  assert.equal(response.headers['Cache-Control'],'no-store');
});
test('live API uses secure cookie, backend attribution, and withholds unrevealed result', async () => {
  const previous = { fetch:global.fetch, price:CONFIG.startingPrice, terms:CONFIG.discountTerms, env:{...process.env} };
  process.env.RASPADINHA_LIVE='true';process.env.UPSTASH_REDIS_REST_URL='https://test.example';process.env.UPSTASH_REDIS_REST_TOKEN='test-only';CONFIG.startingPrice='R$ 999';CONFIG.discountTerms='Termos de teste';
  let command;
  const stored = newCoupon({version:'c2',placement:'original'},1000);
  global.fetch=async (url,options)=>{command=JSON.parse(options.body);return {ok:true,json:async()=>({result:JSON.stringify(stored)})};};
  try {
    const response=res();await api(req({action:'start',attribution:{version:'c2',placement:'original'},prize:'desconto'}),response);
    assert.equal(response.code,200);assert.equal(response.body.coupon,null);
    assert.match(response.headers['Set-Cookie'],/HttpOnly; SameSite=Lax; Secure$/);
    assert.equal(command[0],'EVAL');
    stored.revealedAt=2000;stored.expiresAt=2000+7*86400000;
    const result=res();await api(req({action:'reveal',attribution:{version:'c5',placement:'new'}}),result);
    assert.equal(result.body.coupon.code,stored.code);
    assert.equal(result.body.coupon.attribution.version,'c2');
    global.fetch=async()=>{throw Error('database down');};
    const error=res();await api(req({action:'reveal'}),error);assert.equal(error.code,503);assert.equal(error.body.coupon,undefined);
  } finally {global.fetch=previous.fetch;CONFIG.startingPrice=previous.price;CONFIG.discountTerms=previous.terms;for(const key of ['RASPADINHA_LIVE','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN']){if(previous.env[key]===undefined)delete process.env[key];else process.env[key]=previous.env[key];}}
});
