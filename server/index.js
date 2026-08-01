import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { TABLES, listAll, getById, insertOne, updateOne, deleteOne, proximaSequencia, importAll } from './db.js'

const CONFIG_PATH = process.env.CONFIG_PATH || path.join(import.meta.dirname, 'config.json')
const PORT = process.env.PORT || 3001

let config = null
function loadConfig() {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  } catch {
    config = null
  }
}
loadConfig()

function verificarSenha(senha) {
  if (!config || !config.senhaHash) return false
  const [salt, hash] = config.senhaHash.split(':')
  const candidate = crypto.scryptSync(String(senha || ''), salt, 64)
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), candidate)
}

const app = express()
app.use(express.json({ limit: '5mb' }))

function auth(req, res, next) {
  if (!config) {
    return res.status(500).json({ error: 'Servidor sem config. Rode: node server/setup.js <senha>' })
  }
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(config.token))) {
    return res.status(401).json({ error: 'Não autorizado' })
  }
  next()
}

app.post('/api/login', (req, res) => {
  if (!config) {
    return res.status(500).json({ error: 'Servidor sem config. Rode: node server/setup.js <senha>' })
  }
  const senha = req.body && req.body.senha
  if (!verificarSenha(senha)) {
    setTimeout(() => res.status(401).json({ error: 'Senha incorreta' }), 500)
    return
  }
  res.json({ token: config.token })
})

app.use('/api', auth)

app.get('/api/ping', (req, res) => res.json({ ok: true }))

for (const table of Object.keys(TABLES)) {
  const singular = table.slice(0, -1)

  app.get(`/api/${table}`, (req, res) => res.json(listAll(table)))
  app.get(`/api/${table}/:id`, (req, res) => {
    const row = getById(table, Number(req.params.id))
    if (!row) return res.status(404).json({ error: 'Não encontrado' })
    res.json(row)
  })
  app.post(`/api/${table}`, (req, res) => {
    const row = insertOne(table, req.body || {})
    res.status(201).json(row)
  })
  app.put(`/api/${table}/:id`, (req, res) => {
    const id = Number(req.params.id)
    if (!getById(table, id)) return res.status(404).json({ error: 'Não encontrado' })
    res.json(updateOne(table, id, req.body || {}))
  })
  app.delete(`/api/${table}/:id`, (req, res) => {
    const ok = deleteOne(table, Number(req.params.id))
    if (!ok) return res.status(404).json({ error: 'Não encontrado' })
    res.json({ ok: true })
  })

  void singular
}

app.post('/api/contador/next', (req, res) => {
  const chave = req.body && req.body.chave
  if (!chave) return res.status(400).json({ error: 'chave obrigatória' })
  res.json({ chave, seq: proximaSequencia(String(chave)) })
})

app.post('/api/import', (req, res) => {
  const totals = importAll(req.body || {})
  res.json({ ok: true, totals })
})

app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Erro interno do servidor' })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`CoffeeCraft API rodando em http://127.0.0.1:${PORT}`)
})
