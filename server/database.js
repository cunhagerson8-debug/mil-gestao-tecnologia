import Database from 'better-sqlite3'
import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const serverDirectory = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(serverDirectory, '.env') })

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve(serverDirectory, 'mil-clientes.db')

if (process.env.DATABASE_PATH) {
  mkdirSync(path.dirname(databasePath), { recursive: true })
}

const db = new Database(databasePath)

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS oportunidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    empresa TEXT,
    whatsapp TEXT,
    email TEXT,
    cidade TEXT,
    estado TEXT,
    interesse TEXT,
    necessidade TEXT,
    status TEXT NOT NULL DEFAULT 'novo',
    observacoes TEXT,
    consentimento_contato INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS oportunidade_anotacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    oportunidade_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (oportunidade_id) REFERENCES oportunidades(id)
  )
`)

const opportunityColumns = db
  .prepare('PRAGMA table_info(oportunidades)')
  .all()

if (!opportunityColumns.some((column) => column.name === 'proximo_contato')) {
  db.exec('ALTER TABLE oportunidades ADD COLUMN proximo_contato TEXT')
}

export default db