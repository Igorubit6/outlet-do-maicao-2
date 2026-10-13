'use strict';
const { renderPage } = require('../campaign/raspadinha-page');
module.exports = (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return res.status(405).end(); }
  const version = new URL(req.url, 'https://outlet.invalid').searchParams.get('v');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(200).end(req.method === 'HEAD' ? '' : renderPage(version));
};
