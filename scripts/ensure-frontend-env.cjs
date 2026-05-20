const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const target = path.join(root, 'frontend', '.env')
const example = path.join(root, 'frontend', '.env.example')

if (!fs.existsSync(target) && fs.existsSync(example)) {
  fs.copyFileSync(example, target)
  console.log('[dac] Criado frontend/.env a partir de .env.example')
}
