import { databaseError, getSql, json } from './_lib/db.js'

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
    return json({ ok: false, message: 'Méthode non autorisée.' }, { status: 405 })
  }

  try {
    const sql = getSql()
    const missions = await sql`
      SELECT
        m.reference,
        m.origin_name AS "originName",
        s.name AS destination,
        v.registration AS vehicle,
        m.driver_name AS "driverName",
        m.status,
        m.declared_volume_liters AS "declaredVolumeLiters",
        m.telemetry_volume_liters AS "telemetryVolumeLiters",
        m.received_volume_liters AS "receivedVolumeLiters",
        m.scheduled_at AS "scheduledAt",
        m.updated_at AS "updatedAt"
      FROM missions m
      JOIN stations s ON s.id = m.destination_station_id
      JOIN vehicles v ON v.id = m.vehicle_id
      ORDER BY m.scheduled_at DESC
      LIMIT 50
    `

    return json({ ok: true, missions })
  } catch (error) {
    return databaseError(error)
  }
}
