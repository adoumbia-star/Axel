import { databaseError, getSql, json } from './_lib/db'

const allowedStatuses = new Set(['draft', 'loaded', 'transit', 'arrived', 'completed'])

type MissionUpdate = {
  status?: string
  receivedVolumes?: number[]
  actorName?: string
}

function validReference(reference: string | null): reference is string {
  return typeof reference === 'string' && /^MS-[A-Z0-9-]{4,40}$/.test(reference)
}

async function findMission(reference: string) {
  const sql = getSql()
  const missions = await sql`
    SELECT
      m.id,
      m.reference,
      m.loading_reference AS "loadingReference",
      m.origin_name AS "originName",
      s.name AS destination,
      v.registration AS vehicle,
      m.driver_name AS "driverName",
      m.status,
      m.declared_volume_liters AS "declaredVolumeLiters",
      m.telemetry_volume_liters AS "telemetryVolumeLiters",
      m.received_volume_liters AS "receivedVolumeLiters",
      m.scheduled_at AS "scheduledAt",
      m.completed_at AS "completedAt",
      m.updated_at AS "updatedAt"
    FROM missions m
    JOIN stations s ON s.id = m.destination_station_id
    JOIN vehicles v ON v.id = m.vehicle_id
    WHERE m.reference = ${reference}
    LIMIT 1
  `

  if (!missions.length) return null

  const compartments = await sql`
    SELECT
      compartment_number AS "compartmentNumber",
      product,
      declared_volume_liters AS "declaredVolumeLiters",
      telemetry_volume_liters AS "telemetryVolumeLiters",
      received_volume_liters AS "receivedVolumeLiters"
    FROM mission_compartments
    WHERE mission_id = ${missions[0].id}
    ORDER BY compartment_number
  `

  const events = await sql`
    SELECT
      event_type AS "eventType",
      event_at AS "eventAt",
      volume_liters AS "volumeLiters",
      actor_name AS "actorName",
      details
    FROM mission_events
    WHERE mission_id = ${missions[0].id}
    ORDER BY event_at DESC
    LIMIT 25
  `

  const { id: _id, ...mission } = missions[0]
  return { ...mission, compartments, events }
}

async function updateMission(reference: string, body: MissionUpdate) {
  const sql = getSql()
  const missions = await sql`SELECT id FROM missions WHERE reference = ${reference} LIMIT 1`
  if (!missions.length) return null
  const missionId = missions[0].id

  if (body.receivedVolumes) {
    if (
      body.receivedVolumes.length < 1 ||
      body.receivedVolumes.length > 50 ||
      body.receivedVolumes.some((volume) => !Number.isInteger(volume) || volume < 0 || volume > 100_000)
    ) {
      throw new Error('INVALID_VOLUMES')
    }

    const compartments = await sql`
      SELECT compartment_number AS "compartmentNumber"
      FROM mission_compartments
      WHERE mission_id = ${missionId}
      ORDER BY compartment_number
    `

    if (compartments.length !== body.receivedVolumes.length) {
      throw new Error('INVALID_VOLUMES')
    }

    for (let index = 0; index < body.receivedVolumes.length; index += 1) {
      await sql`
        UPDATE mission_compartments
        SET received_volume_liters = ${body.receivedVolumes[index]}
        WHERE mission_id = ${missionId}
          AND compartment_number = ${compartments[index].compartmentNumber}
      `
    }

    await sql`
      UPDATE missions
      SET received_volume_liters = (
        SELECT COALESCE(sum(received_volume_liters), 0)::integer
        FROM mission_compartments
        WHERE mission_id = ${missionId}
      )
      WHERE id = ${missionId}
    `
  }

  if (body.status) {
    if (!allowedStatuses.has(body.status)) throw new Error('INVALID_STATUS')

    await sql.query(
      `UPDATE missions
       SET status = $1::mission_status,
           completed_at = CASE WHEN $1 = 'completed' THEN now() ELSE completed_at END
       WHERE id = $2`,
      [body.status, missionId],
    )

    await sql`
      INSERT INTO mission_events (mission_id, event_type, actor_name, details)
      VALUES (
        ${missionId},
        ${`status.${body.status}`},
        ${body.actorName?.slice(0, 120) || 'Utilisateur prototype'},
        ${JSON.stringify({ source: 'profuel-web' })}::jsonb
      )
    `
  }

  return findMission(reference)
}

export default async function handler(request: Request) {
  const reference = new URL(request.url).searchParams.get('reference')

  if (!validReference(reference)) {
    return json({ ok: false, message: 'Référence de mission invalide.' }, { status: 400 })
  }

  try {
    if (request.method === 'GET') {
      const mission = await findMission(reference)
      return mission
        ? json({ ok: true, mission })
        : json({ ok: false, message: 'Mission introuvable.' }, { status: 404 })
    }

    if (request.method === 'PATCH') {
      const body = await request.json() as MissionUpdate
      const mission = await updateMission(reference, body)
      return mission
        ? json({ ok: true, mission })
        : json({ ok: false, message: 'Mission introuvable.' }, { status: 404 })
    }

    return json({ ok: false, message: 'Méthode non autorisée.' }, { status: 405 })
  } catch (error) {
    if (error instanceof Error && ['INVALID_STATUS', 'INVALID_VOLUMES'].includes(error.message)) {
      return json({ ok: false, message: 'Données de mission invalides.' }, { status: 400 })
    }
    return databaseError(error)
  }
}
