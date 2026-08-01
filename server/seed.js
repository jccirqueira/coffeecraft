import fs from 'node:fs'
import { importAll, closeDb } from './db.js'

const file = process.argv[2]
if (!file) {
  console.error('Uso: node server/seed.js <arquivo.json>')
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'))
const totals = importAll(data)
console.log('Importação concluída:', JSON.stringify(totals))
closeDb()
