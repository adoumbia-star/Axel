import { databaseError, getSql, json } from './_lib/db.js'

type PumpReadingInput = {
  stationCode?: string
  pumpCode?: string
  product?: string
  readingType?: 'opening' | 'closing'
  indexLiters?: number
  actorName?: string
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return json({ ok: false, message: 'Méthode non autorisée.' }, { status: 405 })
  }

  try {
    const body = await request.json() as PumpReadingInput
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
      return json({ ok: false, message: 'Relevé de pompe invalide.' }, { status: 400 })
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
      ? json({ ok: true, reading: readings[0] }, { status: 201 })
      : json({ ok: false, message: 'Station introuvable.' }, { status: 404 })
  } catch (error) {
    return databaseError(error)
  }
}
