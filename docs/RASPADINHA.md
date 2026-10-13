# Raspadinha — Outlet do Maicão

## URLs para revisão

`/raspadinha?v=c1` a `?v=c5`. O parâmetro inválido ou ausente usa c1.
As cinco aberturas estão em `campaign/raspadinha-config.js`.

URLs de cartazes, depois da aprovação:
`/raspadinha?v=c2&utm_source=cartaz&utm_medium=qrcode&utm_campaign=raspadinha&utm_content=academia_layout2`

Use um `utm_content` diferente para cada ponto físico/layout. O cupom registra versão, ponto e todos os UTMs. A atribuição da primeira participação é preservada ao visitar outra versão.

## Estado desta entrega

Prévia interativa por padrão, identificada na página e em cada cupom/download/mensagem. Não emite benefícios comerciais reais. Eventos de teste vão apenas ao `window.dataLayer`, sem enviar dados ao Meta/Google. Página com noindex enquanto prévia.

Prêmios em 50/50, única participação neste navegador compartilhada pelas cinco páginas. Troca única sem mudar código nem validade. Validade de 7 dias começa ao revelar. A prévia usa localStorage e Web Locks quando disponível. Em live o servidor é a autoridade e a criação/troca são atômicas via Redis.

Cookies/localStorage NÃO impedem nova participação se o visitante apagar os dados ou usar outro navegador/aparelho. Sem cadastro, não há garantia de uma participação por pessoa. Não apresentamos essa garantia.

## Antes da campanha real

- TODO: definir `startingPrice` (Pix), `discountTerms` (base Pix/cartão e cumulação) e confirmar chances 50/50 com a loja.
- TODO: configurar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` na Vercel (ou `KV_REST_API_URL`/`KV_REST_API_TOKEN`). Nunca colocar tokens no repositório.
- TODO: ativar `RASPADINHA_LIVE=true` apenas após aprovação comercial e configuração do banco. Redeploy necessário. Sem todos os requisitos, permanece em prévia.
- TODO: conectar `ga4Id` em config se desejar coleta GA4. Meta usa ID existente 1832634061075614 e endpoint CAPI existente.
- TODO: definir procedimento de conferência e baixa do cupom com a equipe. Esta entrega registra cupons e cliques, mas NÃO inclui painel de resgate/vendas. Não utilizar um print como prova de validade: conferir benefício atual no registro, pois troca invalida o anterior.
- TODO: preparar os QR Codes finais somente após aprovação e conferir leitura em papel. Sem alterar cartazes nesta entrega.

O site principal não é substituído. `/fofoca` e `/api/fofoca` redirecionam para `/raspadinha` preservando query. Arquivos antigos permanecem no histórico do Git para recuperação.

## Operação e dados

API `POST /api/raspadinha-cupom`: `state`, `start`, `reveal`, `swap`, `whatsapp`.
Identificador aleatório HttpOnly, SameSite=Lax; banco usa SHA-256 desse identificador na chave. Cliente não escolhe prêmio, código ou datas. Resultados só são retornados após revelação.
Redis: `raspadinha-2026-01:visitor:<hash>` guarda cupom, origem, início, revelação, troca e contador de cliques no WhatsApp. `raspadinha-2026-01:code:<codigo>` aponta à chave do registro. Retenção de um ano para impedir nova emissão após expiração de sete dias, renovada ao interagir. Com uma nova campanha, mude `campaign` conscientemente para liberar nova participação.
Falha do banco nunca produz cupom comercial local como alternativa.

Eventos GA4: `page_view`, `raspadinha_iniciada`, `raspadinha_revelada`, `beneficio_trocado`, `whatsapp_click`, `cupom_salvo`, `como_chegar`. `version` é origem do cupom; `page_version` é a abertura acessada. UTMs e ponto em cada evento.
Meta: PageView, ViewContent (revelação), Lead (WhatsApp), FindLocation. Browser/CAPI compartilham eventID. Não transmite código do cupom nem identificador interno para Meta. Configuração CAPI já existente preservada.

## Referências técnicas

- https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- https://upstash.com/docs/redis/features/restapi

## Verificação

`node --test tests/*.test.js`
