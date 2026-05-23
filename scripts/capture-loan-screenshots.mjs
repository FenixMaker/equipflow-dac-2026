/**
 * Captura prints 08 e 09 do fluxo de pedido (retirada + devolução).
 * Uso: npm run dev (API + Vite) e depois node scripts/capture-loan-screenshots.mjs
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'docs', 'screenshots')
const base = process.env.EQUIPFLOW_WEB_URL || 'http://127.0.0.1:5173'

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function toInputDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function waitForApp(page) {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch('http://127.0.0.1:8000/health')
      if (r.ok) return
    } catch {
      /* retry */
    }
    await page.waitForTimeout(500)
  }
  throw new Error('API não respondeu em /health')
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })

  await waitForApp(page)
  await page.goto(base, { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'Conta solicitante' }).click()
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByRole('heading', { name: /Equipamentos disponíveis/i }).waitFor({ timeout: 20000 })

  await page.getByRole('button', { name: 'Solicitar empréstimo' }).first().click()
  await page.locator('#loan-request-pickup').waitFor({ timeout: 10000 })

  const pickup = toInputDate(new Date())
  const due = toInputDate(addDays(new Date(), 3))
  await page.locator('#loan-request-pickup').fill(pickup)
  await page.locator('#loan-request-due').fill(due)

  const dialog = page.locator('.loan-request-dialog')
  await dialog.screenshot({
    path: path.join(outDir, '08-solicitante-pedido-emprestimo-passo1.png'),
  })

  await page.getByRole('button', { name: /Continuar para o termo/i }).click()
  await page.locator('#loan-request-terms-check').waitFor({ timeout: 10000 })
  await dialog.screenshot({
    path: path.join(outDir, '09-solicitante-pedido-emprestimo-passo2-termo.png'),
  })

  await browser.close()
  console.log('Screenshots gravados em', outDir)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
