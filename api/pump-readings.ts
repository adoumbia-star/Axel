import { databaseError, getSql, json } from './_lib/db.ts'
import { parseJsonBody, type ApiRequest, type ApiResponse } from './_lib/http.ts'

type PumpReadingInput = {
  stationCode?: string
  pumpCode?: string
  product?: string
  readingType?: 'opening' | 'closing'
  indexLiters?: number
  actorName?: string
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'POST') {
    return json(response, 405, { ok: false, message: 'Méthode non autorisée.' })
  }

  try {
    const body = parseJsonBody<PumpReadingInput>(request)
    const stationCode = body.stationCode?.trim()
    const pumpCode = body.pumpCode?.trim()
    const product = body.product?.trim()
    const actorName = body.actorName?.trim()

    if (
      !stationCode ||
      !pumpCode ||
      !product ||
      !actorName ||
      !body.readingType ||
      !Number.isFinite(body.indexLiters) ||
      Number(body.indexLiters) < 0
    ) {
      return json(response, 400, { ok: false, message: 'Relevé de pompe invalide.' })
    }

    const sql = getSql()
    const readings = await sql`
      INSERT INTO pump_readings (
        station_id,
        pump_code,
        product,
        reading_type,
        index_liters,
        actor_name
      )
      SELECT
        id,
        ${pumpCode.slice(0, 30)},
        ${product.slice(0, 80)},
        ${body.readingType},
        ${Number(body.indexLiters)},
        ${actorName.slice(0, 120)}
      FROM stations
      WHERE code = ${stationCode.slice(0, 30)}
      RETURNING
        id,
        pump_code AS "pumpCode",
        reading_type AS "readingType",
        index_liters AS "indexLiters",
        recorded_at AS "recordedAt"
    `

    return readings.length
      ? json(response, 201, { ok: true, reading: readings[0] })
      : json(response, 404, { ok: false, message: 'Station introuvable.' })
  } catch (error) {
    return databaseError(response, error)
  }
}
