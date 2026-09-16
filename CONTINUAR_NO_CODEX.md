# Continuar o DNA da Skin no Codex

Leia primeiro `AGENTS.md` e `FOLLOW.MD`. O usuário determinou que o agente faça todo o desenvolvimento e registre todos os pedidos e alterações com data/hora real, sem expor dados privados.

## Estado atual

- Site funcional em `docs/`: quatro skins, oito adesivos, três estilos de sugestão, prévia 2D com arraste, teclado, rotação, tamanho, remoção e limite de cinco adesivos.
- Código sem dependências de instalação. Prévia: `node preview.cjs`.
- Verificação: `node scripts/check-public.cjs`.
- Repositório alvo público: https://github.com/vitudanas/Site_skins_cs2, branch main.
- Os arquivos ainda não foram enviados ao GitHub. O Git local não tinha autenticação e o conector retornou 403 de permissão. O repositório remoto continha somente o README inicial na última verificação.
- A pasta original em Documentos possui histórico Git local. O ZIP não inclui `.git`; se trabalhar a partir dele, clone o repositório remoto primeiro e copie os arquivos sobre o clone para preservar o commit inicial.
- Hospedagem alvo gratuita: GitHub Pages, main, pasta /docs. Ainda não ativada/verificada.

## Próximos passos

1. Registrar o novo pedido e as ações em FOLLOW.MD.
2. Conferir autenticação e estado remoto antes do envio. Não pedir tokens ou senhas na conversa, não publicar credenciais e não fazer force push.
3. Revisar arquivos/diff e executar a checagem de publicação.
4. Enviar ao GitHub preservando o histórico remoto.
5. Configurar GitHub Pages gratuitamente em main /docs e verificar o resultado da publicação.
6. Atualizar FOLLOW.MD com ações, testes, resultados e pendências.

Não afirmar que existe visualização 3D fiel, catálogo completo, integração Steam, preços atuais ou salvamento persistente: esses recursos não estão implementados.

## Atualização da retomada — 2026-09-15T20:28:04-03:00

- Histórico Git restaurado a partir do próprio remoto nesta pasta. Commit local dca1793 contém os 25 arquivos revisados; não é necessário clonar novamente nesta cópia.
- Validação pública e whitespace passaram. Push local falhou por ausência de autenticação; conector GitHub retornou 403 ao criar blob apesar de metadados indicarem permissão.
- Após autenticação, conferir remoto, revisar novo diff, executar a checagem e enviar main sem force push. Em seguida ativar e verificar Pages em main /docs.
- As observações anteriores sobre ausência de .git e estado inicial referem-se à entrega anterior; esta entrada atualiza o estado sem apagar o histórico.

## Publicação realizada — 2026-09-15T20:37:53-03:00

- Os 25 arquivos já estão publicados na branch main por quatro commits via navegador autenticado, preservando o commit inicial. Estado anterior de envio bloqueado foi superado pela alternativa de navegador; conector segue retornando 403.
- Pages ativado em main /docs, com HTTPS obrigatório e sem contratar serviços. Endereço: https://vitudanas.github.io/Site_skins_cs2/ . Verificação final de disponibilidade em andamento neste registro.
- Arquivos remotos comparados com os locais: imagens idênticas e textos equivalentes após normalizar CRLF/LF.

## Estado final — 2026-09-15T20:38:19-03:00

- Site publicado e verificado: https://vitudanas.github.io/Site_skins_cs2/ . Pages em main /docs com HTTPS, sem plano pago.
- Composição de adesivos, troca de skin e carregamento de imagens testados na versão pública. Os 25 arquivos foram conferidos contra a cópia local.
- main local usa o histórico remoto; branch local-publication-backup preserva os commits anteriores de preparação. Nenhum force push realizado.
- Para futuras alterações, ler AGENTS.md e FOLLOW.MD, registrar pedidos/ações com relógio real, revisar conteúdo público e executar node scripts/check-public.cjs antes de enviar.
- A sessão autenticada do navegador permitiu publicar. Conector e autenticação Git local ainda precisam ser corrigidos se forem usados em próximos envios; não pedir nem registrar tokens na conversa.

## Evolução LAB 02 — 2026-09-15T21:06:34-03:00

- Implementados rascunho automático local, coleção com até 12 crafts nomeados, abrir/excluir, comparação com referência e gerador de variações da curadoria.
- Módulo docs/craft.js carregado antes de app.js. Dados somente neste navegador; limpar dados do navegador remove a coleção. Sem integração Steam, preços ou 3D.
- Oito testes automatizados passaram (node --test scripts/craft.test.cjs). Checagem pública inclui sintaxe do módulo novo.
- Publicação da atualização em andamento; verificar o resultado mais recente em FOLLOW.MD.

## LAB 02 publicada e verificada — 2026-09-15T21:08:01-03:00

- A nova versão já está disponível no endereço público. HTTP 200 e correspondência de conteúdo confirmados para HTML, app.js, craft.js e estilos.
- Etapa atual de evolução concluída. Histórico de preparação preservado em local-lab02-backup; usar main alinhada ao remoto para próxima etapa.
- Os testes automatizados cobrem armazenamento/validação/gerador e integração por documento simulado. Ainda não houve QA visual da LAB 02 em navegador real.
