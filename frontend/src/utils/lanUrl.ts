const LOOPBACK = /^(localhost|127\.0\.0\.1)$/i

export type LanInterface = { ip: string; name: string; kind: string }

export function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK.test(hostname)
}

/** Monta URL do front para outro dispositivo na mesma rede (Wi‑Fi ou cabo). */
export function buildLanPageUrl(ip: string, loc: Location = window.location): string {
  const port = loc.port || (loc.protocol === 'https:' ? '443' : '5173')
  const path = loc.pathname + loc.search + loc.hash
  return `${loc.protocol}//${ip}:${port}${path}`
}

export function buildLanHealthUrl(ip: string, loc: Location = window.location): string {
  const port = loc.port || (loc.protocol === 'https:' ? '443' : '5173')
  return `${loc.protocol}//${ip}:${port}/health`
}

export function pickPreferredLanAddress(
  addresses: string[],
  interfaces?: LanInterface[],
  recommended?: string | null,
): string | null {
  if (recommended && addresses.includes(recommended)) return recommended
  if (interfaces?.length) {
    for (const kind of ['wifi', 'ethernet', 'other']) {
      const hit = interfaces.find((i) => i.kind === kind)
      if (hit) return hit.ip
    }
  }
  if (!addresses.length) return null
  const wifiLike = addresses.find((a) => a.startsWith('192.168.'))
  return wifiLike ?? addresses[0]
}

export function interfaceOptionLabel(iface: LanInterface): string {
  const kind =
    iface.kind === 'ethernet' ? 'Cabo' : iface.kind === 'wifi' ? 'Wi‑Fi' : 'Rede'
  return `${iface.ip} · ${kind} (${iface.name})`
}
