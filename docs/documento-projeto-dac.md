# Documento do projeto — DAC 2026

**Curso:** 262 — Tecnologia em Análise e Desenvolvimento de Sistemas  
**Semestre:** 05  
**Componentes:** Autonomia Intelectual do Estudante; Programação Back End I; Programação Front End I; Redes de Computadores Aplicada; Tópicos Especiais em Análise de Sistemas: Tecnologias  
**Professor referência:** Alexandre dos Santos Batista — RF 15881  
**Título do projeto:** Plataforma web para controle de empréstimo de equipamentos — EquipFlow

*Equipe: Alejandro Alexandre 197890. Campo Grande/MS — 2026.*

---

## 1. Problema e público-alvo

### 1.1 Contexto

O projeto parte do cenário do **Núcleo de Recursos Didáticos em Tecnologia (NRDT)** — um núcleo fictício de laboratório, no mesmo espírito dos polos de informática e eletrônica da UCDB. Lá ficam notebooks, projetores, multímetros e kits de prototipagem que docentes e alunos usam em aula, em eventos e em trabalhos.

Hoje, sem um sistema único, o controle costuma ser feito com **planilha, papel e mensagem no grupo**. Isso gera problemas do dia a dia:

- não dá para saber com certeza **quem está com cada item** nem **até quando** deveria devolver;
- duas pessoas podem achar que o mesmo equipamento está livre;
- equipamento some do radar e vira “emprestado para sempre”;
- a coordenação gasta tempo ligando e cobrando um a um;
- quem não fala com quem “manda na planilha” fica sem saber o que está disponível.

O que queremos resolver é ter **um lugar na web** onde o patrimônio, os pedidos e as devoluções fiquem registrados, com histórico, em vez de informação espalhada.

### 1.2 Quem usa o sistema

Há dois perfis, com login separado:

**Administrador (coordenação do NRDT)** — cadastra equipamentos (nome, código de patrimônio, descrição), marca se está disponível, emprestado ou em manutenção, **aprova ou recusa** pedidos e acompanha o que está na rua.

**Solicitante (docente ou aluno autorizado)** — vê o que está livre, abre a ficha do item, faz o **pedido de empréstimo** com data de retirada e de devolução (mínimo de 3 dias entre elas), aceita o termo de responsabilidade e, depois de aprovado, **registra a devolução**.

No código os papéis são `admin` e `borrower`. A ideia é simples: quem cuida do acervo não é quem leva o notebook para casa, mas os dois precisam ver a mesma lista de disponibilidade e os mesmos prazos.

---

## 2. Justificativa da solução e das tecnologias

### 2.1 Por que web

Optamos por uma **aplicação web** porque qualquer pessoa autorizada entra pelo navegador, no laboratório ou em casa, sem instalar programa em cada PC. Os dados ficam num **banco relacional** (um registro por usuário, equipamento e empréstimo), o que ajuda a não perder histórico. O formato também combina com o que vimos nas disciplinas do semestre: front end, back end, API e rede.

### 2.2 Tecnologias

| Parte | O que usamos | Para quê |
|-------|----------------|----------|
| Interface | React 19, TypeScript, Vite | Telas do painel, formulários e listas |
| Visual | CSS modular + Tailwind (tema claro/escuro) | Painéis, tabelas responsivas, contraste e foco no teclado |
| API | Python, FastAPI, Uvicorn | Regras de negócio, login, empréstimos |
| Banco | SQLAlchemy + SQLite (`equipflow.db`) | Guardar usuários, equipamentos e empréstimos |
| Segurança | JWT + senha com hash (bcrypt) | Cada um vê só o que o perfil permite |

Em um ambiente real daria para trocar o SQLite por PostgreSQL ou MySQL; para o trabalho da DAC o SQLite basta.

### 2.3 Como o front e o back conversam

O navegador chama a API em JSON. As rotas principais são `auth`, `equipment` e `loans` (o front centraliza isso em `frontend/src/api.ts`). Quem está logado manda o token no cabeçalho `Authorization: Bearer …`.

Em desenvolvimento o Vite faz **proxy** das chamadas para `http://127.0.0.1:8000`, o que facilita testar no mesmo PC ou no celular na rede da faculdade. No build de produção usa-se a variável `VITE_API_URL`.

