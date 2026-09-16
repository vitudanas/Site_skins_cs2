# DNA da Skin

Um site para explorar combinações de skins e adesivos do Counter-Strike 2.

## O que funciona

- Quatro skins: AWP Duality, AK-47 Neon Rider, M4A1-S Decimator e USP-S Cortex.
- Oito adesivos reais e sugestões em três estilos: tom sobre tom, contraste e minimalista.
- Prévia 2D com até cinco adesivos; arrastar, ajustar com as setas, girar, redimensionar, remover e limpar.
- Rascunho automático: skin, estilo, posições, rotação e tamanho restaurados ao recarregar.
- Coleção de até 12 crafts com nomes, abertura e exclusão.
- Comparação da bancada com uma referência salva e gerador de variações da curadoria.
- Layout adaptado para celular e computador.
- Ferramenta WebMCP opcional para configurar a composição em navegadores compatíveis.

A prévia é ilustrativa: perspectiva, proporções, desgaste e efeitos holográficos podem diferir no CS2. Não há integração com inventário Steam, consulta de preços ou visualizador 3D nesta versão. Rascunho e crafts ficam somente neste navegador, usando armazenamento local; não sincronizam entre aparelhos. Limpar os dados do navegador apaga a coleção. Se o armazenamento estiver indisponível ou cheio, a bancada funciona e informa a falha de salvamento.

## Executar localmente

Com Node.js instalado, execute `node preview.cjs` e abra o endereço mostrado no terminal. Não é necessário instalar dependências.

Verificação antes de publicar: `node scripts/check-public.cjs`. Testes do salvamento, validação de dados, gerador e integração da bancada: `node --test scripts/craft.test.cjs`.

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
