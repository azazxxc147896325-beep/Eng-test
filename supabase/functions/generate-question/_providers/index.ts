import { GeminiQuestionProvider } from './gemini.ts'
import type { AIQuestionProvider } from './types.ts'

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

export function createQuestionProvider(): AIQuestionProvider {
  return new GeminiQuestionProvider({
    apiKey: requiredEnv('GEMINI_API_KEY'),
    model: Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite',
  })
}
