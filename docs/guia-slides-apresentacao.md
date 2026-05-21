# Guia de slides — Apresentação Banca DAC 2026 (EquipFlow)

**Formato sugerido:** 11 slides + tela de demonstração ao vivo (ou slide de backup com prints).  
**Tempo total:** ~20 min (12–15 min slides + 5–8 min demo).  
**Estilo visual:** fundo claro ou escuro neutro; logo EquipFlow (`frontend/public/brand/`); pouco texto por slide; ícones ou bullets curtos.  
**Capturas prontas:** `docs/screenshots/` (numeradas 01–10).

---

## Diretrizes gerais de montagem

| Regra | Recomendação |
|-------|----------------|
| Texto | Máximo 5–7 bullets por slide; frases de uma linha |
| Títulos | Um título forte por slide; subtítulo opcional em cinza |
| Imagens | Preferir 1 print grande ou diagrama; evitar slide “só texto” nos slides 2, 6, 8 e 10 |
| Hierarquia | Título → mensagem principal (1 frase) → bullets ou colunas |
| Slide 7 | Três colunas ou três cards — é o slide mais importante para a banca |
| Demo | Slide 10 pode ficar visível durante a demo como “roteiro na tela” |

---

## Slide 1 — Capa

**Layout:** centralizado; logo no topo ou à esquerda.

**Conteúdo obrigatório:**
- Logo **EquipFlow**
- Título: **EquipFlow — plataforma web para controle de empréstimo de equipamentos**
- Subtítulo: DAC 2026 · TADS · Semestre 05 · UCDB
- Linha inferior: **Equipe:** [nomes e RAs] · **Professor referência:** Alexandre dos Santos Batista — RF 15881
- Rodapé: Campo Grande/MS · 2026

**Elementos visuais:** fundo limpo; opcional imagem sutil de laboratório/equipamentos (baixa opacidade).

**Não incluir:** stack técnica, problema ou demo — reservar para slides seguintes.

---

## Slide 2 — O problema (NRDT)

**Layout:** duas colunas — esquerda texto, direita ilustração **ou** print desfocado de planilha caótica; alternativa: coluna única com ícones de “antes”.

**Título:** *Gestão fragmentada gera custo para a organização*

**Mensagem principal (destaque):**  
Sem sistema único, laboratórios perdem tempo, patrimônio e confiança operacional.

**Bullets:**
- Cenário: **NRDT** — núcleo de recursos didáticos (notebooks, projetores, kits)
- Hoje: planilhas, papel, mensagens informais
- Consequências: **conflito de uso** · **falta de rastreio** · **atrasos sem responsável** · **retrabalho da coordenação**

**Visual sugerido:** ícones ❌ planilha / ❌ WhatsApp / ❌ “quem tem o quê?” — ou sem imagem, apenas bullets fortes.

**Opcional:** mini-print `06-solicitante-painel.png` com legenda “situação desejada” só se quiser contraste antes/depois no slide 4.

---

## Slide 3 — Público-alvo

**Layout:** dois cards lado a lado (50% / 50%).

**Título:** *Quem usa o EquipFlow*

| Card esquerda — Administrador | Card direita — Solicitante |
|-------------------------------|----------------------------|
| Cadastro e edição do acervo | Catálogo de disponíveis |
| Aprovar / recusar pedidos | Pedido com prazo + termo |
| Visão de ativos, pendentes e histórico | Acompanhar e registrar devolução |

**Rodapé do slide (uma linha):** Login com **perfis distintos** — mesma plataforma, permissões diferentes.

**Visual sugerido:** ícones de escudo (admin) e usuário (solicitante); cores distintas leves nos cards.

---

## Slide 4 — A solução

**Layout:** título + frase central grande + 3 pilares em linha.

**Título:** *A proposta*

**Frase central (fonte maior):**  
**Uma plataforma web que centraliza patrimônio, status e todo o ciclo de empréstimo e devolução.**

