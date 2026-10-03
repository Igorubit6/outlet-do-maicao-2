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
