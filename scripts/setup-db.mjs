import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Pool } from '@neondatabase/serverless'

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator < 1) continue
    const key = trimmed.slice(0, separator)
    const value = trimmed.slice(separator + 1).replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(resolve('.env.local'))
loadEnvFile(resolve('.env'))

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL est absente. Copiez .env.example vers .env.local puis renseignez la chaîne Neon.')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl })
const client = await pool.connect()

try {
  await client.query(readFileSync(resolve('db/schema.sql'), 'utf8'))
  await client.query(readFileSync(resolve('db/seed.sql'), 'utf8'))
  const [{ count }] = (await client.query('SELECT count(*)::int AS count FROM missions')).rows
  console.log(`Neon prêt. ${count} mission(s) en base.`)
} finally {
  client.release()
  await pool.end()
}
