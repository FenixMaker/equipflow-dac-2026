# Documento do projeto — DAC 2026

**Curso:** 262 — Tecnologia em Análise e Desenvolvimento de Sistemas  
**Semestre:** 05  
**Componentes:** Autonomia Intelectual do Estudante; Programação Back End I; Programação Front End I; Redes de Computadores Aplicada; Tópicos Especiais em Análise de Sistemas: Tecnologias  
**Professor referência:** Alexandre dos Santos Batista — RF 15881  
**Título do projeto:** Plataforma web para controle de empréstimo de equipamentos — protótipo **EquipFlow**

*Equipe: Alejandro Alexandre 197890. Campo Grande/MS — 2026.*

---

## 1. Problema e Público-Alvo

### 1.1 Contexto e problema organizacional

O cenário adotado é o **Núcleo de Recursos Didáticos em Tecnologia (NRDT)** de uma instituição de ensino fictícia, análogo a um polo de laboratórios de informática e eletrônica. O núcleo mantém **notebooks, projetores portáteis, multímetros e kits de prototipagem** compartilhados entre docentes e estudantes para aulas práticas, eventos e trabalhos de disciplina.

Na ausência de um sistema integrado, a gestão costuma depender de **planilhas descentralizadas, formulários em papel e mensagens informais** (e-mail, grupos de mensagem). Esse modelo gera dores operacionais concretas:

| Dor | Consequência para a organização |
|-----|--------------------------------|
| **Falta de rastreabilidade** | Não se sabe com segurança quem retirou cada item, nem quando a devolução era prevista. |
| **Conflito de uso** | Dois solicitantes podem disputar o mesmo equipamento por informação desatualizada. |
| **Perdas e extravios** | Itens permanecem “emprestados” sem registro formal, dificultando auditoria patrimonial. |
| **Comunicação falha** | A coordenação depende de contatos individuais para confirmar disponibilidade ou cobrar devolução. |
| **Retrabalho administrativo** | Horas gastas em conferências manuais, busca em planilhas e reconciliação de status. |
| **Barreira de acesso à informação** | Quem não tem contato direto com quem “controla a planilha” fica sem visibilidade do acervo disponível. |

O problema central é a **falta de um repositório único, acessível via navegador**, que centralize o cadastro de patrimônio, a situação de cada item e o **ciclo completo** de solicitação, aprovação, empréstimo e devolução — com histórico confiável para apoiar a gestão de recursos físicos.

Do ponto de vista de **gestão organizacional**, isso significa ineficiência no uso de ativos compartilhados, custo de tempo da equipe de coordenação e risco de **exclusão operacional**: docentes e estudantes autorizados que não conseguem consultar disponibilidade em tempo real deixam de utilizar recursos que poderiam apoiar o ensino.

### 1.2 Público-alvo

O **EquipFlow** atende dois perfis distintos, com permissões separadas por autenticação:

| Perfil | Quem representa | O que precisa do sistema |
|--------|-----------------|---------------------------|
| **Administrador de patrimônio** | Coordenação do NRDT / responsável pelo acervo | Cadastrar e editar equipamentos (código de patrimônio, descrição); alterar situação (`disponível`, `emprestado`, `manutenção`); **aprovar ou recusar** pedidos pendentes; acompanhar empréstimos ativos, histórico e recusados; tomar decisões com base em indicadores consolidados. |
| **Solicitante** | Docente ou estudante autorizado a retirar equipamentos | Consultar catálogo de itens **disponíveis**; visualizar ficha do equipamento; **solicitar empréstimo** com prazo de devolução e aceite de termo de responsabilidade; acompanhar pedidos (pendente, ativo, encerrado, recusado); **registrar devolução** quando for o tomador do empréstimo ativo. |

A separação de perfis (`admin` e `borrower`) reflete a realidade de equipes em laboratórios e núcleos de recursos: quem **governa o patrimônio** não executa as mesmas tarefas que quem **consome** o recurso, mas ambos precisam da mesma fonte de verdade sobre disponibilidade e prazos.

---

## 2. Justificativa Tecnológica

### 2.1 Por que uma plataforma web full stack

Uma **aplicação web** responde ao problema de forma sustentável porque:

- permite **acesso simultâneo multiusuário** a partir de diferentes dispositivos e laboratórios, sem instalação local em cada estação;
- concentra dados em um **único repositório relacional**, garantindo consistência e histórico auditável;
- facilita evolução para integrações futuras (notificações por e-mail, API institucional, relatórios gerenciais);
- alinha-se às competências das disciplinas do semestre (front end, back end, redes e integração de sistemas).

