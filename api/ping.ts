import { neon } from '@neondatabase/serverless'
import { getSql } from './_lib/db.ts'

export default function handler(
  _request: { method?: string },
  response: { status(code: number): typeof response; json(data: unknown): void },
) {
  void neon
  void getSql
  return response.status(200).json({ ok: true, service: 'profuel-api' })
}
