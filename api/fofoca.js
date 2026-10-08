'use strict';
const { renderPage } = require('../campaign/fofoca-page');

module.exports = function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  const requested = new URL(req.url, 'https://outlet.invalid').searchParams.get('v');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(200).end(req.method === 'HEAD' ? '' : renderPage(requested));
};
