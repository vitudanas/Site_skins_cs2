# Instruções permanentes do projeto

## Leia antes de trabalhar

1. Leia `FOLLOW.MD` e este arquivo antes de alterar o projeto.
2. Todo pedido do usuário relacionado ao projeto deve ser registrado em `FOLLOW.MD`, inclusive mudanças de direção, restrições, correções e pedidos ainda pendentes.
3. Registre cada alteração realizada: data/hora, motivo, arquivos, comportamento anterior e novo, verificações e resultado. Agrupe por pedido e por etapa, sem omitir correções intermediárias ou tentativas que falharam. O diff do Git guarda a alteração exata de cada linha; o FOLLOW explica todas as alterações.
4. Use o relógio real e ISO 8601 com segundos e fuso `America/Sao_Paulo` (offset aplicável na data). Diferencie horário do pedido, horário da ação e horário do registro. Quando o horário original não estiver disponível, escreva isso; nunca invente.
5. Mantenha histórico cumulativo. Corrija registros anteriores por uma nova entrada que explique a correção.

## Repositório público

- Nunca publique senhas, tokens, chaves, cookies, dados pessoais, caminhos absolutos locais, conversas privadas alheias ao projeto ou identificadores internos de serviços.
- O pedido de registrar tudo NÃO autoriza divulgar informação sensível. Substitua trechos sensíveis por `[OMITIDO: informação privada]`, mantendo o objetivo do pedido e registrando a omissão.
- Revise os arquivos e o diff staged antes de cada envio. Execute `node scripts/check-public.cjs`. A checagem é auxiliar e não substitui revisão humana/por agente.
- Não copie configurações ou histórico Git de outro ambiente. Preserve o histórico deste repositório e não faça force push.

## Desenvolvimento e hospedagem

- O agente é responsável pelo desenvolvimento completo; não transfira etapas técnicas rotineiras ao usuário.
- Priorize hospedagem gratuita. Não contrate serviços, planos pagos ou domínios sem pedido explícito.
- O site estático fica em `docs/`. Hospedagem alvo: GitHub Pages, branch `main`, pasta `/docs`.
- Não inserir credenciais no JavaScript do navegador. Integrações futuras que exijam segredos precisam de arquitetura apropriada e avaliação de custos.
- Não alegar preços atuais, integração Steam, catálogo completo ou fidelidade 3D sem implementação e validação.
- `preview.cjs` inicia uma prévia local; `node scripts/check-public.cjs` verifica arquivos públicos e referências de assets.
