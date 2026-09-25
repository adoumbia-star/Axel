import { databaseError, getSql, json } from './_lib/db.js'

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
    return json({ ok: false, message: 'Méthode non autorisée.' }, { status: 405 })
  }

  try {
    const sql = getSql()
    const [database] = await sql`
      SELECT
        current_database() AS name,
        now() AS server_time
    `

    return json({
      ok: true,
      service: 'profuel-api',
      database: database.name,
      serverTime: database.server_time,
    })
  } catch (error) {
    return databaseError(error)
  }
}
