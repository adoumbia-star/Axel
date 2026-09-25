import { neon } from '@neondatabase/serverless'
import type { ApiResponse } from './http.ts'

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL_MISSING')
  }

  return neon(databaseUrl)
}

export function json(response: ApiResponse, status: number, data: unknown) {
  response.setHeader('cache-control', 'no-store')
  return response.status(status).json(data)
}

export function databaseError(response: ApiResponse, error: unknown) {
  if (error instanceof Error && error.message === 'DATABASE_URL_MISSING') {
    return json(
      response,
      503,
      {
        ok: false,
        code: 'database_not_configured',
        message: "La variable DATABASE_URL n'est pas configurée dans Vercel.",
      },
    )
  }

  console.error(error)

  return json(
    response,
    500,
    {
      ok: false,
      code: 'database_error',
      message: 'La base Neon est momentanément indisponible.',
    },
  )
}
