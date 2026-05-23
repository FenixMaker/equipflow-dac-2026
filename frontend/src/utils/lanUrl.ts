const LOOPBACK = /^(localhost|127\.0\.0\.1)$/i

export function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK.test(hostname)
}

/** Monta URL do front para outro dispositivo na mesma rede (Wi‑Fi ou cabo). */
export function buildLanPageUrl(ip: string, loc: Location = window.location): string {
  const port = loc.port || (loc.protocol === 'https:' ? '443' : '5173')
  const path = loc.pathname + loc.search + loc.hash
  return `${loc.protocol}//${ip}:${port}${path}`
}

export function pickPreferredLanAddress(addresses: string[]): string | null {
  if (!addresses.length) return null
  const wifiLike = addresses.find((a) => a.startsWith('192.168.'))
  return wifiLike ?? addresses[0]
}
