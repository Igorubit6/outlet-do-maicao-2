'use strict';
// Campanha de vídeo encerrada. Mantém query e UTMs em links antigos.
module.exports = (req, res) => {
  if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Allow','GET, HEAD'); return res.status(405).end(); }
  const query = new URL(req.url, 'https://outlet.invalid').search;
  res.setHeader('Location', '/raspadinha' + query);
  res.setHeader('Cache-Control', 'no-store');
  res.status(307).end();
};
