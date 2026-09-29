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
