export type DemoRole = 'admin' | 'borrower'

export type DemoAccount = {
  id: string
  role: DemoRole
  label: string
  subtitle: string
  email: string
  password: string
}

export const ADMIN_DEMO_PASSWORD = 'Admin@123'
export const BORROWER_DEMO_PASSWORD = 'Usuario@123'

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'admin',
    role: 'admin',
    label: 'Coordenação NRDT',
    subtitle: 'Administração de acervo',
    email: 'admin@labnrdt.edu.br',
    password: ADMIN_DEMO_PASSWORD,
  },
  {
    id: 'docente',
    role: 'borrower',
    label: 'Docente Silva',
    subtitle: 'Professora · Engenharia',
    email: 'usuario@labnrdt.edu.br',
    password: BORROWER_DEMO_PASSWORD,
  },
  {
    id: 'prof-rocha',
    role: 'borrower',
    label: 'Prof. Eduardo Rocha',
    subtitle: 'Professor · Ciência da Computação',
    email: 'rocha@labnrdt.edu.br',
    password: BORROWER_DEMO_PASSWORD,
  },
  {
    id: 'prof-costa',
    role: 'borrower',
    label: 'Profª. Marina Costa',
    subtitle: 'Professora · Eletrônica',
    email: 'costa@labnrdt.edu.br',
    password: BORROWER_DEMO_PASSWORD,
  },
  {
    id: 'aluno-souza',
    role: 'borrower',
    label: 'Daniel Souza',
    subtitle: 'Aluno · TADS · 5º semestre',
    email: 'daniel@labnrdt.edu.br',
    password: BORROWER_DEMO_PASSWORD,
  },
  {
    id: 'aluna-ferreira',
    role: 'borrower',
    label: 'Camila Ferreira',
    subtitle: 'Aluna · Sistemas de Informação',
    email: 'camila@labnrdt.edu.br',
    password: BORROWER_DEMO_PASSWORD,
  },
  {
    id: 'tecnico-pereira',
    role: 'borrower',
    label: 'João Pereira',
    subtitle: 'Técnico · Laboratório de Eletrônica',
    email: 'joao@labnrdt.edu.br',
    password: BORROWER_DEMO_PASSWORD,
  },
  {
    id: 'monitor-almeida',
    role: 'borrower',
    label: 'Lucas Almeida',
    subtitle: 'Monitor PIBIC · Redes',
    email: 'lucas@labnrdt.edu.br',
    password: BORROWER_DEMO_PASSWORD,
  },
]

export function demoAccountsForRole(role: DemoRole): DemoAccount[] {
  return DEMO_ACCOUNTS.filter((a) => a.role === role)
}