As regras importantes — datas do empréstimo, termo na versão certa, bloqueio se o item já tem pedido, multa por atraso — ficam no **servidor**. A tela valida para ajudar o usuário, mas quem manda é a API. Assim ninguém “furta” o sistema só mudando o formulário no navegador.

### 2.4 Manutenção depois do semestre

A API gera documentação em `/docs` (Swagger). O modelo tem três tabelas principais ligadas por chave estrangeira. Se o NRDT crescer, os passos naturais seriam: banco maior, envio de e-mail nos avisos de atraso (hoje só há alerta na tela) e hospedar front e API com HTTPS.

---

## 3. Objetivos e funcionalidades

### 3.1 Objetivo

Colocar no ar um **protótipo** que registre pedido, aprovação, uso e devolução de equipamentos didáticos, com nome de quem pediu, qual item, prazo e aceite do termo — de forma que a coordenação gaste menos tempo conferindo planilha e o aluno/docente saiba o que pode pegar.

### 3.2 O que o sistema faz (cinco pontos para a apresentação)

1. **Login e painéis** — Admin e solicitante entram com e-mail e senha ou perfil de demonstração no carrossel (ícone de administrador ou de solicitante); cada um vê um painel diferente, com contadores (disponíveis, pendentes, ativos, em atraso). No admin, as filas **Solicitações pendentes** e **Empréstimos ativos** ficam empilhadas (uma abaixo da outra) para leitura sem rolagem horizontal. A lista atualiza sozinha a cada ~12 segundos se a aba estiver aberta.

2. **Cadastro de equipamentos** — O admin inclui e edita itens, busca no acervo e muda a situação (disponível, emprestado, manutenção). Não dá para mandar para manutenção se ainda há pedido pendente ou empréstimo aberto naquele patrimônio.

3. **Pedido de empréstimo** — O solicitante vê só o que está livre, escolhe datas em um assistente de dois passos (retirada e devolução, no mínimo 3 dias de intervalo) e aceita o termo (versão `2026-05`, gravada no banco).

4. **Aprovação** — Pedido novo fica `pendente`. O admin aprova (`ativo`, equipamento vira `emprestado`, registra a retirada efetiva) ou recusa (`recusado`). Só o tomador marca a devolução (`finalizado`, equipamento volta a `disponivel`).

5. **Atraso** — Se passar da data de devolução, o sistema calcula **R$ 15,00 por dia**, marca o equipamento como bloqueado, impede novo pedido até devolver e permite ao admin **notificar o tomador** (mensagem no painel do solicitante).

Fluxo em uma linha:

```
Pedido + termo → pendente → aprovação → ativo → devolução → finalizado
                      ↘ recusado
```

### 3.3 Acessibilidade

Seguimos o básico de acessibilidade na interface: página em português, link “pular para o conteúdo”, textos alternativos em tabelas, `aria-live` em mensagens de erro, tema claro/escuro e respeito a quem prefere menos animação (`prefers-reduced-motion`). Formulários e modais têm rótulo e foco visível no teclado.

### 3.4 Dados guardados no banco

- **Usuario:** e-mail, nome, senha (hash), papel (`admin` ou `borrower`).
- **Equipamento:** nome, código de patrimônio (único), descrição, status (`disponivel`, `emprestado`, `manutencao`).
- **Emprestimo:** equipamento, tomador, datas de retirada prevista (`pickup_at`), devolução prevista (`due_at`), retirada efetiva (`approved_at`), devolução real (`returned_at`), status do pedido, data e versão do termo aceito.
- **LoanNotification:** avisos de atraso enviados pelo admin ao tomador.

---

## 4. Regras de negócio

As regras abaixo estão na API; a interface só repete o que o servidor já decidiu.

### 4.1 Estados do empréstimo

| Status | O que significa |
|--------|-----------------|
| `pendente` | Pedido enviado; o equipamento ainda não saiu de fato. |
| `ativo` | Admin aprovou; item emprestado; retirada efetiva registrada. |
| `recusado` | Admin negou; outro pode pedir o mesmo item. |
| `finalizado` | Tomador devolveu; item disponível de novo. |

Datas: no pedido o aluno informa retirada e devolução **previstas**; na aprovação grava-se a retirada **efetiva**; na devolução, a data **real**.

### 4.2 Datas do pedido

Na criação do empréstimo (`POST /loans`):

