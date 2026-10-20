import { buildGenerationPrompt } from '../prompts/system.ts'
import type { AIQuestionProvider, ContentDraft, GenerateQuestionRequest } from './types.ts'

type GeminiOptions = { apiKey: string; model: string; fetcher?: typeof fetch }

export class GeminiQuestionProvider implements AIQuestionProvider {
  private readonly fetcher: typeof fetch
  constructor(private readonly options: GeminiOptions) { this.fetcher = options.fetcher ?? fetch }

  async generate(request: GenerateQuestionRequest): Promise<ContentDraft[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.options.model)}:generateContent`
    const init: RequestInit = {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': this.options.apiKey },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: buildGenerationPrompt(request) }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
        }),
      }
    let response = await this.fetcher(url, init)
    if (response.status === 429 || response.status >= 500) response = await this.fetcher(url, init)
    if (!response.ok) throw new Error(`gemini_${response.status}`)
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('gemini_empty_response')
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error('gemini_invalid_output')
    return parsed as ContentDraft[]
  }
}
