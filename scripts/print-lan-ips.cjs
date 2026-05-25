/** Aguarda a API e imprime IPs LAN para teste no celular (QR). */
const http = require('http')

const HEALTH_URL = 'http://127.0.0.1:8000/health'
const MAX_ATTEMPTS = 40
const DELAY_MS = 1500

function fetchHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get(HEALTH_URL, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(4000, () => {
      req.destroy()
      reject(new Error('timeout'))
    })
  })
}

function kindLabel(kind) {
  if (kind === 'wifi') return 'Wi-Fi'
  if (kind === 'ethernet') return 'Cabo'
  return 'Rede'
}

async function main() {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const h = await fetchHealth()
      const ifaces = h.lan_interfaces || []
      console.log('')
      console.log('[EquipFlow] Enderecos na rede local (celular / QR):')
      if (!ifaces.length) {
        console.log('  (nenhum IP detectado — conecte Wi-Fi ou cabo)')
      } else {
        for (const iface of ifaces) {
          const rec = h.lan_recommended === iface.ip ? '  <- recomendado no QR' : ''
          console.log(`  http://${iface.ip}:5173  (${kindLabel(iface.kind)})${rec}`)
        }
      }
      if (h.lan_qr_hint === 'ethernet_only') {
        console.log(
          '  Dica: notebook so no cabo — ligue o Wi-Fi do PC na mesma rede do celular se o QR nao abrir.',
        )
      }
      console.log('')
      return
    } catch {
      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
  }
}

main()
