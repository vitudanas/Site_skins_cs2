# DNA da Skin

Um site para explorar combinações de skins e adesivos do Counter-Strike 2.

## O que funciona

- Quatro skins: AWP Duality, AK-47 Neon Rider, M4A1-S Decimator e USP-S Cortex.
- Oito adesivos reais e sugestões em três estilos: tom sobre tom, contraste e minimalista.
- Inspeção 3D das quatro armas com geometrias e texturas extraídas do CS2: rotação, zoom, frente/verso, três iluminações e foto PNG do ângulo atual.
- Posicionamento de adesivos por clique sobre as laterais do modelo 3D; verso incluído no rascunho, coleção, histórico e links.
- Prévia 2D com até cinco adesivos; arrastar, ajustar com as setas, girar, redimensionar, remover e limpar.
- Rascunho automático: skin, estilo, posições, rotação e tamanho restaurados ao recarregar.
- Coleção de até 12 crafts com nomes, abertura e exclusão.
- Comparação da bancada com uma referência salva e gerador de variações da curadoria.
- Histórico com até 50 estados: desfazer/refazer por botões ou Ctrl/⌘ Z e Shift+Ctrl/⌘ Z.
- Link para compartilhar somente a composição atual e download de prévia PNG.
- Exportar/importar coleção em JSON; importação prévia, validada e sem substituir os crafts existentes.
- Layout adaptado para celular e computador.
- Ferramenta WebMCP opcional para configurar a composição em navegadores compatíveis.

A prévia é ilustrativa: perspectiva, proporções, desgaste e efeitos holográficos podem diferir no CS2. Não há integração com inventário Steam, consulta de preços nesta versão. Rascunho e crafts ficam somente neste navegador, usando armazenamento local; não sincronizam automaticamente entre aparelhos. Use Exportar coleção e Importar coleção para transferir manualmente. Links contêm somente a composição atual; o nome e o restante da coleção não entram no link. Limpar os dados do navegador apaga a coleção. Se o armazenamento estiver indisponível ou cheio, a bancada funciona e informa a falha de salvamento.

## Executar localmente

Com Node.js instalado, execute `node preview.cjs` e abra o endereço mostrado no terminal. Não é necessário instalar dependências.

Verificação antes de publicar: `node scripts/check-public.cjs`. Testes do salvamento, validação, histórico, compartilhamento, importação, exportação e integração da bancada: `node --test scripts/*.test.cjs`.

## Hospedagem gratuita

Esta versão é compatível com GitHub Pages em repositório público no plano gratuito. Configure **Settings → Pages → Deploy from a branch → main → /docs → Save**. A publicação fica condicionada à ativação do Pages e ao sucesso da execução do GitHub.

Endereço esperado após ativação: `https://vitudanas.github.io/Site_skins_cs2/`.

Referência: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

O site não exige servidor pago, API paga ou domínio próprio. Novas funcionalidades com serviços externos deverão ter seus custos avaliados separadamente. As fontes usam Google Fonts; em caso de indisponibilidade, o navegador usa fontes alternativas.

## Organização

| Caminho | Conteúdo |
| --- | --- |
| `docs/` | Arquivos públicos do site e imagens |
| `FOLLOW.MD` | Pedidos, decisões, modificações, testes e pendências com datas |
| `AGENTS.md` | Regras permanentes para agentes que trabalham no projeto |
| `asset-sources.json` | Origem pública das imagens, sem caminhos locais |
| `preview.cjs` | Servidor de prévia local |
| `scripts/check-public.cjs` | Checagens de publicação e integridade |

## Imagens e atribuição

Imagens de itens provenientes da CDN da Valve, catalogadas pelo [ByMykel/CSGO-API](https://github.com/ByMykel/CSGO-API). A licença do catálogo não implica licença irrestrita sobre as imagens. Marcas e imagens pertencem aos respectivos titulares. Projeto independente, não afiliado à Valve.

## Inspeção 3D — LAB 04

O visualizador usa Three.js 0.180.0 incluído localmente, sob licença MIT em docs/THREE-LICENSE.txt. Os modelos GLB contêm apenas a geometria legacy usada pelas quatro pinturas, com texturas WebP embutidas (cor até 1024 px, normal até 512 px). Cada arma pesa entre 0,8 e 1,6 MB e é carregada ao abrir seu 3D; o motor é carregado uma vez por página. Não há dependência de CDN para o 3D.

Geometria e arte das pinturas são reais, mas o material usa iluminação PBR aproximada. Não reproduz o shader de pintura do CS2, float/desgaste, raspagem, holografia ou posições oficiais. Coordenadas de crafts 2D são projetadas na lateral, com adaptação de centros próximos à borda; centros fora da superfície são informados. Selecione um adesivo na lista e ative Posicionar adesivo para definir sua posição por clique. A prévia e a imagem 2D mostram somente a frente; a lista identifica adesivos no verso.

Mouse/toque: arrastar gira, roda/pinça aproxima. Câmera pelo teclado: setas, +, -, Home. Rotação automática respeita a preferência de movimento reduzido. Falhas de WebGL ou carregamento oferecem recuperação pelo modo 2D. Os testes exercitam arquivos reais e cálculos de câmera, raycast e decal; renderer, controles e downloads são simulados. Não equivalem a QA visual/GPU em navegador real.

Geometrias e pinturas: Valve e respectivos criadores do Workshop, obtidas de uma instalação do jogo e convertidas com [Source2Viewer 20.0](https://github.com/ValveResourceFormat/ValveResourceFormat/releases/tag/20.0), seguindo a [documentação de exportação](https://s2v.app/ValveResourceFormat/guides/exporting-models.html). Código de renderização: [Three.js](https://github.com/mrdoob/three.js/tree/r180). A licença MIT do motor não concede direitos irrestritos sobre assets do jogo.
