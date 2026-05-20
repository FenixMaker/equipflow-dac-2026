# Roteiro de apresentação — Banca DAC 2026 (EquipFlow)

**Sugestão:** 8–12 slides + demonstração ao vivo (5–8 minutos de demo). Ajustar ao tempo da banca.

---

## Slide 1 — Capa

- Título: **EquipFlow — plataforma web para controle de empréstimo de equipamentos**
- Curso, semestre, componentes do DAC, equipe, Professor Referência
- UCDB — 2026

---

## Slide 2 — Contexto e problema

- Organização fictícia: **NRDT** (recursos didáticos compartilhados)
- Dores: planilhas descentralizadas, conflito de uso, falta de rastreio de devolução, perda de tempo da coordenação
- Impacto: produtividade e equidade no acesso aos recursos

---

## Slide 3 — Público-alvo

- **Administrador de patrimônio:** cadastro, status, visão de empréstimos ativos
- **Solicitante (docente/estudante):** consultar disponíveis, emprestar, devolver
- Diferentes perfis com **autenticação** e permissões distintas

---

## Slide 4 — Proposta de solução (uma frase)

- Plataforma **web** centralizada para cadastro de equipamentos, status e ciclo completo de empréstimo/devolução
- Foco em **usabilidade** e **acessibilidade digital** (rótulos, contraste, foco visível, tamanho mínimo de alvos)

---

## Slide 5 — Arquitetura técnica

- Diagrama simples: **Navegador (React)** → **HTTP/JSON** → **API (FastAPI)** → **SQLite**
- Mencionar **redes:** modelo cliente-servidor, HTTP, CORS em desenvolvimento, HTTPS em produção

---

## Slide 6 — Principais funcionalidades (MVP)

- Login com perfis admin / solicitante
- CRUD de equipamentos (admin) e alteração de status (disponível, emprestado, manutenção)
- Empréstimo com data prevista de devolução; devolução pelo tomador
- Listagens: disponíveis, meus empréstimos, empréstimos ativos (admin)
- Regras: não emprestar em manutenção; bloqueios ao mudar status com empréstimo ativo

---

## Slide 7 — Benefícios para a organização

- **Rastreabilidade** (quem, o quê, quando devolver)
- **Menos conflito** de uso e menos retrabalho administrativo
- Base para **relatórios** e evoluções futuras (notificações, integração institucional)

---

## Slide 8 — Limitações e trabalhos futuros

- Protótipo acadêmico; senhas e JWT com chave de desenvolvimento
- Migrar banco para PostgreSQL em produção; testes automatizados; políticas de aprovação em duas etapas

---

## Slide 9 — Encerramento / Contato

- Repositório / demonstração
- Perguntas

---

## Slide 10 — Demonstração ao vivo

- **Login** como solicitante — mostrar lista de **disponíveis** e item em **manutenção** (não aparece em disponíveis)
- Registrar **empréstimo** com data de devolução; mostrar em **meus empréstimos**
- Logout e login como **admin** — mostrar o mesmo equipamento como **emprestado** na lista geral e em **empréstimos ativos** (tomador visível)
- Logout, login solicitante — **registrar devolução**; confirmar que o item volta a **disponível**
- (Opcional) Admin tenta colocar em **manutenção** com empréstimo ativo — mensagem de erro (se aplicável no fluxo)
