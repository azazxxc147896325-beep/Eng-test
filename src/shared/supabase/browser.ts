import { readPublicEnv } from '../../app/env'
import { createBrowserClient } from './client'

let client: ReturnType<typeof createBrowserClient> | null = null

export function getBrowserClient() {
  client ??= createBrowserClient(readPublicEnv(import.meta.env))
  return client
}
