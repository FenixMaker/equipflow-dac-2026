# Capturas de tela

Arquivos PNG do protótipo EquipFlow em execução local.

| Arquivo | Legenda curta |
|---------|---------------|
| [01-login-claro.png](01-login-claro.png) | Login · tema claro |
| [02-login-escuro.png](02-login-escuro.png) | Login · tema escuro |
| [03-admin-painel.png](03-admin-painel.png) | Admin · painel |
| [04-admin-editar-equipamento.png](04-admin-editar-equipamento.png) | Admin · editar equipamento |
| [05-admin-emprestimos-ativos.png](05-admin-emprestimos-ativos.png) | Admin · filas pendentes e ativos |
| [06-solicitante-painel.png](06-solicitante-painel.png) | Solicitante · painel |
| [07-solicitante-ficha-equipamento.png](07-solicitante-ficha-equipamento.png) | Solicitante · ficha |
| [08-solicitante-pedido-emprestimo-passo1.png](08-solicitante-pedido-emprestimo-passo1.png) | Pedido · passo 1 (retirada e devolução previstas) |
| [09-solicitante-pedido-emprestimo-passo2-termo.png](09-solicitante-pedido-emprestimo-passo2-termo.png) | Pedido · passo 2 (resumo das datas + termo) |
| [10-api-swagger.png](10-api-swagger.png) | API Swagger |

| Comando | O que gera |
|---------|------------|
| `npm run screenshots` | Sobe API + Vite, captura **01–10** e encerra os processos |
| `node scripts/capture-screenshots.mjs` | Mesmas capturas (API e Vite já devem estar no ar) |
| `npm run screenshots:loan` | Apenas **08** e **09** (requer `npm run dev` ativo) |

Portas: API `:8000`, interface `:5173`.

No [README principal](../../README.md):

- **[Tour pela interface](../../README.md#tour-pela-interface)** — cada print com explicação do que mostra
- **[Galeria completa](../../README.md#galeria-completa)** — todas as imagens em grade
