import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

const DB_PATH = process.env.DB_PATH || path.join(import.meta.dirname, 'data.sqlite')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL DEFAULT '',
  descricao TEXT DEFAULT '',
  categoria TEXT DEFAULT 'Outros',
  preco REAL DEFAULT 0,
  precoCusto REAL DEFAULT 0,
  precoVenda REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL DEFAULT '',
  cpf TEXT DEFAULT '',
  cnpj TEXT DEFAULT '',
  endereco TEXT DEFAULT '',
  email TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  contato TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS cafeterias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL DEFAULT '',
  local TEXT DEFAULT '',
  cnpj TEXT DEFAULT '',
  endereco TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  responsavel TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS receitas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL DEFAULT '',
  itens TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS propostas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT DEFAULT '',
  cliente TEXT DEFAULT '',
  cafeteriaId INTEGER DEFAULT 0,
  cafeteriaNome TEXT DEFAULT '',
  cafeteriaLocal TEXT DEFAULT '',
  sessoes TEXT DEFAULT '[]',
  taxaTipo TEXT DEFAULT 'percentual',
  taxaValor REAL DEFAULT 0,
  subtotal REAL DEFAULT 0,
  totalGeral REAL DEFAULT 0,
  salvoEm TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS contador_propostas (
  chave TEXT PRIMARY KEY,
  seq INTEGER DEFAULT 0
);
`)

export const TABLES = {
  categorias: { cols: ['nome'], json: [] },
  produtos: { cols: ['nome', 'descricao', 'categoria', 'preco', 'precoCusto', 'precoVenda'], json: [] },
  clientes: { cols: ['nome', 'cpf', 'cnpj', 'endereco', 'email', 'telefone', 'contato'], json: [] },
  cafeterias: { cols: ['nome', 'local', 'cnpj', 'endereco', 'telefone', 'email', 'responsavel'], json: [] },
  receitas: { cols: ['nome', 'itens'], json: ['itens'] },
  propostas: { cols: ['numero', 'cliente', 'cafeteriaId', 'cafeteriaNome', 'cafeteriaLocal', 'sessoes', 'taxaTipo', 'taxaValor', 'subtotal', 'totalGeral', 'salvoEm'], json: ['sessoes'] },
}

function encodeRow(table, data) {
  const def = TABLES[table]
  const out = {}
  for (const col of def.cols) {
    let v = data[col]
    if (v === undefined) {
      if (col === 'itens' || col === 'sessoes') v = '[]'
      else if (col === 'nome') v = ''
      else v = 0
    }
    out[col] = def.json.includes(col) ? JSON.stringify(v) : v
  }
  if (data.id !== undefined && Number.isInteger(data.id) && data.id > 0) out.id = data.id
  return out
}

function decodeRow(table, row) {
  if (!row) return null
  const def = TABLES[table]
  const out = { ...row }
  for (const col of def.json) {
    try { out[col] = JSON.parse(row[col] || '[]') } catch { out[col] = [] }
  }
  return out
}

export function listAll(table) {
  return db.prepare(`SELECT * FROM ${table} ORDER BY id`).all().map(r => decodeRow(table, r))
}

export function getById(table, id) {
  return decodeRow(table, db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id))
}

export function insertOne(table, data) {
  const row = encodeRow(table, data)
  const cols = Object.keys(row)
  const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`)
  const info = stmt.run(...Object.values(row))
  return getById(table, data.id ?? info.lastInsertRowid)
}

export function updateOne(table, id, data) {
  const row = encodeRow(table, data)
  const cols = Object.keys(row)
  const stmt = db.prepare(`UPDATE ${table} SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE id = ?`)
  stmt.run(...Object.values(row), id)
  return getById(table, id)
}

export function deleteOne(table, id) {
  return db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id).changes > 0
}

export function proximaSequencia(chave) {
  const stmt = db.prepare('INSERT INTO contador_propostas (chave, seq) VALUES (?, 1) ON CONFLICT(chave) DO UPDATE SET seq = seq + 1 RETURNING seq')
  return stmt.get(chave).seq
}

export function importAll(data) {
  const totals = {}
  for (const table of Object.keys(TABLES)) {
    const items = data[table]
    if (!Array.isArray(items) || items.length === 0) continue
    const insert = db.prepare(`INSERT OR REPLACE INTO ${table} (${['id', ...TABLES[table].cols].join(', ')}) VALUES (${['?', ...TABLES[table].cols.map(() => '?')].join(', ')})`)
    const tx = db.transaction(() => {
      for (const item of items) {
        const row = encodeRow(table, item)
        const cols = ['id', ...TABLES[table].cols]
        insert.run(...cols.map(c => row[c]))
      }
    })
    tx()
    totals[table] = items.length
  }
  if (data.contador && typeof data.contador === 'object') {
    const upsert = db.prepare('INSERT OR REPLACE INTO contador_propostas (chave, seq) VALUES (?, ?)')
    const tx = db.transaction(() => {
      for (const [chave, seq] of Object.entries(data.contador)) {
        upsert.run(String(chave), Number(seq) || 0)
      }
    })
    tx()
    totals.contador = Object.keys(data.contador).length
  }
  return totals
}

export function closeDb() {
  db.close()
}

export default db
