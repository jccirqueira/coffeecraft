import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const CONFIG_PATH = process.env.CONFIG_PATH || path.join(import.meta.dirname, 'config.json')

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const senha = args.find(a => !a.startsWith('--'))

  if (!senha) {
    console.error('Uso: node server/setup.js <senha> [--force]')
    process.exit(1)
  }
  if (senha.length < 4) {
    console.error('A senha precisa ter pelo menos 4 caracteres.')
    process.exit(1)
  }
  if (fs.existsSync(CONFIG_PATH) && !force) {
    console.error(`config.json já existe em ${CONFIG_PATH}. Use --force para sobrescrever.`)
    process.exit(1)
  }

  const config = {
    senhaHash: hashSenha(senha),
    token: crypto.randomBytes(32).toString('hex'),
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 })
  console.log(`Config criada em ${CONFIG_PATH}`)
}

main()
