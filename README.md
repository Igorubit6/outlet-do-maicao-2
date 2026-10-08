# Outlet do Maicão — Loja 02

Site institucional estático para apresentar a loja e as linhas de sofás, com foco em visitas à loja e conversas pelo WhatsApp. Ele não exibe estoque ou preços de produtos.

## Páginas

- `index.html`: apresentação da loja, comparação das linhas, processo, entrega, avaliações, localização e dúvidas.
- `saldao.html`: peças rotativas com pequenos detalhes.
- `comfort.html`: conforto e qualidade para o dia a dia.
- `premium.html`: modelos de materiais e acabamento superiores.

Todas as páginas usam `styles.css`, a logo em `assets/logo-nova.jpg` e imagens de sofás reimaginadas, identificadas como ilustrativas. `build_pages.py` contém o conteúdo compartilhado e gera as quatro páginas; execute `python3 build_pages.py` após alterar esse conteúdo. `build_preview.py` gera uma prévia autônoma na pasta `../revisao`.

## Atualizações importantes

- Confirme disponibilidade, características, condições de entrega e formas de pagamento com a loja antes de alterar os textos.
- A seção de avaliações contém trechos selecionados de comentários públicos do Google. A nota e a contagem foram conferidas em 29/09/2026; revise esses dados periodicamente.
- As imagens geradas representam as linhas e não uma peça específica do estoque. Mantenha o aviso “Imagens meramente ilustrativas”.
- O mapa incorporado e os botões de rota dependem do Google Maps e de conexão com a internet.

## Publicação

Site estático na raiz do repositório. Na Vercel, use framework **Other**, sem comando de build e com output na raiz. A implantação ligada à branch `main` deve atualizar após o push.

## Meta Pixel e API de Conversões

Pixel: `1832634061075614`. As quatro páginas carregam `assets/meta-tracking.js`: `PageView` na abertura e `Contact` no clique em links do WhatsApp. Clique não significa mensagem enviada ou compra. Cada evento usa o mesmo `event_id` no Pixel e na API para permitir deduplicação.

`api/meta-events.js` é uma função Node da Vercel. O site não deve ser servido apenas como arquivos estáticos em outro provedor sem adaptar essa função.

1. Gere um novo token da API de Conversões no Gerenciador de Eventos da Meta. Revogue/substitua o token compartilhado na conversa; excluir a conversa não o revoga.
2. Na Vercel, abra o projeto > Settings > Environment Variables. Cadastre `META_CAPI_ACCESS_TOKEN` com o novo token para Production. Não coloque o token no repositório.
3. Para validar, cadastre temporariamente `META_TEST_EVENT_CODE` com o código da aba Testar eventos da Meta. Faça um redeploy: variáveis novas só entram em uma nova implantação.
4. Abra o site publicado pelo fluxo de teste da Meta e clique em WhatsApp. Confira `PageView` e `Contact`, eventos de navegador e servidor e deduplicação. O evento de servidor deve compartilhar o ID do evento de navegador. Bloqueadores de anúncios podem impedir o Pixel.
5. Remova `META_TEST_EVENT_CODE`, faça outro redeploy e confira Diagnósticos. A API não está operacional enquanto faltar o token ou a Meta não aceitar os eventos.

O servidor recebe IP e agente do navegador dos cabeçalhos da requisição, além de `_fbp`/`_fbc` quando disponíveis. URLs de eventos não incluem parâmetros de consulta. Não envia textos de mensagens, nomes, e-mails ou telefones de visitantes. `META_GRAPH_API_VERSION` é opcional (padrão `v23.0`).

Verificação local: `node --test tests/meta-events.test.js`; regeneração: `python3 build_pages.py`. Não adicione outro snippet com `PageView` no mesmo site, para evitar contagem duplicada.

## Campanha FOFOCA — página separada

