import type { IncomingMessage, ServerResponse } from 'node:http'

export type ApiRequest = IncomingMessage & {
  body?: unknown
  query?: Record<string, string | string[]>
}

export type ApiResponse = ServerResponse & {
  status(code: number): ApiResponse
  json(data: unknown): void
}

export function parseJsonBody<T>(request: ApiRequest): T {
  if (typeof request.body === 'string') return JSON.parse(request.body) as T
  return (request.body ?? {}) as T
}
