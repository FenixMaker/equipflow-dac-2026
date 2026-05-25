/**
 * Gera docs/screenshots/01–10 (Playwright).
 * Uso: node scripts/capture-screenshots.mjs
 *      node scripts/capture-screenshots.mjs --spawn   (sobe API + Vite e encerra ao terminar)
 */
import { chromium } from 'playwright'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'docs', 'screenshots')
const webBase = process.env.EQUIPFLOW_WEB_URL || 'http://127.0.0.1:5173'
const apiHealth = process.env.EQUIPFLOW_API_HEALTH || 'http://127.0.0.1:8000/health'

const spawnServers = process.argv.includes('--spawn')

let apiProc
let webProc

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

async function waitForUrl(url, attempts = 120) {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) return
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Serviço indisponível: ${url}`)
}

function startDevServers() {
  apiProc = spawn('node', [path.join('scripts', 'run-backend.cjs')], {
    cwd: root,
    stdio: 'ignore',
    windowsHide: true,
  })
  if (process.platform === 'win32') {
    webProc = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev'], {
      cwd: path.join(root, 'frontend'),
      stdio: 'ignore',
      windowsHide: true,
    })
  } else {
    webProc = spawn('npm', ['run', 'dev'], {
      cwd: path.join(root, 'frontend'),
      stdio: 'ignore',
    })
  }
}

function stopDevServers() {
  for (const proc of [apiProc, webProc]) {
    if (!proc?.pid) continue
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], { stdio: 'ignore', windowsHide: true })
      } else {
        proc.kill('SIGTERM')
      }
    } catch {
      /* ignore */
    }
  }
}

async function setTheme(page, mode) {
  await page.evaluate((theme) => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('equipflow_theme', theme)
  }, mode)
}

async function settleUi(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.dash-enter, .stat-tile, .section-card').forEach((el) => {
      const node = el
      node.style.opacity = '1'
      node.style.transform = 'none'
    })
  })
  await page.waitForTimeout(350)
}

async function shotLocator(page, locator, filePath) {
  await locator.waitFor({ state: 'visible', timeout: 20_000 })
  const box = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })
  if (!box.width || !box.height) throw new Error(`Sem área visível para captura: ${filePath}`)
  await page.screenshot({
    path: filePath,
    clip: {
      x: box.x,
      y: box.y,
      width: Math.min(box.width, page.viewportSize().width - box.x),
      height: Math.min(box.height, 8192),
    },
    animations: 'disabled',
    timeout: 60_000,
  })
}

async function loginAs(page, profileName) {
  await page.goto(webBase, { waitUntil: 'domcontentloaded' })
  await page.getByRole('option', { name: profileName }).click({ force: true })
  await page.getByRole('button', { name: /Entrar como Conta Selecionada/i }).click({ force: true })
}

async function logout(page) {
  await page.getByRole('button', { name: 'Sair' }).click({ force: true })
  await page.getByRole('heading', { name: 'Entrar' }).waitFor({ timeout: 15000 })
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })

  let startedHere = false
  try {
    try {
      await waitForUrl(apiHealth, 4)
      await waitForUrl(webBase, 4)
    } catch {
      if (!spawnServers) {
        throw new Error(
          'API ou Vite não estão no ar. Rode com --spawn ou inicie manualmente (portas 8000 e 5173).',
        )
      }
      startDevServers()
      startedHere = true
      await waitForUrl(apiHealth)
      await waitForUrl(webBase)
    }

    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.goto(webBase, { waitUntil: 'domcontentloaded' })
    await setTheme(page, 'light')
    await page.reload({ waitUntil: 'networkidle' })
    await shotLocator(page, page.locator('.login-split'), path.join(outDir, '01-login-claro.png'))

    await setTheme(page, 'dark')
    await page.waitForTimeout(200)
    await shotLocator(page, page.locator('.login-split'), path.join(outDir, '02-login-escuro.png'))

    await loginAs(page, 'Coordenação NRDT')
    await page.getByRole('heading', { name: /Patrimônio e empréstimos/i, level: 2 }).waitFor({ timeout: 45_000 })
    await setTheme(page, 'light')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: /Patrimônio e empréstimos/i, level: 2 }).waitFor({ timeout: 45_000 })
    await settleUi(page)
    await shotLocator(page, page.locator('.app-layout'), path.join(outDir, '03-admin-painel.png'))

    await page.getByRole('button', { name: 'Editar' }).first().click({ force: true })
    await page.locator('.edit-equipment-dialog').waitFor({ state: 'visible', timeout: 10000 })
    await shotLocator(
      page,
      page.locator('.edit-equipment-dialog'),
      path.join(outDir, '04-admin-editar-equipamento.png'),
    )
    await page.keyboard.press('Escape')
    await page.locator('.edit-equipment-dialog').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})

    await page.evaluate(() => {
      document.getElementById('pending-loans')?.scrollIntoView({ block: 'start' })
    })
    await page.waitForTimeout(400)
    await settleUi(page)
    await shotLocator(
      page,
      page.locator('.dashboard-queue-grid'),
      path.join(outDir, '05-admin-emprestimos-ativos.png'),
    )

    await logout(page)

    await loginAs(page, 'Prof. Eduardo Rocha')
    await page.getByRole('heading', { name: 'Meus empréstimos', level: 2 }).waitFor({ timeout: 45_000 })
    await setTheme(page, 'light')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Meus empréstimos', level: 2 }).waitFor({ timeout: 45_000 })
    await settleUi(page)
    await shotLocator(page, page.locator('.app-layout'), path.join(outDir, '06-solicitante-painel.png'))

    await page.getByRole('button', { name: 'Ver ficha' }).first().click({ force: true })
    await page.locator('.equipment-detail-dialog, dialog').first().waitFor({ state: 'visible', timeout: 10000 })
    const detail = page.locator('dialog').filter({ has: page.getByRole('heading') }).first()
    await shotLocator(page, detail, path.join(outDir, '07-solicitante-ficha-equipamento.png'))
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'Solicitar empréstimo' }).first().click({ force: true })
    await page.locator('#loan-request-pickup').waitFor({ timeout: 10000 })
    const pickup = toInputDate(new Date())
    const due = toInputDate(addDays(new Date(), 3))
    await page.locator('#loan-request-pickup').fill(pickup)
    await page.locator('#loan-request-due').fill(due)
    const loanDialog = page.locator('.loan-request-dialog')
    await shotLocator(page, loanDialog, path.join(outDir, '08-solicitante-pedido-emprestimo-passo1.png'))
    await page.getByRole('button', { name: /Continuar para o termo/i }).click({ force: true })
    await page.locator('#loan-request-terms-check').waitFor({ timeout: 10000 })
    await shotLocator(page, loanDialog, path.join(outDir, '09-solicitante-pedido-emprestimo-passo2-termo.png'))
    await page.keyboard.press('Escape')

    const swagger = await browser.newPage({ viewport: { width: 1366, height: 900 } })
    await swagger.goto('http://127.0.0.1:8000/docs', { waitUntil: 'networkidle' })
    await swagger.screenshot({
      path: path.join(outDir, '10-api-swagger.png'),
      fullPage: false,
    })

    await browser.close()
    console.log('Capturas gravadas em', outDir)
  } finally {
    if (startedHere) stopDevServers()
  }
}

main().catch((e) => {
  console.error(e)
  stopDevServers()
  process.exit(1)
})