A tecnologia, neste projeto, não é fim em si: é o meio para **otimizar recursos compartilhados**, reduzir conflitos e promover **equidade operacional** — todos os perfis autorizados consultam a mesma informação de disponibilidade, sem depender de “quem sabe na planilha”.

### 2.2 Stack adotada

| Camada | Tecnologia | Papel na solução |
|--------|------------|------------------|
| **Front-end** | React 19, TypeScript, Vite 8 | Interface em componentes reutilizáveis; tipagem estática reduz erros de integração; Vite acelera desenvolvimento e build para demonstração e implantação estática do cliente. |
| **Estilo e UX** | CSS com variáveis e `data-theme` (tema claro/escuro) | Controle de contraste, foco visível, layout responsivo e suporte a `prefers-reduced-motion`, sem dependência pesada de bibliotecas de UI. |
| **Back-end** | Python 3.11–3.13, FastAPI, Uvicorn | API REST com validação Pydantic, documentação OpenAPI automática (`/docs`) e código adequado à disciplina de Programação Back End I. |
| **Persistência** | SQLAlchemy 2.x + SQLite (`equipflow.db`) | Modelagem relacional explícita (usuários, equipamentos, empréstimos); integridade referencial; adequado ao protótipo acadêmico. Em produção, **PostgreSQL** ou **MySQL** seriam substitutos naturais. |
| **Autenticação** | JWT (Bearer) + bcrypt (passlib) | Padrão de mercado para APIs REST; sessão stateless no servidor; papéis `admin` e `borrower` embutidos no token. |
| **Redes** | HTTP/1.1, JSON, CORS (desenvolvimento), HTTPS (produção recomendada) | Modelo **cliente-servidor**: navegador como cliente; API como servidor de aplicação; em implantação real, DNS e TLS garantem confidencialidade e integridade em trânsito (Redes de Computadores Aplicada). |

### 2.3 Comunicação entre front-end e back-end

A integração foi estruturada para **eficiência, clareza de contrato e manutenção**:

1. **Contrato REST em JSON** — O front-end consome endpoints agrupados em `auth`, `equipment` e `loans`, espelhados no módulo central `frontend/src/api.ts`. Cada requisição envia `Content-Type: application/json` e, quando autenticado, o cabeçalho `Authorization: Bearer <token>`.

2. **Cliente HTTP único** — A função `api<T>()` centraliza `fetch`, montagem da URL base, injeção do token (`localStorage`, chave `equipflow_token`), parsing de erros no formato FastAPI (`detail` como string ou lista) e mensagens em português para falhas de rede ou serviço indisponível.

3. **Ambientes de execução** — Em desenvolvimento, URLs relativas passam pelo **proxy do Vite**, que encaminha `/auth`, `/equipment`, `/loans` e `/health` para `http://127.0.0.1:8000`, simplificando testes no mesmo host e em dispositivos móveis na LAN. Em build de produção, a variável `VITE_API_URL` aponta para a API publicada.

4. **Segurança e papéis** — O back-end valida o JWT em rotas protegidas e aplica `require_admin` onde necessário (cadastro de patrimônio, aprovação de pedidos). O front-end redireciona a experiência conforme `user.role` após `GET /auth/me`.

5. **Regras de negócio no servidor** — Bloqueios (item em manutenção, empréstimo pendente/ativo no mesmo patrimônio, versão do termo `2026-05`) são enforced na API, não apenas na interface — garantindo consistência mesmo com múltiplos clientes.

Essa arquitetura **desacopla** apresentação e regra de negócio: a interface pode evoluir (novos painéis, relatórios) sem reescrever a API; a API pode atender outros clientes (aplicativo móvel, integração institucional) mantendo o mesmo contrato.

### 2.4 Sustentabilidade técnica

- **Documentação viva da API** via Swagger/OpenAPI reduz ambiguidade para manutenção e para o relatório acadêmico.
- **Modelo de dados relacional** (três entidades principais com FKs) suporta crescimento do acervo e histórico de empréstimos.
- **Caminho de evolução** identificado: migrar SQLite → PostgreSQL; extrair regras para camada de serviços; adicionar fila de notificações (e-mail) para atrasos; hospedar front-end estático (CDN ou servidor web) e API em origens distintas com CORS e HTTPS configurados.

---

## 3. Objetivos e Funcionalidades

### 3.1 Objetivo principal

**Oferecer um protótipo web funcional que centralize o ciclo de empréstimo e devolução de equipamentos didáticos**, com rastreabilidade de quem solicitou, qual item, prazo de devolução e aceite de termo de responsabilidade — priorizando **eficiência operacional**, **usabilidade** da interface, **acessibilidade digital** e **inclusão** de diferentes perfis organizacionais no mesmo fluxo de informação.

### 3.2 Mapa das cinco principais funcionalidades