- retirada não pode ser antes de hoje;
- devolução tem que ser depois da retirada (não no mesmo dia);
- entre retirada e devolução vão pelo menos **3 dias de calendário**.

Se errar, a API devolve erro 400 com mensagem em português.

### 4.3 Termo de responsabilidade

Sem marcar o aceite o pedido não sai. A versão tem que ser `2026-05` (a mesma da tela); se a pessoa estiver com a página antiga aberta, o sistema pede para atualizar. Ficam gravados a data do aceite e a versão no empréstimo.

### 4.4 Equipamento

- `disponivel` — pode receber pedido, desde que não haja outro pendente ou ativo no mesmo código.
- `emprestado` — ligado a um empréstimo aprovado.
- `manutencao` — não aparece para pedido novo.

O solicitante só vê itens disponíveis e sem pedido na frente. O admin não pode “forçar” disponível ou manutenção enquanto houver pedido ou empréstimo aberto naquele patrimônio.

### 4.5 Quem pode fazer o quê

| Ação | Admin | Solicitante |
|------|:-----:|:-----------:|
| Cadastrar/editar equipamento | Sim | Não |
| Aprovar ou recusar pedido | Sim | Não |
| Pedir empréstimo | Não | Sim |
| Registrar devolução | Não | Sim (só o tomador daquele empréstimo) |
| Ver todos os empréstimos | Sim | Só os seus |

### 4.6 Atraso na devolução

Consideramos atraso quando o empréstimo está `ativo` e a data de devolução prevista já passou (conta pelo fim do dia em UTC).

**O que o sistema faz:**

- calcula **R$ 15,00 por dia** de atraso (arquivo `backend/app/overdue.py`);
- mostra o valor nas tabelas do admin e do solicitante;
- trata o equipamento como **bloqueado** enquanto não devolver;
- **não deixa** o tomador abrir outro pedido até regularizar;
- o admin clica em **Notificar tomador** — grava um aviso que aparece no painel do solicitante (pode marcar como lido);
- a devolução **ainda pode** ser feita pelo botão Devolver; ao finalizar, a multa para de subir e o bloqueio cai.

**O que não faz (por enquanto):** e-mail automático, débito em conta, encerrar o empréstimo sozinho. A cobrança em dinheiro e qualquer medida disciplinar ficam com a coordenação, usando o sistema como registro.

Exemplo: 3 dias de atraso → multa de R$ 45,00.

### 4.7 Outros casos que costumam surgir na banca

- **Dois pedidos no mesmo equipamento** — o primeiro pendente ou ativo trava; o segundo recebe erro.
- **Admin devolve pelo aluno** — não; só o tomador registra devolução.
- **Devolver antes do prazo** — pode, não há trava de “só no dia X”.
- **Pedido pendente para sempre** — não expira; o admin precisa aprovar ou recusar.
- **Pedido pendente e a data de retirada já passou** — o sistema não cancela sozinho; o admin decide na prática.

### 4.8 Onde está no código

| Assunto | Arquivo |
|---------|---------|
| Datas do empréstimo | `backend/app/loan_dates.py` |
| Multa e atraso | `backend/app/overdue.py` |
| Pedidos, aprovação, devolução, notificar | `backend/app/routers/loans.py` |
| Avisos ao solicitante | `backend/app/routers/notifications.py` |
| Situação do patrimônio | `backend/app/routers/equipment.py` |
| Termo (versão) | `backend/app/terms.py`, `frontend/src/constants/terms.ts` |

---

## Anexo — Entrega

Este texto cobre o que o Plano de Aprendizagem pede no PDF do projeto: problema, público, justificativa, tecnologias, objetivos, funcionalidades e regras de negócio (ver `docs/checklist-orientacoes-ucdb.txt`).

Para entregar: abrir no Word ou LibreOffice, colocar a **capa** (UCDB, curso, semestre, disciplinas, título, equipe, professor, cidade/ano), incluir **2 ou 3 prints** de `docs/screenshots/`, exportar em PDF e enviar no AVA.

**Referências**

- FastAPI — https://fastapi.tiangolo.com/
- React — https://react.dev/
- WCAG 2.2 (visão geral) — https://www.w3.org/WAI/standards-guidelines/wcag/

---

*Cenário NRDT fictício para o trabalho da DAC. Não é sistema oficial da UCDB.*
