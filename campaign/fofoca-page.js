'use strict';

// CONFIGURAÇÃO DA CAMPANHA — todas as diferenças entre versões ficam aqui.
const CONFIG = {
  siteUrl: 'https://outlet-do-maicao-2.vercel.app',
  pixelId: '1832634061075614', // ID real fornecido; nenhum token é exposto.
  ga4Id: '', // TODO: preencher o ID de medição real, no formato G-XXXXXXXXXX.
  teaserDescription: 'Assista ao vídeo e descubra a fofoca.',
  mysteryCover: '/assets/fofoca/mystery-cover.svg',
  whatsapp: '5519996524100',
  offer: 'Fale FOFOCA e ganhe um PUFF na compra do seu sofá. Vale na loja ou no WhatsApp.',
  validity: 'Garanta seu puff até __/__/____.', // TODO: informar a data limite real da campanha.
  puffPhoto: '/assets/fofoca/puff-placeholder.svg', // TODO: substituir pela foto otimizada do puff real.
  startingPrice: 'R$ ___', // TODO: confirmar preço inicial à vista no Pix.
  address: 'Rua Oswaldo Oscar Barthelson, 1249 — Jardim Londres, Campinas - SP',
  reference: 'Na Av. John Boyd Dunlop, em frente à Faculdade Anhanguera',
  mapsEmbed: 'https://www.google.com/maps?q=-22.9201181,-47.111243&hl=pt-BR&z=17&output=embed',
  mapsRoute: 'https://www.google.com/maps/dir/?api=1&destination=-22.9201181,-47.111243',
  delivery: 'Pronta entrega no mesmo dia',
  deliveryNote: 'Para peças disponíveis, mediante confirmação do horário e da entrega com a equipe.',
  googleRating: '5,0', // TODO: reconfirmar a nota antes de distribuir os QR Codes.
  googleReviews: '190 avaliações', // TODO: atualizar a contagem do Google antes da campanha.
  versions: {
    c1: {
      headline: 'Sim, o Maicão fez isso.',
      subheadline: 'Ele baixou o preço dos sofás e achou que ninguém ia perceber.',
      video: '/assets/fofoca/video-c1.mp4', // TODO: adicionar MP4 vertical 9:16, H.264, otimizado para 4G.
      videoReady: false, // TODO: mudar para true quando o vídeo existir.
      poster: '/assets/fofoca/mystery-cover.jpg', // TODO: capa vertical exclusiva da c1, sem marca/revelação.
      imageAlt: 'Uma fofoca esperando para ser revelada',
      buttons: [{ id: 'puff', label: 'Quero meu puff', message: 'Oi! Vi a FOFOCA do Maicão e quero meu puff. (C1)' }]
    },
    c2: {
      headline: 'Pronto. Descobri quem é a outra.',
      subheadline: 'Ela é macia, cabe na sala e ele não larga dela por nada.',
      video: '/assets/fofoca/video-c2.mp4', // TODO: adicionar MP4 vertical 9:16 otimizado.
      videoReady: false, // TODO: mudar para true quando o vídeo existir.
      poster: '/assets/fofoca/mystery-cover.jpg', // TODO: capa vertical exclusiva da c2, sem marca/revelação.
      imageAlt: 'Uma fofoca esperando para ser revelada',
      buttons: [{ id: 'outra', label: 'Quero conhecer a outra', message: 'Oi! Vim pela FOFOCA da outra e quero meu puff. (C2)' }]
    },
    c3: {
      headline: 'A Yasmin descobriu tudo.',
      subheadline: 'O Maicão trocou a Yasmin por outro sofá. Agora você decide quem fica.',
      video: '/assets/fofoca/video-c3.mp4', // TODO: adicionar MP4 vertical 9:16 otimizado.
      videoReady: false, // TODO: mudar para true quando o vídeo existir.
      poster: '/assets/fofoca/mystery-cover.jpg', // TODO: capa vertical exclusiva da c3, sem marca/revelação.
      imageAlt: 'Uma fofoca esperando para ser revelada',
      buttons: [
        { id: 'yasmin', label: 'Quero a Yasmin', message: 'Oi! Vim pela FOFOCA e quero a Yasmin + meu puff. (C3)' },
        { id: 'outro', label: 'Quero o outro', message: 'Oi! Vim pela FOFOCA e quero o outro sofá + meu puff. (C3)' }
      ],
      comparison: [
        { name: 'Yasmin', photo: '/assets/linha-premium-v2.webp', features: ['Característica 1', 'Característica 2', 'Característica 3'], price: 'R$ ___' }, // TODO: foto real, 3 características e preço da Yasmin.
        { name: 'O outro', photo: '/assets/linha-comfort.webp', features: ['Característica 1', 'Característica 2', 'Característica 3'], price: 'R$ ___' } // TODO: definir modelo, foto real, 3 características e preço do outro sofá.
      ]
    }
  }
};

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const icons = {
  whatsapp: '<path d="M20.5 3.5A11.9 11.9 0 0 0 12 0 11.9 11.9 0 0 0 1.7 17.9L0 24l6.3-1.6A11.9 11.9 0 0 0 24 11.9c0-3.2-1.2-6.2-3.5-8.4ZM12 21.8a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.9 9.9 0 1 1 8.3 4.6Zm5.4-7.4-2-1c-.3-.1-.5-.1-.7.2l-.9 1.2c-.2.2-.4.2-.7.1-.3-.2-1.2-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.1-.3 0-.5.2-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5 0-.8.3-.2.3-1 1.1-1 2.5 0 1.5 1.1 2.9 1.2 3.1.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"/>',
  sofa: '<path d="M5 13V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6M3 11h2v4h14v-4h2v8H3zM5 19v2m14-2v2"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',
  truck: '<path d="M2 5h12v12H2zM14 9h4l4 5v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
  sound: '<path d="M11 4 6 8H2v8h4l5 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  play: '<path d="m9 5 11 7-11 7Z"/>'
};
function icon(name) { return `<svg viewBox="0 0 24 24" aria-hidden="true" ${name === 'whatsapp' ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"'}>${icons[name]}</svg>`; }
function whatsappButton(button, placement, secondary = false) {
  return `<a class="cta${secondary ? ' cta-secondary' : ''}" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(button.message)}" target="_blank" rel="noopener" data-whatsapp data-button="${escape(placement + '_' + button.id)}" data-label="${escape(button.label)}">${icon('whatsapp')}<span>${escape(button.label)}</span></a>`;
}
function renderPage(input) {
  const version = Object.hasOwn(CONFIG.versions, input) ? input : 'c1';
  const current = CONFIG.versions[version];
  const canonical = `${CONFIG.siteUrl}/fofoca?v=${version}`;
  const client = JSON.stringify({ version, pixelId: CONFIG.pixelId, ga4Id: CONFIG.ga4Id, video: current.video, videoReady: current.videoReady }).replace(/</g, '\\u003c');
  const comparison = current.comparison ? `<section class="comparison section" aria-labelledby="comparison-title"><p class="eyebrow">VOCÊ ESCOLHE O FINAL</p><h2 id="comparison-title">Yasmin x o outro</h2><div class="comparison-grid">${current.comparison.map(card => `<article class="sofa-card"><img src="${escape(card.photo)}" alt="Representação ilustrativa de ${escape(card.name)}" width="640" height="480" loading="lazy" decoding="async"><div class="sofa-card-body"><h3>${escape(card.name)}</h3><ul>${card.features.map(feature => `<li>${escape(feature)}</li>`).join('')}</ul><p class="price">a partir de <strong>${escape(card.price)}</strong></p><small>À vista no Pix</small></div></article>`).join('')}</div><p class="fine-print">Imagens meramente ilustrativas. Confirme modelos e disponibilidade com a loja.</p></section>` : '';
  const proofs = [
    ['sofa', `Sofás a partir de ${CONFIG.startingPrice}`, 'À vista no Pix'],
    ['card', 'Até 21x no cartão ou Pix à vista', 'No cartão, com acréscimos em qualquer parcela.'],
    ['truck', CONFIG.delivery, CONFIG.deliveryNote],
    ['pin', 'Frete fixo R$ 100 para toda Campinas', 'Escadarias: adicional de R$ 10 por escadaria, pago ao entregador.'],
    ['star', `Nota ${CONFIG.googleRating} no Google`, CONFIG.googleReviews]
  ];
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#102c6b">
<title>${escape(current.headline)} | FOFOCA</title><meta name="description" content="${escape(CONFIG.teaserDescription)}"><link rel="canonical" href="${canonical}"><link rel="icon" href="${CONFIG.mysteryCover}">
<meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><meta property="og:site_name" content="FOFOCA"><meta property="og:title" content="${escape(current.headline)}"><meta property="og:description" content="${escape(CONFIG.teaserDescription)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${CONFIG.siteUrl}${current.poster}"><meta property="og:image:alt" content="${escape(current.imageAlt)}"><meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Montserrat:wght@600;700;800;900&display=swap" rel="stylesheet"><link rel="preload" as="image" href="${escape(current.poster)}"><link rel="stylesheet" href="/assets/fofoca/fofoca.css">
<script id="fofoca-config" type="application/json">${client}</script><script defer src="/assets/fofoca/fofoca.js"></script></head>
<body data-version="${version}">
<main class="campaign"><section class="intro" aria-labelledby="headline"><p class="campaign-tag">TEM COISA QUE VOCÊ PRECISA VER.</p><h1 id="headline">${escape(current.headline)}</h1></section>
<section class="video-section" aria-label="Vídeo da campanha"><div class="video-frame"><video id="campaign-video" width="540" height="960" poster="${escape(current.poster)}" muted loop playsinline preload="none" aria-label="Vídeo da FOFOCA, versão ${version}"></video><div class="video-title" aria-hidden="true"><span>FOFOCA</span><small>TOQUE. DESCUBRA. TIRE SUAS CONCLUSÕES.</small></div><button type="button" id="sound-toggle" class="sound-toggle" aria-controls="campaign-video reveal-content" aria-expanded="false" aria-pressed="false">${icon('play')}<span>Assistir à fofoca</span></button><p id="video-status" class="video-status" role="status">Toque para descobrir o que aconteceu.</p></div><p class="fine-print video-caption">A revelação começa quando você dá o play.</p><noscript><p class="fine-print">Ative o JavaScript do navegador para assistir e revelar a página.</p></noscript></section>
<div id="reveal-content" hidden>
<p class="subheadline reveal-subheadline">${escape(current.subheadline)}</p>
<section class="offer" aria-label="Oferta da campanha"><div class="offer-copy"><span class="eyebrow">ESSA PARTE É PRA VOCÊ</span><h2>${escape(CONFIG.offer)}</h2><p>${escape(CONFIG.validity)}</p></div><img class="puff-photo" src="${CONFIG.puffPhoto}" alt="Espaço reservado para a foto do puff da oferta" width="180" height="180" loading="lazy" decoding="async"></section>
<div class="cta-group" aria-label="Fale com a loja">${current.buttons.map((button, index) => whatsappButton(button, 'oferta', index > 0)).join('')}<p class="cta-note">É só chamar e falar <strong>FOFOCA</strong>.</p></div>
${comparison}
<section class="proofs section" aria-labelledby="proof-title"><p class="eyebrow">CONFORTO COM MOTIVO PRA SORRIR</p><h2 id="proof-title">A fofoca passa.<br>Seu conforto fica.</h2><ul class="proof-list">${proofs.map(([name, title, note]) => `<li><span class="proof-icon">${icon(name)}</span><div><strong>${escape(title)}</strong><p>${escape(note)}</p></div></li>`).join('')}</ul></section>
<section class="location section" aria-labelledby="location-title"><p class="eyebrow">VEM VER DE PERTO</p><h2 id="location-title">Seu próximo sofá<br>está aqui em Campinas.</h2><p class="address">${escape(CONFIG.address)}</p><p class="reference">${escape(CONFIG.reference)}</p><div class="map-frame"><iframe title="Google Maps: loja no Jardim Londres, Campinas" data-src="${escape(CONFIG.mapsEmbed)}" width="700" height="330" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div><a class="cta route-cta" data-location data-button="como_chegar" href="${escape(CONFIG.mapsRoute)}" target="_blank" rel="noopener">${icon('pin')}<span>Como chegar</span></a></section>
<section class="closing section" aria-labelledby="closing-title"><p class="eyebrow">AGORA VOCÊ JÁ SABE</p><h2 id="closing-title">${escape(CONFIG.offer)}</h2><p class="validity">${escape(CONFIG.validity)}</p><div class="cta-group">${current.buttons.map((button, index) => whatsappButton(button, 'fecho', index > 0)).join('')}</div></section>
<footer class="campaign-footer">Campinas · Imagens meramente ilustrativas.</footer>
<a class="floating-whatsapp" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(current.buttons[0].message)}" data-whatsapp data-button="flutuante_${current.buttons[0].id}" data-label="${escape(current.buttons[0].label)}" target="_blank" rel="noopener" aria-label="${escape(current.buttons[0].label)} no WhatsApp">${icon('whatsapp')}</a>
</div></main></body></html>`;
}
module.exports = { CONFIG, renderPage };
