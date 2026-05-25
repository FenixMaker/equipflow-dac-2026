import { FINE_PER_DAY_BRL } from './overdue'
import { LOAN_TERMS_PARAGRAPHS, LOAN_TERMS_VERSION } from './terms'
import { MIN_LOAN_DAYS } from '../utils/date'

export type BusinessRulesSection = {
  title: string
  items: string[]
}

/** Regras comuns ao NRDT (contexto da “empresa” / laboratório). */
const NRDT_CONTEXT: BusinessRulesSection[] = [
  {
    title: 'NRDT · EquipFlow',
    items: [
      'O EquipFlow é o sistema web do Núcleo de Recursos Didáticos em Tecnologia (NRDT) para controlar empréstimo de equipamentos didáticos (notebooks, projetores, kits, etc.).',
      'Substitui planilha e mensagens avulsas: um único lugar com património, pedidos, prazos, termo aceite e histórico.',
      'Dois perfis: Administrador (coordenação do NRDT) e Solicitante (docente ou aluno autorizado). Cada um vê apenas o que o perfil permite.',
      'Os dados ficam na API local (SQLite neste protótipo); as regras abaixo são validadas no servidor — a tela só ajuda, não substitui a API.',
    ],
  },
  {
    title: 'Estados do empréstimo',
    items: [
      'Pendente: pedido enviado; o equipamento ainda não saiu de fato; aguarda aprovação ou recusa do administrador.',
      'Ativo: administrador aprovou; retirada efetiva registada; equipamento emprestado ao tomador.',
      'Recusado: administrador negou; o item pode ser pedido por outra pessoa (se continuar disponível no acervo).',
      'Finalizado: tomador registou a devolução; equipamento volta a disponível no acervo.',
      'No pedido o solicitante informa retirada e devolução previstas; na aprovação grava-se a retirada efetiva; na devolução, a data real.',
    ],
  },
  {
    title: 'Situação do equipamento no acervo',
    items: [
      'Disponível: pode receber novo pedido, desde que não exista outro pedido pendente ou empréstimo ativo no mesmo património.',
      'Emprestado: vinculado a um empréstimo ativo aprovado.',
      'Manutenção: não aparece para novo pedido; use quando o item está em reparo ou indisponível.',
      'O administrador não pode forçar “disponível” ou “manutenção” enquanto houver pedido pendente ou empréstimo aberto naquele património.',
    ],
  },
  {
    title: 'Datas e prazo mínimo',
    items: [
      'A data de retirada não pode ser anterior a hoje.',
      'A devolução deve ser posterior à retirada (não no mesmo dia).',
      `Entre retirada e devolução é obrigatório um intervalo mínimo de ${MIN_LOAN_DAYS} dias de calendário.`,
      'É possível devolver antes do prazo combinado; não há trava de “só no dia X”.',
      'Pedido pendente não expira automaticamente se a data de retirada já passou — o administrador decide aprovar ou recusar.',
    ],
  },
  {
    title: 'Termo de responsabilidade',
    items: [
      `O pedido só é criado com aceite explícito do termo na versão ${LOAN_TERMS_VERSION} (data e versão ficam gravadas no empréstimo).`,
      LOAN_TERMS_PARAGRAPHS[0],
      LOAN_TERMS_PARAGRAPHS[1],
      LOAN_TERMS_PARAGRAPHS[2],
      'Se a versão do termo na tela estiver desatualizada, o sistema pede para recarregar a página antes de enviar.',
    ],
  },
  {
    title: 'Atraso, multa e bloqueio',
    items: [
      'Considera-se atraso quando o empréstimo está ativo e a data de devolução prevista já passou.',
      `Multa de R$ ${FINE_PER_DAY_BRL},00 por dia de calendário de atraso (ex.: 3 dias → R$ ${FINE_PER_DAY_BRL * 3},00).`,
      'Enquanto houver atraso: equipamento tratado como bloqueado; o tomador não pode abrir novo pedido até registar a devolução.',
      'O administrador pode enviar notificação in-app ao tomador (alerta no painel, com multa e bloqueio; pode marcar como lida).',
      'A devolução continua possível pelo botão Devolver; ao finalizar, a multa deixa de aumentar e o bloqueio é removido.',
      'O sistema não envia e-mail automático nem debita conta — cobrança e medidas disciplinares ficam com a coordenação do NRDT.',
    ],
  },
  {
    title: 'Casos que o sistema trata',
    items: [
      'Dois pedidos no mesmo equipamento: o primeiro pendente ou ativo bloqueia; o segundo recebe erro da API.',
      'Só o tomador do empréstimo pode registar a devolução — o administrador não devolve em nome do aluno.',
      'Um equipamento só pode ter um fluxo de empréstimo aberto de cada vez (pendente ou ativo).',
    ],
  },
]

