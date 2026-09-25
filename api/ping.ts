import { neon } from '@neondatabase/serverless'

export default function handler(
  _request: { method?: string },
  response: { status(code: number): typeof response; json(data: unknown): void },
) {
  void neon
  return response.status(200).json({ ok: true, service: 'profuel-api' })
}
