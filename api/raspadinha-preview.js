'use strict';
// Bancada de revisão disponível apenas enquanto a campanha estiver em demonstração.
const { isLive, versionOf } = require('../campaign/raspadinha-config');
module.exports = (req, res) => {
  if (isLive()) return res.status(404).end();
  if (!['GET','HEAD'].includes(req.method)) return res.status(405).end();
  const query = new URL(req.url, 'https://outlet.invalid').searchParams;
  const device = query.get('device');
  const width = device === 'tablet' ? 768 : device === 'desktop' ? 1280 : 390;
  const version = versionOf(query.get('v'));
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.status(200).end(req.method === 'HEAD' ? '' : `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Revisão responsiva</title><body style="margin:0;background:#e5e8ef;display:flex;justify-content:center"><iframe title="Prévia responsiva da raspadinha" src="/raspadinha?v=${version}" width="${width}" height="844" style="border:0;flex-shrink:0;height:100vh"></iframe></body></html>`);
};
