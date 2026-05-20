# Documento do projeto — DAC 2026

**Curso:** 262 — Tecnologia em Análise e Desenvolvimento de Sistemas  
**Semestre:** 05  
**Componentes:** Autonomia Intelectual do Estudante; Programação Back End I; Programação Front End I; Redes de Computadores Aplicada; Tópicos Especiais em Análise de Sistemas: Tecnologias  
**Professor referência:** Alexandre dos Santos Batista — RF 15881  
**Título do projeto:** Plataforma web para controle de empréstimo de equipamentos — protótipo **EquipFlow**

*Equipe: [Nomes completos e RAs]. Cidade/UF — 2026.*

---

## 1. Problema identificado

O cenário adotado é o **Núcleo de Recursos Didáticos em Tecnologia (NRDT)** de uma instituição de ensino fictícia análoga a um polo de laboratórios de informática e eletrônica. O núcleo mantém **notebooks, projetores portáteis, multímetros e kits de prototipagem** compartilhados entre docentes e estudantes para aulas práticas, eventos e trabalhos de disciplinas.

Atualmente, a gestão ocorre por **planilhas descentralizadas, formulários em papel e mensagens informais**. Isso gera:

- conflito de uso (dois solicitantes para o mesmo item);
- dificuldade de **rastrear quem retirou o equipamento e quando deveria devolver**;
- atrasos na devolução sem registro histórico confiável;
- perda de tempo da coordenação em conferências manuais;
- risco de **exclusão operacional** de quem depende do recurso e não consegue visibilidade de disponibilidade.

O problema central é a **falta de um sistema único, acessível via navegador**, que centralize cadastro de patrimônio, status do item e ciclo de empréstimo e devolução.

---

## 2. Público-alvo

| Perfil | Necessidades |
|--------|----------------|
| **Administrador de patrimônio** (coordenação do laboratório) | Cadastrar e atualizar equipamentos; alterar status (disponível, em manutenção); visualizar todos os empréstimos ativos e histórico; apoiar decisões com dados. |
| **Solicitante** (docente ou estudante autorizado) | Consultar equipamentos **disponíveis**; registrar empréstimo com data prevista de devolução; registrar devolução; acompanhar “meus empréstimos”. |

O protótipo pressupõe **autenticação** para separar permissões (administrador x solicitante), alinhado ao requisito de inclusão de **diferentes perfis** no âmbito organizacional.

---

## 3. Justificativa da solução (plataforma web)

Uma **aplicação web** permite:

- **acesso multiusuário** simultâneo a partir de diferentes dispositivos e laboratórios, sem instalação local;
- **histórico e consistência** dos dados em um único repositório (banco relacional);
- evolução futura para integrações (por exemplo, notificações por e-mail ou API institucional);
- aderência às práticas de **desenvolvimento full stack** trabalhadas nas disciplinas do semestre.

A solução contribui para **otimização de recursos** (menos ociosidade e menos conflito) e para **equidade operacional**: qualquer perfil autorizado consulta as mesmas informações de disponibilidade, reduzindo dependência de “quem sabe na planilha”.

---

## 4. Justificativa das tecnologias

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Front end** | React 19, TypeScript, Vite | Ecossistema maduro, componentização, tipagem que reduz erros; Vite agiliza desenvolvimento e build. |
| **Estilo** | CSS modular no próprio projeto | Controle fino de contraste, foco visível e layout responsivo sem dependência pesada; atende critérios básicos de acessibilidade. |
| **Back end** | Python 3, FastAPI | API REST assíncrona, documentação automática (OpenAPI), adequada à disciplina de Back End e à clareza do código. |
| **ORM / persistência** | SQLAlchemy 2.x | Modelagem relacional explícita; migrações simples no protótipo. |
| **Banco de dados** | SQLite (arquivo `.db`) | Adequado a protótipo e demonstração em banca; modelo relacional com integridade referencial. Em produção, PostgreSQL ou MySQL seriam candidatos naturais. |
| **Autenticação** | JWT (Bearer) + hash de senha (bcrypt via passlib) | Padrão em APIs REST; separação stateless entre cliente e servidor no protótipo. |
| **Comunicação front ↔ back** | HTTP/1.1, JSON, CORS habilitado em desenvolvimento | Padrão da indústria; o front consome endpoints REST; erros retornados em JSON. |
| **Redes (conceituação)** | Modelo **cliente-servidor**: navegador como cliente; API no servidor; resolução de host via DNS em implantação real; uso de **HTTPS** recomendado em produção para confidencialidade e integridade em trânsito. | Articulação com **Redes de Computadores Aplicada**: camadas de aplicação (HTTP), segurança em trânsito, possibilidade de hospedar API e front em mesmo host ou em origens distintas (CORS). |

