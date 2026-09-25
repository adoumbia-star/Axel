import { neon } from '@neondatabase/serverless'

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL_MISSING')
  }

  return neon(databaseUrl)
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      'cache-control': 'no-store',
      ...init?.headers,
    },
  })
}

export function databaseError(error: unknown) {
  if (error instanceof Error && error.message === 'DATABASE_URL_MISSING') {
    return json(
      {
        ok: false,
        code: 'database_not_configured',
        message: "La variable DATABASE_URL n'est pas configurée dans Vercel.",
      },
      { status: 503 },
    )
  }

  console.error(error)

  return json(
    {
      ok: false,
      code: 'database_error',
      message: 'La base Neon est momentanément indisponible.',
    },
    { status: 500 },
  )
}
