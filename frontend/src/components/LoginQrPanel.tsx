import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { api } from '../api'
import {
  buildLanHealthUrl,
  buildLanPageUrl,
  interfaceOptionLabel,
  isLoopbackHost,
  pickPreferredLanAddress,
  type LanInterface,
} from '../utils/lanUrl'

type HealthLan = {
  status: string
  lan_addresses?: string[]
  lan_interfaces?: LanInterface[]
  lan_recommended?: string | null
}

type ReachStatus = 'idle' | 'checking' | 'ok' | 'fail'

export function LoginQrPanel() {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [lanInterfaces, setLanInterfaces] = useState<LanInterface[]>([])
  const [selectedIp, setSelectedIp] = useState<string | null>(null)
  const [loadingLan, setLoadingLan] = useState(true)
  const [reachStatus, setReachStatus] = useState<ReachStatus>('idle')
  const [reachDetail, setReachDetail] = useState<string | null>(null)

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
        const ifaces = h.lan_interfaces ?? []
        setLanInterfaces(ifaces)
        if (onLoopback) {
          setSelectedIp(pickPreferredLanAddress(addrs, ifaces, h.lan_recommended ?? null))
        } else if (hostname) {
          setSelectedIp(hostname)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLanInterfaces([])
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

  useEffect(() => {
    if (!loc || !selectedIp || !onLoopback) {
      setReachStatus('idle')
      setReachDetail(null)
      return
    }
    let cancelled = false
    const ctrl = new AbortController()
    setReachStatus('checking')
    setReachDetail(null)
    const testUrl = buildLanHealthUrl(selectedIp, loc)
    const timer = window.setTimeout(() => ctrl.abort(), 5000)
    void fetch(testUrl, { signal: ctrl.signal })
      .then((r) => {
        if (cancelled) return
        if (r.ok) {
          setReachStatus('ok')
          setReachDetail('Este PC respondeu na rede — o celular deve conseguir abrir o mesmo endereço do QR.')
        } else {
          setReachStatus('fail')
          setReachDetail(
            'O PC não respondeu neste IP/porta. Libere as portas 5173 e 8000 no firewall do Windows (rede privada) ou escolha outro IP.',
          )
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReachStatus('fail')
          setReachDetail(
            'Não foi possível alcançar o Vite neste IP. Execute scripts\\liberar-firewall-windows.ps1 como administrador ou abra o site pelo endereço Network do terminal.',
          )
        }
      })
      .finally(() => {
        window.clearTimeout(timer)
      })
    return () => {
      cancelled = true
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [loc, selectedIp, onLoopback])

  const noLanForQr = onLoopback && !loadingLan && !selectedIp
  const showIpPicker = onLoopback && lanInterfaces.length > 0

  return (
    <section className="login-qr" aria-labelledby="login-qr-title">
      <h2 id="login-qr-title" className="login-qr-title">
        Abrir no celular (mesma rede)
      </h2>
      <p className="login-qr-lede muted tiny">
        Escaneie com a câmera do celular. O PC e o celular devem estar na <strong>mesma rede local</strong> (celular no
        Wi‑Fi do mesmo roteador em que o PC está no cabo, ou ambos no Wi‑Fi). A API deve estar em{' '}
        <code className="login-qr-code">0.0.0.0:8000</code> (padrão do <code className="login-qr-code">npm run dev</code>
        ).
      </p>
      {onLoopback ? (
        <p className="login-qr-warn tiny" role="status">
          Você abriu por <strong>localhost</strong> — o QR aponta para o IP do PC na rede (prioriza{' '}
          <strong>cabo/Ethernet</strong> quando detectado).
        </p>
      ) : null}
      {showIpPicker ? (
        <div className="login-qr-pick">
          <label htmlFor="login-qr-ip" className="tiny">
            IP deste PC na rede (use o do cabo se o PC estiver em Ethernet)
          </label>
          <select
            id="login-qr-ip"
            className="login-qr-select"
            value={selectedIp ?? ''}
            onChange={(e) => setSelectedIp(e.target.value || null)}
          >
            {lanInterfaces.map((iface) => (
              <option key={iface.ip} value={iface.ip}>
                {interfaceOptionLabel(iface)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {reachStatus === 'checking' ? (
        <p className="muted tiny login-qr-reach" role="status">
          Testando se o Vite responde neste IP…
        </p>
      ) : null}
      {reachStatus === 'ok' && reachDetail ? (
        <p className="login-qr-ok tiny" role="status">
          {reachDetail}
        </p>
      ) : null}
      {reachStatus === 'fail' && reachDetail ? (
        <p className="login-qr-warn tiny" role="alert">
          {reachDetail}
        </p>
      ) : null}
      {noLanForQr ? (
        <p className="login-qr-warn tiny" role="alert">
          Não foi possível detectar um IP na rede. Conecte o cabo ou Wi‑Fi, abra{' '}
          <code className="login-qr-code">http://SEU_IP:5173</code> no próprio PC (URL Network do Vite) e recarregue.
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
          <a href={qrTargetUrl} target="_blank" rel="noreferrer" className="login-qr-link">
            {qrTargetUrl}
          </a>
        </p>
      ) : null}
    </section>
  )
}
