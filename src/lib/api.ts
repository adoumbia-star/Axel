export type DatabaseStatus = 'checking' | 'connected' | 'demo'

type MissionPayload = {
  status?: string
  receivedVolumes?: number[]
  actorName?: string
}

const isOfflineFile = window.location.protocol === 'file:'

async function apiFetch(path: string, init?: RequestInit) {
  if (isOfflineFile) throw new Error('OFFLINE_DEMO')

  const response = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API_${response.status}`)
  }

  return response.json()
}

export async function checkDatabase(): Promise<DatabaseStatus> {
  try {
    const result = await apiFetch('/api/health')
    return result.ok ? 'connected' : 'demo'
  } catch {
    return 'demo'
  }
}

export async function loadMission(reference: string) {
  const result = await apiFetch(`/api/mission?reference=${encodeURIComponent(reference)}`)
  return result.mission
}

export async function saveMission(reference: string, payload: MissionPayload) {
  const result = await apiFetch(`/api/mission?reference=${encodeURIComponent(reference)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return result.mission
}

export async function savePumpReading(input: {
  pumpCode: string
  product: string
  indexLiters: number
  readingType: 'opening' | 'closing'
}) {
  return apiFetch('/api/pump-readings', {
    method: 'POST',
    body: JSON.stringify({
      stationCode: 'ABJ-COC',
      actorName: 'Koffi N’Guessan',
      ...input,
    }),
  })
}
