import type { Equipment, EquipmentStatus, Loan, User } from './types'

/** Em dev, URLs relativas passam pelo proxy do Vite (celular na mesma LAN). Em build, use VITE_API_URL. */
const base =
  import.meta.env.DEV
    ? ''
    : (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000')

function authHeader(): HeadersInit {
  const t = localStorage.getItem('equipflow_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

type FastApiErr = { loc?: (string | number)[]; msg?: string; type?: string }

function formatDetailItem(d: FastApiErr | string): string {
  if (typeof d === 'string') return d
  if (d?.msg) {
    const loc = Array.isArray(d.loc) ? d.loc.filter((x) => x !== 'body').join(' · ') : ''
    return loc ? `${loc}: ${d.msg}` : d.msg
  }
  return ''
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = await res.json()
    if (j && typeof j.detail === 'string') return j.detail
    if (Array.isArray(j?.detail)) {
      const parts = (j.detail as FastApiErr[])
        .map(formatDetailItem)
        .filter(Boolean)
      if (parts.length) return parts.join(' ')
    }
  } catch {
    /* ignore */
  }
  if (res.status === 0 || res.status >= 500) return 'Serviço indisponível. Verifique se a API está rodando.'
  return `Erro ${res.status}`
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...(init.headers || {}),
      },
    })
  } catch {
    throw new Error('Sem conexão com o servidor. Confira se o back end está ativo (porta 8000).')
  }

  if (res.status === 401) {
    localStorage.removeItem('equipflow_token')
    throw new Error('Sessão expirada. Faça login novamente.')
  }
  if (!res.ok) throw new Error(await parseError(res))
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<User>('/auth/me'),
}

export const equipmentApi = {
  list: (status?: EquipmentStatus) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : ''
    return api<Equipment[]>(`/equipment${q}`)
  },
  create: (body: {
    name: string
    inventory_code: string
    description?: string | null
    status?: EquipmentStatus
  }) => api<Equipment>('/equipment', { method: 'POST', body: JSON.stringify(body) }),
  patch: (
    id: number,
    body: Partial<{
      name: string
      inventory_code: string
      description: string | null
      status: EquipmentStatus
    }>,
  ) => api<Equipment>(`/equipment/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
}

export const loansApi = {
  create: (
    equipment_id: number,
    due_at: string,
    opts: { terms_accepted: boolean; terms_version: string },
  ) =>
    api<Loan>('/loans', {
      method: 'POST',
      body: JSON.stringify({
        equipment_id,
        due_at,
        terms_accepted: opts.terms_accepted,
        terms_version: opts.terms_version,
      }),
    }),
  mine: () => api<Loan[]>('/loans/me'),
  pendingAdmin: () => api<Loan[]>('/loans/pending'),
  activeAdmin: () => api<Loan[]>('/loans/active'),
  /** Empréstimos finalizados (somente administrador). */
  finishedAdmin: () => api<Loan[]>('/loans/finished'),
  rejectedAdmin: () => api<Loan[]>('/loans/rejected'),
  approve: (id: number) => api<Loan>(`/loans/${id}/approve`, { method: 'POST' }),
  reject: (id: number) => api<Loan>(`/loans/${id}/reject`, { method: 'POST' }),
  returnLoan: (id: number) => api<Loan>(`/loans/${id}/return`, { method: 'POST' }),
}
