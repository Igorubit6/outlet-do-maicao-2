'use strict';
// Todas as diferenças de campanha ficam aqui. Não colocar segredos neste arquivo.
const CONFIG = {
  campaign: 'raspadinha-2026-01',
  siteUrl: 'https://outlet-do-maicao-2.vercel.app',
  whatsapp: '5519996524100',
  pixelId: '1832634061075614',
  ga4Id: '', // TODO: ID de medição G-... antes da veiculação.
  startingPrice: '', // TODO: confirmar preço atual à vista no Pix; não anunciar preço inventado.
  validityDays: 7,
  puffProbability: 0.5, // TODO: confirmar divisão 50/50 antes de ativar benefícios reais.
  discountTerms: '', // TODO: confirmar base do desconto (Pix/cartão) e cumulação com ofertas.
  versions: {
    c1: { title: 'Será que esse puff é seu?', accent: 'Esse pode ser o seu achado do dia.', poster: 'Procura-se dono deste puff', tag: 'VOCÊ ENCONTROU.' },
    c2: { title: 'O Maicão realmente enlouqueceu.', accent: 'Você descobriu. Agora aproveita.', poster: 'O Maicão enlouqueceu', tag: 'OS SÓCIOS QUE NÃO NOS OUÇAM.' },
    c3: { title: 'Seu próximo sofá vem com uma surpresa.', accent: 'Passe o dedo. Descubra a sua.', poster: 'Seu próximo sofá vem com uma surpresa', tag: 'É SUA VEZ DE RASPAR.' },
    c4: { title: 'A gente avisou. Agora raspe.', accent: 'Já que você chegou até aqui…', poster: 'Não escaneie esse QR Code', tag: 'CURIOSIDADE TEM RECOMPENSA.' },
    c5: { title: 'Tá aqui. Só falta descobrir o que é.', accent: 'Tem um benefício esperando por você.', poster: 'Tem uma coisa sua aqui', tag: 'ACHOU O QUE ERA SEU.' }
  }
};
function versionOf(value) { return Object.hasOwn(CONFIG.versions, value) ? value : 'c1'; }
function isLive() {
  return process.env.RASPADINHA_LIVE === 'true' && Boolean(CONFIG.startingPrice && CONFIG.discountTerms &&
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
    (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN));
}
module.exports = { CONFIG, versionOf, isLive };
