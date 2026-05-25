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
  lan_qr_hint?: string | null
}

type ReachStatus = 'idle' | 'checking' | 'ok' | 'fail'

type Props = {
  /** @deprecated use variant="compact" */
  compact?: boolean
  variant?: 'compact' | 'sidebar' | 'hero'
}


export function LoginQrPanel({ compact = false, variant: variantProp }: Props) {
  const isHero = variantProp === 'hero'
  const isSidebar = variantProp === 'sidebar' || isHero
  const isCompact = variantProp === 'compact' || (!isSidebar && compact)
  const size = isHero ? 200 : isSidebar && !isHero ? 168 : isCompact ? 128 : 176

  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [lanInterfaces, setLanInterfaces] = useState<LanInterface[]>([])
  const [selectedIp, setSelectedIp] = useState<string | null>(null)
  const [loadingLan, setLoadingLan] = useState(true)
  const [reachStatus, setReachStatus] = useState<ReachStatus>('idle')
  const [reachDetail, setReachDetail] = useState<string | null>(null)
  const [lanQrHint, setLanQrHint] = useState<string | null>(null)

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
        setLanQrHint(h.lan_qr_hint ?? null)
        if (onLoopback) {
          setSelectedIp(pickPreferredLanAddress(addrs, ifaces, h.lan_recommended ?? null))
        } else if (hostname) {
          setSelectedIp(hostname)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLanInterfaces([])
          setLanQrHint(null)
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
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: isHero
        ? { dark: '#0c1929', light: '#ffffff' }
        : isSidebar
          ? { dark: '#0f172a', light: '#ffffff' }
          : { dark: '#1c1915ff', light: '#ffffffff' },
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
  }, [qrTargetUrl, size, isSidebar])

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
          setReachDetail('PC acessível neste IP.')
        } else {
          setReachStatus('fail')
          setReachDetail('Verifique firewall (portas 5173 e 8000).')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReachStatus('fail')
          setReachDetail('Não foi possível alcançar o servidor neste IP.')
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

  const body = (
    <section
      className={`login-qr-body${isHero ? ' login-qr-body--hero' : ''}`}
      aria-labelledby={isHero ? 'login-qr-hero-title' : isSidebar ? 'login-qr-sidebar-title' : 'login-qr-title'}
    >
      <h2
        id={isHero ? 'login-qr-hero-title' : isSidebar ? 'login-qr-sidebar-title' : 'login-qr-title'}
        className="sr-only"
      >
        Abrir no celular
      </h2>

      {!isSidebar && !isHero ? (
        <p className="login-qr-lede">
          Escaneie com a câmera. Celular e PC na mesma rede Wi‑Fi.
        </p>
      ) : null}

      {!isSidebar && onLoopback ? (
        <p className="login-qr-warn tiny" role="status">
          Você está em <strong>localhost</strong> — o QR usa o IP do PC na rede.
        </p>
      ) : null}

      {!isSidebar && lanQrHint === 'ethernet_only' ? (
        <p className="login-qr-warn tiny" role="alert">
          PC só no cabo. Se o celular não conectar, ligue o Wi‑Fi do notebook na mesma rede.
        </p>
      ) : null}

      {showIpPicker && !isHero ? (
        <div className="login-qr-pick">
          <label htmlFor={isSidebar ? 'login-qr-ip-sidebar' : 'login-qr-ip'} className="tiny">
            IP deste PC
          </label>
          <select
            id={isSidebar ? 'login-qr-ip-sidebar' : 'login-qr-ip'}
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

      {isHero && showIpPicker ? (
        <label className="login-qr-ip-hero">
          <span className="sr-only">IP deste PC</span>
          <select
            id="login-qr-ip-hero"
            className="login-qr-select login-qr-select--hero"
            value={selectedIp ?? ''}
            onChange={(e) => setSelectedIp(e.target.value || null)}
            aria-label="IP deste PC"
          >
            {lanInterfaces.map((iface) => (
              <option key={iface.ip} value={iface.ip}>
                {iface.ip}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {!isSidebar && reachStatus === 'checking' ? (
        <p className="login-qr-reach tiny" role="status">
          Testando conexão…
        </p>
      ) : null}

      {!isSidebar && reachStatus === 'ok' && reachDetail ? (
        <p className="login-qr-ok tiny" role="status">
          {reachDetail}
        </p>
      ) : null}

      {!isSidebar && reachStatus === 'fail' && reachDetail ? (
        <p className="login-qr-warn tiny" role="alert">
          {reachDetail}
        </p>
      ) : null}

      {noLanForQr && !isSidebar ? (
        <p className="login-qr-warn tiny" role="alert">
          IP da rede não detectado. Conecte Wi‑Fi ou cabo e recarregue.
        </p>
      ) : null}

      <div
        className={`login-qr-layout${isHero ? ' login-qr-layout--hero' : isSidebar ? ' login-qr-layout--sidebar' : ''}`}
      >
        <div className={`login-qr-box${isHero ? ' login-qr-box--hero' : ''}`}>
          {err ? <p className="error login-qr-error">{err}</p> : null}
          {dataUrl ? (
            <>
              <img
                src={dataUrl}
                width={size}
                height={size}
                alt="QR para abrir o EquipFlow no celular"
                className="login-qr-img"
              />
              {isHero ? (
                <img
                  src="/brand/logo-icone.png"
                  alt=""
                  className="login-qr-logo-overlay"
                  width={40}
                  height={40}
                  decoding="async"
                  aria-hidden="true"
                />
              ) : null}
            </>
          ) : !err && !noLanForQr ? (
            <div
              className="login-qr-skel skeleton-block"
              style={{ width: size, height: size }}
              aria-hidden="true"
            />
          ) : null}
        </div>

        {isHero && selectedIp ? (
          <p className="login-qr-hero-caption">
            <strong>Acesso rápido móvel:</strong> Escaneie para conectar. IP local:{' '}
            <span className="login-qr-hero-ip">{selectedIp}</span>
          </p>
        ) : null}

        {qrTargetUrl && !isSidebar && !isHero ? (
          <p className="login-qr-url tiny" title={qrTargetUrl}>
            <a href={qrTargetUrl} target="_blank" rel="noreferrer" className="login-qr-link">
              {qrTargetUrl}
            </a>
          </p>
        ) : null}
      </div>

    </section>
  )

  if (isHero) {
    return <div className="login-qr login-qr--hero">{body}</div>
  }

  if (isSidebar && variantProp === 'sidebar') {
    return <div className="login-qr login-qr--sidebar">{body}</div>
  }

  if (isCompact) {
    return (
      <details className="login-qr login-qr--compact">
        <summary className="login-qr-summary">Abrir no celular (mesma rede)</summary>
        {body}
      </details>
    )
  }

  return <div className="login-qr">{body}</div>
}