**Três pilares (ícones + 2 palavras cada):**
- **Eficiência** — menos retrabalho
- **Usabilidade** — painéis claros por perfil
- **Acessibilidade** — inclusão digital

**Fluxo em uma linha (setas horizontais):**  
Solicitação → Pendente → Aprovação → Ativo → Devolução → Finalizado

**Visual sugerido:** diagrama de fluxo simples; sem detalhe técnico neste slide.

---

## Slide 5 — Arquitetura técnica

**Layout:** diagrama central ocupando ~60% do slide; legenda de tecnologias abaixo.

**Título:** *Arquitetura cliente-servidor*

**Diagrama (obrigatório):**

```
[Navegador — React + TypeScript + Vite]
            ↓  HTTP / JSON / JWT
[API REST — FastAPI + Python]
            ↓
[Banco — SQLite (protótipo)]
```

**Legenda em 4 bullets:**
- Front-end: interface e experiência do usuário
- Back-end: regras de negócio e segurança
- Comunicação: REST, JSON, token Bearer
- Redes: modelo cliente-servidor; **HTTPS** em produção

**Nota pequena no rodapé:** Em produção: PostgreSQL + hospedagem estática do front.

**Não incluir:** código-fonte ou lista longa de endpoints.

---

## Slide 6 — Funcionalidades entregues

**Layout:** lista numerada 1–5 à esquerda; print à direita (`03-admin-painel.png` ou `06-solicitante-painel.png`).

**Título:** *O que o protótipo faz hoje*

| # | Funcionalidade | Uma linha no slide |
|---|----------------|-------------------|
| 1 | Painéis por perfil | KPIs: disponíveis, pendentes, ativos, em atraso |
| 2 | Gestão de patrimônio | Cadastro, edição, status e manutenção |
| 3 | Catálogo e pedido | Ficha do item + prazo + termo de responsabilidade |
| 4 | Aprovação | Admin aprova ou recusa antes da saída do item |
| 5 | Rastreio e alertas | Histórico + destaque de empréstimos em atraso |

**Rodapé:** *MVP funcional — não é mockup.*

---

## Slide 7 — Valor para a organização (perguntas da banca)

**Layout:** **três colunas iguais** com título de pergunta no topo de cada coluna. Este slide deve ser o mais legível da apresentação.

**Título do slide:** *Por que a organização adota o EquipFlow?*

### Coluna 1 — Como ajuda na prática?

**Bullets:**
- Painel único para toda a equipe
- Catálogo em tempo real
- Pedido digital com termo registrado
- Aprovação e devolução em poucos cliques
- Menos idas ao laboratório e menos “quem está com o quê?”

### Coluna 2 — Que problema resolve?

**Bullets:**
- Gestão **descentralizada** de recursos físicos
- Falta de **rastreabilidade** (quem, o quê, até quando)
- **Conflito** de reserva do mesmo item
- Atrasos **sem responsável** identificado

### Coluna 3 — Benefícios imediatos

**Bullets:**
- **Redução** de tempo administrativo
- **Melhor uso** do acervo compartilhado
- Processos **padronizados** e auditáveis
- **Equidade**: mesma visibilidade para todos os perfis autorizados

**Visual sugerido:** três cards com cor de borda distinta; opcional ícones discretos por coluna.

---

## Slide 8 — Usabilidade, acessibilidade e inclusão

**Layout:** grid 2×2 de recursos + print lateral (`01-login-claro.png` ou `02-login-escuro.png`).

**Título:** *Experiência pensada para pessoas, não só para máquinas*

**Quatro blocos:**

| Bloco | Conteúdo no slide |
|-------|-------------------|
| Linguagem | Interface em português; rótulos claros |
| Visual | Tema claro/escuro; contraste e foco visível |
| Acessibilidade | Skip links, ARIA, tabelas com legenda para leitores de tela |
| Mobilidade | Layout responsivo; QR para abrir no celular (mesma rede) |

