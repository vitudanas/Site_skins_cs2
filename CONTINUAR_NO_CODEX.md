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