const ADMIN_SPECIFIC: BusinessRulesSection[] = [
  {
    title: 'Papel do administrador (coordenação NRDT)',
    items: [
      'Cadastrar e editar equipamentos (nome, código de património único, descrição, situação).',
      'Aprovar ou recusar solicitações pendentes; conferir tomador, datas e aceite do termo antes de aprovar.',
      'Acompanhar empréstimos ativos, histórico, recusados e itens em atraso.',
      'Alterar situação do património manualmente (com confirmação), respeitando as travas de pedido/empréstimo aberto.',
      'Notificar tomador em atraso; marcar manutenção após reparo real para liberar novos pedidos.',
    ],
  },
  {
    title: 'Aprovação e recusa na prática',
    items: [
      'Ao aprovar: confirme disponibilidade física; o equipamento passa a emprestado e regista-se a retirada efetiva.',
      'Ao recusar: o equipamento permanece disponível para outros (salvo outra situação no acervo).',
      'Priorize a fila de pendentes antes de alterar património à mão, para não conflitar com pedidos em análise.',
    ],
  },
  {
    title: 'Operação sugerida no painel',
    items: [
      '1) Decidir solicitações pendentes. 2) Rever empréstimos ativos em atraso (multa, bloqueio, notificar).',
      '3) Após manutenção real, voltar o item a disponível. 4) Consultar recusados se houver pedidos duplicados ou datas inviáveis.',
    ],
  },
]

const BORROWER_SPECIFIC: BusinessRulesSection[] = [
  {
    title: 'Papel do solicitante (docente ou aluno)',
    items: [
      'Consultar apenas equipamentos disponíveis para novo pedido (sem pendente ou ativo na frente).',
      'Abrir a ficha completa antes de pedir; solicitar empréstimo pelo assistente em 2 passos (datas, depois termo).',
      'Acompanhar pedidos pendentes, empréstimos ativos e histórico (encerrados ou recusados).',
      'Registar a devolução no prazo; em atraso, regularizar antes de pedir outro item.',
    ],
  },
  {
    title: 'Como fazer um pedido',
    items: [
      'Passo 1: escolher data de retirada e devolução (mínimo 3 dias entre elas; retirada não pode ser no passado).',
      `Passo 2: ler e aceitar o termo de responsabilidade (versão ${LOAN_TERMS_VERSION}).`,
      'Após enviar: status pendente até o NRDT aprovar ou recusar; a retirada efetiva só é registada na aprovação.',
      'Com empréstimo em atraso na sua conta: novos pedidos ficam suspensos até devolver o item em atraso.',
    ],
  },
  {
    title: 'Leitura do seu painel',
    items: [
      'Catálogo: só itens livres para pedido. Aguardando aprovação: pedidos enviados. Ativos: em uso com botão Devolver.',
      'Linhas em vermelho = atraso face ao prazo. Notificações do NRDT aparecem quando a coordenação envia alerta.',
      'A página atualiza automaticamente a cada ~12 s; use Atualizar para forçar uma nova leitura.',
    ],
  },
]

export const ADMIN_BUSINESS_RULES: BusinessRulesSection[] = [
  ...NRDT_CONTEXT,
  ...ADMIN_SPECIFIC,
]

export const BORROWER_BUSINESS_RULES: BusinessRulesSection[] = [
  ...NRDT_CONTEXT,
  ...BORROWER_SPECIFIC,
]