**Rodapé:** Alinhado aos critérios do DAC: eficiência, usabilidade, acessibilidade e inclusão.

---

## Slide 9 — Limitações e evolução

**Layout:** duas metades — esquerda “Hoje (protótipo)”, direita “Próximos passos”.

**Título:** *Transparência e caminho de evolução*

**Hoje:**
- Protótipo acadêmico · cenário NRDT fictício
- SQLite · contas de demonstração
- Alertas de atraso **visuais** no painel

**Próximos passos:**
- PostgreSQL em produção
- Notificações por e-mail
- Testes automatizados
- Políticas de segurança reforçadas

**Tom visual:** honesto, sem pedir desculpas excessivas — lista objetiva.

---

## Slide 10 — Demonstração ao vivo

**Layout:** tabela ou checklist grande; deixar este slide na tela durante a demo.

**Título:** *Demonstração — fluxo completo*

**Subtítulo:** Contas de demonstração

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Solicitante | `usuario@labnrdt.edu.br` | `Usuario@123` |
| Administrador | `admin@labnrdt.edu.br` | `Admin@123` |

**Checklist na tela (marcar ao vivo):**

1. ☐ Login solicitante → painel e catálogo **disponíveis**
2. ☐ Ficha do equipamento → pedido **passo 1** (prazo) → **passo 2** (termo) → status **pendente**
3. ☐ Login admin → **aprovar** → item **emprestado** na fila de ativos
4. ☐ Login solicitante → **registrar devolução**
5. ☐ Item volta a **disponível** no catálogo

**Opcional no rodapé:** API documentada em `/docs` (Swagger) · repositório GitHub

**Backup se a rede falhar:** sequência de prints `08` → `09` → `05` → `06` em slides extras.

---

## Slide 11 — Encerramento

**Layout:** centralizado; minimalista.

**Conteúdo:**
- Logo EquipFlow
- Frase de fechamento: **Tecnologia a serviço da gestão de recursos compartilhados**
- Repositório: [URL do GitHub]
- **Obrigado — perguntas?**

**Não incluir:** novos tópicos técnicos; apenas reforço da mensagem e contato/repositório.

---

## Ordem sugerida e tempo por slide

| Slide | Tema | Tempo aprox. |
|-------|------|----------------|
| 1 | Capa | 0:30 |
| 2 | Problema | 1:30 |
| 3 | Público-alvo | 1:00 |
| 4 | Solução | 1:00 |
| 5 | Arquitetura | 2:00 |
| 6 | Funcionalidades | 2:00 |
| 7 | Valor (banca) | 3:00 |
| 8 | UX / acessibilidade | 1:30 |
| 9 | Limitações | 1:00 |
| 10 | Demo | 5–8 min |
| 11 | Encerramento | 0:30 |

---

## Mapeamento prints → slides

| Arquivo | Usar no slide |
|---------|----------------|
| `01-login-claro.png` / `02-login-escuro.png` | 8 |
| `03-admin-painel.png` | 6 |
| `05-admin-emprestimos-ativos.png` | 10 (backup) |
| `06-solicitante-painel.png` | 6 ou 10 |
| `08` + `09` (pedido 2 passos) | 10 (backup) |
| `10-api-swagger.png` | 5 ou 10 (opcional) |

---

## Checklist antes de apresentar

- [ ] Nomes e RAs preenchidos no slide 1
- [ ] Slide 7 com fonte legível à distância (testar projetor)
- [ ] Sistema rodando (`iniciar-equipflow.bat` ou `npm run dev`)
- [ ] Slide 10 visível durante a demo
- [ ] PDF do projeto (`documento-projeto-dac.md`) entregue conforme AVA

---

*Alinhado a `docs/checklist-orientacoes-ucdb.txt` e `docs/documento-projeto-dac.md`.*