Rota `/fofoca`: sem `v` (ou com valor desconhecido), usa c1. Links: `/fofoca?v=c1`, `/fofoca?v=c2`, `/fofoca?v=c3`. Nenhuma página ou navegação do site institucional foi alterada. `vercel.json` encaminha apenas essas rotas para `api/fofoca.js`. A função gera HTML e metatags OG por versão antes de executar JavaScript; os scrapers do WhatsApp recebem o título, descrição e imagem corretos.

Toda configuração de texto, oferta, imagens, vídeos, preços, IDs e diferenças entre versões está no objeto `CONFIG` no topo de `campaign/fofoca-page.js`. Procure `TODO` nesse arquivo para completar:

- Vídeos `assets/fofoca/video-c1.mp4`, `video-c2.mp4`, `video-c3.mp4`: vertical 9:16, H.264 + áudio AAC, faststart, idealmente 720×1280 e até 3–5 MB. Depois de adicionar cada vídeo, mude seu `videoReady` para `true`. Sem vídeo, a capa e os CTAs funcionam, e não há download/404 de MP4.
- Capas exclusivas de cada versão e foto do puff em WebP otimizado. As imagens de sofás existentes e a ilustração do puff são provisórias. Para OG, prefira imagens acessíveis publicamente; o WhatsApp pode manter cache de prévias antigas.
- Preços, validade e fotos/características dos dois cards da c3. Confirmar também nota/contagem Google e condição de entrega no mesmo dia antes da campanha.
- `ga4Id`: ID de medição real `G-...`. Sem esse ID, o evento `como_chegar` fica na fila local e não chega a uma propriedade GA4. O Pixel Meta está configurado com o ID real fornecido.

UTMs: qualquer parâmetro `utm_*` da URL é enviado como parâmetro personalizado, junto de `version`. Exemplo de QR: `/fofoca?v=c2&utm_source=cartaz&utm_medium=qrcode&utm_campaign=fofoca&utm_content=fachada`. Não coloque dados pessoais nos UTMs.

Eventos Meta e API: `PageView` na abertura; `ViewContent` uma vez ao realmente reproduzir com som (não no autoplay mudo nem no botão sem vídeo); `Lead` em qualquer CTA WhatsApp com `button`/`button_label`; `FindLocation` no botão de rota. O site institucional continua enviando `Contact` como antes. Pixel e servidor compartilham o `event_id`; não carregue `assets/meta-tracking.js` nesta campanha. `Lead` nessa campanha significa clique para o WhatsApp, não envio confirmado de mensagem.

GA4: `como_chegar` no botão de rota, com versão, botão e UTMs. Para DebugView, adicione `&debug=1` no link; isso também mostra no console apenas nome do evento, atribuição, ID do evento e status da API, sem credenciais. Configure dimensões personalizadas no GA4 para consultar `version`/`button` nos relatórios. O código de teste da Meta continua sendo a variável server-only `META_TEST_EVENT_CODE`.

Validar: `node --test tests/*.test.js`. Preços no Pix; todas as parcelas no cartão têm acréscimos. Mapa carrega de forma lazy; a página não tem menu nem links para outras páginas.

### Fluxo de revelação

A entrada das três versões mostra apenas chamada e capa misteriosa, sem marca/logotipo (inclusive favicon), oferta ou contatos. O toque em **Assistir à fofoca** revela de uma vez oferta, WhatsApp, comparação c3, benefícios, mapa, fecho e botão flutuante. Não há revelação por tempo, scroll ou autoplay. O mapa só recebe sua URL depois do toque. O conteúdo oculto usa `hidden`, inclusive para teclado e leitores de tela.

O vídeo começa com som pelo gesto da pessoa, quando estiver disponível. Enquanto os MP4s forem placeholders, o toque permite revisar a revelação e informa que o vídeo está em preparação; não dispara `ViewContent`. A data limite permanece TODO (`__/__/____`) até a confirmação. O texto não usa mais a condição de estoque.
