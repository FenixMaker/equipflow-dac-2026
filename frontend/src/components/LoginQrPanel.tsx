import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { api } from '../api'
import { buildLanPageUrl, isLoopbackHost, pickPreferredLanAddress } from '../utils/lanUrl'

type HealthLan = { status: string; lan_addresses?: string[] }

export function LoginQrPanel() {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [lanAddresses, setLanAddresses] = useState<string[]>([])
  const [selectedIp, setSelectedIp] = useState<string | null>(null)
  const [loadingLan, setLoadingLan] = useState(true)

  const loc = typeof window !== 'undefined' ? window.location : null
  const hostname = loc?.hostname ?? ''
  const onLoopback = hostname ? isLoopbackHost(hostname) : false

  useEffect(() => {
    let cancelled = false
    setLoadingLan(true)
    setErr(null)
    void api<HealthLan>('/health')
      .then((h) => {
        if (cancelled) return
        const addrs = h.lan_addresses ?? []
        setLanAddresses(addrs)
        if (onLoopback) {
          setSelectedIp(pickPreferredLanAddress(addrs))
        } else if (hostname) {
          setSelectedIp(hostname)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLanAddresses([])
          if (!onLoopback && hostname) setSelectedIp(hostname)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingLan(false)
      })
    return () => {
      cancelled = true
    }
  }, [hostname, onLoopback])

  const qrTargetUrl = useMemo(() => {
    if (!loc) return ''
    if (onLoopback) {
      if (selectedIp) return buildLanPageUrl(selectedIp, loc)
      return ''
    }
    return loc.href
  }, [loc, onLoopback, selectedIp])

  useEffect(() => {
    if (!qrTargetUrl) {
      setDataUrl(null)
      return
    }
    let cancelled = false
    setErr(null)
    void QRCode.toDataURL(qrTargetUrl, {
      width: 176,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1c1915ff', light: '#ffffffff' },
    })
      .then((u) => {
        if (!cancelled) setDataUrl(u)
      })
      .catch(() => {
        if (!cancelled) setErr('Não foi possível gerar o QR.')
      })
    return () => {
      cancelled = true
    }
  }, [qrTargetUrl])

  const noLanForQr = onLoopback && !loadingLan && !selectedIp

  return (
    <section className="login-qr" aria-labelledby="login-qr-title">
      <h2 id="login-qr-title" className="login-qr-title">
        Abrir no celular (mesma rede)
      </h2>
      <p className="login-qr-lede muted tiny">
        Escaneie com a câmera do celular. O PC e o celular devem estar na <strong>mesma rede local</strong> (Wi‑Fi ou
        cabo/Ethernet no mesmo roteador). Suba a API com{' '}
        <code className="login-qr-code">uvicorn app.main:app --reload --host 0.0.0.0 --port 8000</code>.
      </p>
      {onLoopback ? (
        <p className="login-qr-warn tiny" role="status">
          Você abriu por <strong>localhost</strong> — o QR usa o IP deste computador na rede para o celular alcançar o
          Vite e a API via proxy.
        </p>
      ) : null}
      {lanAddresses.length > 1 ? (
        <div className="login-qr-pick">
          <label htmlFor="login-qr-ip" className="tiny">
            IP deste PC na rede
          </label>
          <select
            id="login-qr-ip"
            className="login-qr-select"
            value={selectedIp ?? ''}
            onChange={(e) => setSelectedIp(e.target.value || null)}
          >
            {lanAddresses.map((ip) => (
              <option key={ip} value={ip}>
                {ip}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {noLanForQr ? (
        <p className="login-qr-warn tiny" role="alert">
          Não foi possível detectar um IP na rede. Abra o site pelo endereço <strong>Network</strong> do Vite (ex.{' '}
          <code className="login-qr-code">http://192.168.x.x:5173</code>) ou verifique cabo/Wi‑Fi e firewall.
        </p>
      ) : null}
      <div className="login-qr-box">
        {err ? <p className="error login-qr-error">{err}</p> : null}
        {dataUrl ? (
          <img
            src={dataUrl}
            width={176}
            height={176}
            alt="QR com o endereço para abrir no celular na mesma rede"
            className="login-qr-img"
          />
        ) : !err && !noLanForQr ? (
          <div className="login-qr-skel skeleton-block" style={{ width: 176, height: 176 }} aria-hidden="true" />
        ) : null}
      </div>
      {qrTargetUrl ? (
        <p className="muted tiny login-qr-url" title={qrTargetUrl}>
          {qrTargetUrl}
        </p>
      ) : null}
    </section>
  )
}