---

## 5. Objetivos do sistema

**Geral:** Oferecer protótipo funcional que apoie a gestão de empréstimos de equipamentos, com usabilidade clara e preocupação com acessibilidade digital.

**Específicos:**

1. Permitir cadastro e manutenção de equipamentos com código de patrimônio e status.
2. Permitir que solicitantes registrem empréstimo apenas quando o item estiver **disponível**.
3. Registrar data prevista de devolução e permitir **baixa da devolução**, liberando o equipamento.
4. Disponibilizar visão consolidada para o administrador (empréstimos ativos).
5. Garantir **controle de acesso** por perfil (administrador x solicitante).

---

## 6. Principais funcionalidades (escopo do protótipo)

1. Login e sessão via token JWT.  
2. **Administrador:** CRUD de equipamentos; alteração de status (disponível, emprestado, manutenção); listagem de empréstimos ativos.  
3. **Solicitante:** listar equipamentos disponíveis; criar empréstimo com data de devolução prevista; listar “meus empréstimos”; registrar devolução.  
4. Regras: não emprestar item em manutenção ou já emprestado; devolução apenas pelo tomador do empréstimo ativo (protótipo).  
5. Interface responsiva com formulários com **rótulos associados**, mensagens de erro legíveis e foco visível (acessibilidade básica).

---

## 7. Usabilidade, acessibilidade e inclusão

- **Linguagem clara** nos rótulos (“Código de patrimônio”, “Devolver até”, “Registrar devolução”).  
- **Contraste** entre texto e fundo na interface padrão do protótipo.  
- **Áreas de clique** adequadas em botões principais.  
- **Feedback** após ações (sucesso ou erro da API).  
- Estruturação com cabeçalhos e landmarks onde aplicável no React.

*(Para o PDF final, incluir 2–3 capturas de tela do sistema em funcionamento.)*

---

## 8. Modelo de dados (resumo)

- **Usuario:** id, e-mail, nome, hash de senha, papel (`admin` | `borrower`).  
- **Equipamento:** id, nome, código de patrimônio, descrição opcional, status (`disponivel` | `emprestado` | `manutencao`).  
- **Emprestimo:** id, equipamento_id, usuario_id, criado_em, devolucao_prevista_em, devolvido_em (nulo se ativo), status (`ativo` | `finalizado`).

---

## 9. Cronograma (alinhado ao Plano de Aprendizagem)

| Etapa | Ação |
|-------|------|
| 1 | Entrega do documento do projeto (este conteúdo em PDF) + repositório com código. |
| 2 | Apresentação à banca: slides + demonstração ao vivo (fluxo de empréstimo e devolução + caso de item em manutenção). |

---

## 10. Referências (exemplos — ajustar formato ABNT se exigido)

- FastAPI. Documentação oficial. Disponível em: https://fastapi.tiangolo.com/  
- React. Documentação oficial. Disponível em: https://react.dev/  
- W3C. Web Content Accessibility Guidelines (WCAG) 2.2 — visão geral. Disponível em: https://www.w3.org/WAI/standards-guidelines/wcag/

---

*Gerar PDF: abrir este arquivo no Word ou LibreOffice, aplicar capa institucional conforme `checklist-orientacoes-ucdb.txt` e orientações do AVA, depois exportar como PDF.*
