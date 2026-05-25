<div align="center">

<img src="frontend/public/brand/logo-com-nome.png" alt="EquipFlow" width="420" />

<br />

**Controle de empréstimo de equipamentos didáticos** · cenário fictício **NRDT** · DAC 2026 (TADS UCDB)

<br />

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)

<br />

[Tour da interface](#tour-pela-interface) ·
[Galeria](#galeria-completa) ·
[Como executar](#como-executar) ·
[Contas demo](#contas-de-demonstração) ·
[Documentação DAC](#documentação-dac) ·
[API](#api)

</div>

---

## Sobre o projeto

O **EquipFlow** é um protótipo web full stack para o fluxo de **empréstimo e devolução de equipamentos** do Núcleo de Recursos Didáticos em Tecnologia (**NRDT**). Foi desenvolvido no âmbito do **Plano de Aprendizagem (DAC)** do curso de **TADS** na **UCDB**.

> Aplicação acadêmica com dados fictícios. Não substitui sistemas oficiais da instituição.

### Funcionalidades

| Perfil | O que pode fazer |
|--------|------------------|
| **Administrador** | Cadastrar e editar patrimônio · alterar situação (disponível / emprestado / manutenção) · aprovar ou recusar pedidos · acompanhar empréstimos ativos e histórico |
| **Solicitante** | Consultar catálogo disponível · ver ficha do equipamento · solicitar empréstimo (retirada + devolução, mín. 3 dias + termo) · registrar devolução · acompanhar pedidos |

### Fluxo resumido

```
Solicitação (com termo) → Aprovação do admin → Empréstimo ativo → Devolução registrada
```

---

## Tour pela interface

Cada captura abaixo mostra uma parte do protótipo e o que ela representa no fluxo do NRDT.

---

### 1. Login — tema claro

<img src="docs/screenshots/01-login-claro.png?v=20260525-2154" alt="Tela de login do EquipFlow no tema claro, com carrossel de perfis de demonstração" width="100%"/>

Ponto de entrada do sistema. À esquerda, logotipo e **QR code** para abrir no celular na mesma rede (IP LAN configurável). À direita, o **carrossel de perfis** com ícone azul (administrador + escudo) ou ciano (solicitante), rótulos **Administrador** / **Solicitante** e botão **Entrar como Conta Selecionada**; abaixo, formulário de e-mail e senha. Alternância **tema claro/escuro** no canto superior.

---

### 2. Login — tema escuro

<img src="docs/screenshots/02-login-escuro.png?v=20260525-2154" alt="Tela de login do EquipFlow no tema escuro" width="100%"/>

Mesma tela com paleta escura no painel de entrada (preferência salva no navegador). O carrossel e o QR mantêm o mesmo fluxo de demonstração.

---

### 3. Painel do administrador

<img src="docs/screenshots/03-admin-painel.png?v=20260525-2154" alt="Painel do administrador com KPIs, filas de pedidos e acervo" width="100%"/>

Visão da **coordenação do NRDT**: cabeçalho com badge *Administração*, resumo do acervo e botão **Atualizar dados**; faixa de **KPIs** (itens, disponíveis, pendentes, ativos, em atraso com multa R$ 15/dia); filas **Solicitações pendentes** e **Empréstimos ativos** empilhadas; barras de **distribuição do acervo**; cadastro e tabela de patrimônio com busca.

---

### 4. Editar equipamento

<img src="docs/screenshots/04-admin-editar-equipamento.png?v=20260525-2154" alt="Editar equipamento" width="100%"/>

Modal aberto a partir da coluna **Editar** na tabela de patrimônio. Permite corrigir nome, código de patrimônio e observações sem apagar o histórico de empréstimos vinculado ao item.

---

### 5. Filas de pedidos (admin)

<img src="docs/screenshots/05-admin-emprestimos-ativos.png?v=20260525-2154" alt="Filas de solicitações pendentes e empréstimos ativos no painel admin" width="100%"/>

Detalhe das duas filas em coluna: **aprovar/recusar** pedidos novos (retirada e devolução previstas) e acompanhar **empréstimos ativos** com atraso, multa acumulada, status **Bloqueado** e ação **Notificar** o tomador.

---

### 6. Painel do solicitante

<img src="docs/screenshots/06-solicitante-painel.png?v=20260525-2154" alt="Painel do solicitante com KPIs e catálogo em cards" width="100%"/>

Área do **solicitante** (docente ou aluno): badge *Solicitante*, KPIs (disponíveis, aguardando aprovação, ativos, em atraso) e **catálogo em cards** com patrimônio, resumo e botões **Ver ficha** / **Solicitar empréstimo**. Aviso de atraso e notificações do NRDT aparecem no topo quando aplicável.

---

### 7. Ficha do patrimônio

<img src="docs/screenshots/07-solicitante-ficha-equipamento.png?v=20260525-2154" alt="Ficha do equipamento" width="100%"/>

Detalhamento de um item antes do pedido: código de patrimônio, descrição, situação no catálogo e aviso de que, em produção, poderia incluir fotos e manual. Abre pelo botão **Ver ficha** no catálogo.

---

### 8. Pedido de empréstimo — passo 1 (prazo)

<img src="docs/screenshots/08-solicitante-pedido-emprestimo-passo1.png?v=20260525-2154" alt="Pedido passo 1" width="100%"/>

Assistente em duas etapas. No **passo 1**, o solicitante define a **data de retirada** e a **data de devolução** (mínimo de 3 dias entre elas; não pode ser no mesmo dia). O pedido só segue após validação na interface e na API; em seguida permanece **pendente** até o administrador aprovar. A **retirada efetiva** só é registrada na aprovação.

---

### 9. Pedido de empréstimo — passo 2 (termo)

<img src="docs/screenshots/09-solicitante-pedido-emprestimo-passo2-termo.png?v=20260525-2154" alt="Pedido passo 2 termo" width="100%"/>

**Passo 2:** resumo do equipamento com **retirada e devolução previstas**, leitura do **termo de responsabilidade** (versão registrada) e checkbox de aceite. Só então o botão **Enviar pedido** é habilitado — garantindo rastreabilidade do aceite no protótipo.

---

### 10. Documentação da API (Swagger)

<img src="docs/screenshots/10-api-swagger.png?v=20260525-2154" alt="Swagger UI" width="100%"/>

Interface automática do **FastAPI** em `/docs`. Lista rotas de autenticação, equipamentos e empréstimos, com esquemas JSON — útil para alinhar o relatório DAC e demonstrar a camada REST por trás do React.

---

## Galeria completa

Todas as capturas do protótipo, em ordem, para consulta rápida ou uso em slides.

<table>
  <tr>
    <td align="center" width="33%">
      <a href="docs/screenshots/01-login-claro.png?v=20260525-2154"><img src="docs/screenshots/01-login-claro.png?v=20260525-2154" alt="01" width="100%"/></a><br/>
      <sub><b>01</b> · Login claro</sub>
    </td>
    <td align="center" width="33%">
      <a href="docs/screenshots/02-login-escuro.png?v=20260525-2154"><img src="docs/screenshots/02-login-escuro.png?v=20260525-2154" alt="02" width="100%"/></a><br/>
      <sub><b>02</b> · Login escuro</sub>
    </td>
    <td align="center" width="33%">
      <a href="docs/screenshots/03-admin-painel.png?v=20260525-2154"><img src="docs/screenshots/03-admin-painel.png?v=20260525-2154" alt="03" width="100%"/></a><br/>
      <sub><b>03</b> · Admin · painel</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="docs/screenshots/04-admin-editar-equipamento.png?v=20260525-2154"><img src="docs/screenshots/04-admin-editar-equipamento.png?v=20260525-2154" alt="04" width="100%"/></a><br/>
      <sub><b>04</b> · Admin · editar</sub>
    </td>
    <td align="center">
      <a href="docs/screenshots/05-admin-emprestimos-ativos.png?v=20260525-2154"><img src="docs/screenshots/05-admin-emprestimos-ativos.png?v=20260525-2154" alt="05" width="100%"/></a><br/>
      <sub><b>05</b> · Admin · filas</sub>
    </td>
    <td align="center">
      <a href="docs/screenshots/06-solicitante-painel.png?v=20260525-2154"><img src="docs/screenshots/06-solicitante-painel.png?v=20260525-2154" alt="06" width="100%"/></a><br/>
      <sub><b>06</b> · Solicitante · painel</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="docs/screenshots/07-solicitante-ficha-equipamento.png?v=20260525-2154"><img src="docs/screenshots/07-solicitante-ficha-equipamento.png?v=20260525-2154" alt="07" width="100%"/></a><br/>
      <sub><b>07</b> · Solicitante · ficha</sub>
    </td>
    <td align="center">
      <a href="docs/screenshots/08-solicitante-pedido-emprestimo-passo1.png?v=20260525-2154"><img src="docs/screenshots/08-solicitante-pedido-emprestimo-passo1.png?v=20260525-2154" alt="08" width="100%"/></a><br/>
      <sub><b>08</b> · Pedido · passo 1</sub>
    </td>
    <td align="center">
      <a href="docs/screenshots/09-solicitante-pedido-emprestimo-passo2-termo.png?v=20260525-2154"><img src="docs/screenshots/09-solicitante-pedido-emprestimo-passo2-termo.png?v=20260525-2154" alt="09" width="100%"/></a><br/>
      <sub><b>09</b> · Pedido · passo 2</sub>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="3">
      <a href="docs/screenshots/10-api-swagger.png?v=20260525-2154"><img src="docs/screenshots/10-api-swagger.png?v=20260525-2154" alt="10" width="48%"/></a><br/>
      <sub><b>10</b> · API Swagger</sub>
    </td>
  </tr>
</table>

> Clique em qualquer imagem para abrir em tamanho original. Arquivos em [`docs/screenshots/`](docs/screenshots/).

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **Front end** | React 19 · TypeScript · Vite · Tailwind CSS · componentes UI reutilizáveis |
| **Back end** | Python · FastAPI · SQLAlchemy |
| **Dados** | SQLite |
| **Auth** | JWT · bcrypt |

---

## Como executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (LTS)
- [Python 3.11, 3.12 ou 3.13](https://www.python.org/downloads/) no PATH (recomendado: **3.12**)

> **Windows:** evite Python **3.14** para o backend. Ainda não há pacotes pré-compilados (ex.: `pydantic-core`); o `pip` tentaria compilar com Rust e exigiria *Visual C++ Build Tools*. O `iniciar-equipflow.bat` prioriza `py -3.12` / `-3.11` / `-3.13` e recria `backend\.venv` se detectar versão incompatível.

### Opção 1 — Atalho Windows (recomendado)

Duplo clique em **`iniciar-equipflow.bat`** na raiz do projeto.

O script escolhe Python 3.11–3.13, cria o `backend\.venv` (ou recria se estiver em 3.14+), instala dependências **somente na primeira vez** (ou se faltar pasta), copia `frontend\.env` se necessário e executa API + Vite.

### Levar para outro PC (recomendado — sem instalar nada lá)

1. **Neste PC:** duplo clique em **`preparar-portatil.bat`** (internet **uma vez**). Gera `runtime\node`, `runtime\python` e instala dependências.
2. Copie a **pasta inteira** do projeto (ZIP ou pendrive), com `runtime\`, `node_modules\` e `frontend\node_modules\`.
3. **No outro PC:** duplo clique em **`iniciar-equipflow.bat`** — não precisa instalar Node nem Python.

> Copiar só o `backend\.venv` **não** funciona em outro Windows (caminhos fixos). Use o modo portátil acima.

### Opção 2 — Um comando na raiz

```powershell
git clone https://github.com/FenixMaker/equipflow-dac-2026.git
cd equipflow-dac-2026
npm install
npm run dev
```

| Serviço | URL local |
|---------|-----------|
| Interface web | http://127.0.0.1:5173 |
| API REST | http://127.0.0.1:8000 |
| Swagger (docs) | http://127.0.0.1:8000/docs |

Na primeira execução da API, o banco `backend/data/equipflow.db` é criado automaticamente com **dados de demonstração**.

<details>
<summary><b>Execução manual</b> (API e front em terminais separados)</summary>

<br/>

**API**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Front end**

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

</details>

<details>
<summary><b>Testar no celular</b> (mesma rede — Wi‑Fi ou cabo)</summary>

<br/>

1. Suba o projeto com `npm run dev` (API em `0.0.0.0:8000`, Vite em `0.0.0.0:5173`). O `iniciar-equipflow.bat` lista os IPs LAN no terminal após a API subir.
2. Na tela de login, o **QR code** usa o IP LAN do PC. Se abrir por `localhost`, o sistema detecta o IP automaticamente via `/health`.
3. Com mais de uma placa de rede, escolha o IP no seletor abaixo do QR. **Celular no Wi‑Fi:** prefira o IP **Wi‑Fi** do notebook (é o padrão quando o Wi‑Fi está ligado).
4. O proxy do Vite encaminha `/auth`, `/equipment`, `/loans` e `/health` para a API no PC.
5. **Notebook só no cabo e celular no Wi‑Fi:** o roteador precisa fazer ponte entre cabo e Wi‑Fi (comum em casa; em rede institucional ou Wi‑Fi convidado, muitas vezes não funciona). Se o celular não abrir, **ligue o Wi‑Fi do notebook** na mesma rede do celular (pode manter o cabo) e use o IP Wi‑Fi no QR.
6. Se o celular mostrar “não foi possível acessar”, teste o link abaixo do QR no próprio PC (`http://IP:5173`). Se no PC funcionar e no celular não, troque para o IP Wi‑Fi ou ligue o Wi‑Fi do notebook conforme o aviso na tela de login.

Em **build de produção** (`npm run build`), configure `VITE_API_URL` com a URL pública da API.

</details>

---

## Contas de demonstração

| Perfil | E-mail | Senha |
|:------:|--------|-------|
| Administrador | `admin@labnrdt.edu.br` | `Admin@123` |
| Solicitante | `usuario@labnrdt.edu.br` | `Usuario@123` |

Na tela de login, selecione um perfil no **carrossel** e use **Entrar como Conta Selecionada**, ou preencha e-mail e senha manualmente.

---

## API

Endpoints principais (autenticação via Bearer JWT):

| Grupo | Rotas |
|-------|-------|
| `auth` | `POST /auth/login` · `GET /auth/me` |
| `equipment` | `GET/POST /equipment` · `PATCH /equipment/{id}` |
| `loans` | `POST /loans` (`pickup_at`, `due_at`) · `GET /loans/me` · aprovar / recusar / devolver |
| `health` | `GET /health` |

Documentação interativa: **http://127.0.0.1:8000/docs**

---

## Configuração

**Front end** — copie `frontend/.env.example` para `frontend/.env` (feito automaticamente pelo `npm run dev`).

**API** (opcional) — copie `backend/.env.example` para `backend/.env`:

```env
SECRET_KEY=sua-chave-secreta-longa
DATABASE_URL=sqlite:///./data/equipflow.db
```

**Recriar dados de demo:** apague `backend/data/equipflow.db` e suba a API novamente (necessário após alterações no modelo de empréstimos).

**Atualizar capturas do README:** `npm run screenshots` (sobe API + Vite, gera 01–10 e encerra). Com servidores já no ar: `node scripts/capture-screenshots.mjs`. Só o fluxo de pedido: `npm run screenshots:loan` (requer `npm run dev` ativo).

---

## Documentação DAC

| Arquivo | Descrição |
|---------|-----------|
| [documento-projeto-dac.md](docs/documento-projeto-dac.md) | Texto-base para o PDF do projeto |
| [checklist-orientacoes-ucdb.txt](docs/checklist-orientacoes-ucdb.txt) | Checklist do documento orientador |
| [screenshots/](docs/screenshots/) | Capturas de tela do protótipo |

---

## Estrutura do repositório

```
equipflow-dac-2026/
├── backend/app/              # API REST (FastAPI)
├── frontend/src/             # Interface React
├── frontend/public/brand/    # Logotipos
├── docs/                     # Documentação DAC + screenshots/
├── scripts/                  # Utilitários (env, backend, portátil)
├── iniciar-equipflow.bat     # Inicia o projeto
├── preparar-portatil.bat     # Gera runtime\ (uma vez, para outros PCs)
└── package.json              # Orquestra API + Vite
```

---

<div align="center">

**EquipFlow** · DAC 2026 · TADS · UCDB

*NRDT fictício — trabalho DAC 2026*

</div>
