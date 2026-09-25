import { databaseError, getSql, json } from './_lib/db'
import type { ApiRequest, ApiResponse } from './_lib/http'

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') {
    return json(response, 405, { ok: false, message: 'Méthode non autorisée.' })
  }

  try {
    const sql = getSql()
    const [database] = await sql`
      SELECT
        current_database() AS name,
        now() AS server_time
    `

    return json(response, 200, {
      ok: true,
      service: 'profuel-api',
      database: database.name,
      serverTime: database.server_time,
    })
  } catch (error) {
    return databaseError(response, error)
  }
}
