import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function LoginQrPanel() {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const href = typeof window !== 'undefined' ? window.location.href : ''
  const isLocalhost =
    typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)

  useEffect(() => {
    if (!href) return
    let cancelled = false
    setErr(null)
    void QRCode.toDataURL(href, {
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
  }, [href])

  return (
    <section className="login-qr" aria-labelledby="login-qr-title">
      <h2 id="login-qr-title" className="login-qr-title">
        Abrir no celular (mesma rede)
      </h2>
        <p className="login-qr-lede muted tiny">
        Escaneie com a câmera do celular. O PC e o celular devem estar na mesma Wi‑Fi. Suba a API com{' '}
        <code className="login-qr-code">uvicorn app.main:app --reload --host 0.0.0.0 --port 8000</code> para o proxy
        do Vite alcançar o back end neste computador.
      </p>
      {isLocalhost ? (
        <p className="login-qr-warn tiny" role="status">
          Está em <strong>localhost</strong> — no celular use o endereço <strong>Network</strong> que o Vite mostra
          no terminal (ex.: <code className="login-qr-code">http://192.168.x.x:5173</code>) e gere o QR a partir desse
          endereço no PC, ou abra o site já por esse IP e volte a esta página.
        </p>
      ) : null}
      <div className="login-qr-box">
        {err ? <p className="error login-qr-error">{err}</p> : null}
        {dataUrl ? (
          <img src={dataUrl} width={176} height={176} alt="QR com o endereço desta página" className="login-qr-img" />
        ) : !err ? (
          <div className="login-qr-skel skeleton-block" style={{ width: 176, height: 176 }} aria-hidden="true" />
        ) : null}
      </div>
      <p className="muted tiny login-qr-url" title={href}>
        {href}
      </p>
    </section>
  )
}