| # | Funcionalidade | Descrição | Valor para a gestão |
|---|----------------|-----------|---------------------|
| **1** | **Autenticação e painéis por perfil** | Login com e-mail e senha; sessão JWT; painéis distintos para administrador e solicitante, com **indicadores (KPIs)**: disponíveis, pendentes, ativos, em atraso e histórico. Atualização manual e automática (~12 s) quando a aba está visível. | Visão imediata do estado do acervo e da fila de trabalho, sem planilhas paralelas. |
| **2** | **Gestão de patrimônio** | Administrador cadastra equipamentos (nome, código de patrimônio, descrição), edita registros, busca no acervo e altera situação (`disponível`, `emprestado`, `manutenção`), com bloqueios quando há empréstimo pendente ou ativo. | Inventário único e confiável; manutenção registrada impede empréstimo indevido. |
| **3** | **Catálogo e solicitação de empréstimo** | Solicitante consulta itens disponíveis, abre **ficha do equipamento** e usa assistente em **dois passos**: (1) prazo de devolução; (2) leitura e aceite do **termo de responsabilidade** (versão `2026-05`), com registro de data/versão no banco. | Pedido formal, padronizado e rastreável; reduz ambiguidade de “combinado por mensagem”. |
| **4** | **Pipeline de aprovação** | Pedido criado como `pendente`; administrador **aprova** (→ `ativo`, equipamento `emprestado`) ou **recusa** (→ `recusado`); tomador registra **devolução** (→ `finalizado`, equipamento `disponível`). | Controle institucional antes da saída do patrimônio; histórico de recusas e encerramentos. |
| **5** | **Rastreabilidade e alertas operacionais** | Listagens de empréstimos por estado; histórico para auditoria mínima; **destaque visual** de empréstimos com prazo vencido (contagem “Em atraso” e linhas alertadas nas tabelas). | Antecipação de cobrança e priorização da coordenação; base para relatórios futuros. |

**Fluxo operacional consolidado:**

```
Solicitação + termo → Pendente → Aprovação (admin) → Ativo → Devolução (tomador) → Finalizado
                              ↘ Recusado
```

### 3.3 Usabilidade, acessibilidade e inclusão

O protótipo incorpora práticas alinhadas à inclusão digital e à eficiência de uso:

- página em **português** (`lang="pt-BR"`);
- **skip links** (“Ir para o conteúdo”) na login e no painel;
- tabelas com **legendas para leitores de tela** (`sr-only`);
- regiões com **`aria-live`** para feedback de sincronização e erros;
- **tema claro/escuro** persistido, com contraste adequado;
- respeito a **`prefers-reduced-motion`** para usuários sensíveis a animação;
- rótulos explícitos em formulários e diálogos modais com `aria-modal` e foco visível (`:focus-visible`).

Esses recursos demonstram que a solução foi pensada não só para quem opera o sistema diariamente, mas para **diferentes necessidades de acesso** — requisito explícito do contexto DAC (eficiência, usabilidade, acessibilidade e inclusão).

### 3.4 Modelo de dados (resumo técnico)

- **Usuario:** id, e-mail, nome, senha (hash), papel (`admin` | `borrower`).
- **Equipamento:** id, nome, código de patrimônio (único), descrição opcional, status (`disponivel` | `emprestado` | `manutencao`).
- **Emprestimo:** id, equipamento_id, borrower_id, criado_em, devolucao_prevista_em, devolvido_em (opcional), status (`pendente` | `ativo` | `finalizado` | `recusado`), aceite do termo (data e versão).

---

## Anexo — Entrega e referências

**Checklist DAC (UCDB):** este documento atende aos itens exigidos para o PDF do projeto — problema, público-alvo, justificativa da solução e das tecnologias, objetivos e funcionalidades — conforme `docs/checklist-orientacoes-ucdb.txt` e Plano de Aprendizagem do semestre.

**Exportação para PDF:** abrir este arquivo no Word ou LibreOffice; aplicar **capa institucional** (UCDB, curso, semestre, componentes, título, equipe, professor referência, cidade/ano); inserir **2 a 3 capturas de tela** do sistema (`docs/screenshots/`); exportar como PDF e enviar conforme orientação do AVA.

**Referências:**

- FASTAPI. Documentação oficial. Disponível em: https://fastapi.tiangolo.com/
- REACT. Documentação oficial. Disponível em: https://react.dev/
- W3C. Web Content Accessibility Guidelines (WCAG) 2.2 — visão geral. Disponível em: https://www.w3.org/WAI/standards-guidelines/wcag/

---

*Protótipo acadêmico — cenário NRDT fictício. Não substitui sistemas oficiais da instituição.*
