const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const backend = path.join(root, 'backend')

const runtimePy = path.join(root, 'runtime', 'python', 'python.exe')
const winPy = path.join(backend, '.venv', 'Scripts', 'python.exe')
const unixPy = path.join(backend, '.venv', 'bin', 'python')

let python = 'python'
if (process.env.EQUIPFLOW_PYTHON && fs.existsSync(process.env.EQUIPFLOW_PYTHON)) {
  python = process.env.EQUIPFLOW_PYTHON
} else if (fs.existsSync(runtimePy)) {
  python = runtimePy
} else if (fs.existsSync(winPy)) {
  python = winPy
} else if (fs.existsSync(unixPy)) {
  python = unixPy
}

const host = process.env.UVICORN_HOST || '0.0.0.0'
const port = process.env.UVICORN_PORT || '8000'

const args = ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', host, '--port', String(port)]

const child = spawn(python, args, {
  cwd: backend,
  stdio: 'inherit',
  shell: false,
})

child.on('exit', (code) => process.exit(code ?? 0))
