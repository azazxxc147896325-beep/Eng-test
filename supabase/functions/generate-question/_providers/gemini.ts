import { buildGenerationPrompt } from '../prompts/system.ts'
import type { AIQuestionProvider, ContentDraft, GenerateQuestionRequest } from './types.ts'

type GeminiOptions = { apiKey: string; model: string; fetcher?: typeof fetch }

function responseSchema(request: GenerateQuestionRequest) {
  const questionCounts: Record<number, [number, number]> = {
    1: [1, 1], 2: [1, 1], 3: [3, 3], 4: [3, 3], 5: [1, 1], 6: [4, 4], 7: [2, 5],
  }
  const groupTypes: Record<number, string[]> = {
    1: ['photo'], 2: ['question_response'], 3: ['conversation'], 4: ['talk'],
    5: ['single_question'], 6: ['text_completion'], 7: ['single_document', 'double_document', 'triple_document'],
  }
  const [minimumQuestions, maximumQuestions] = questionCounts[request.part]
  const translationProperties: Record<string, unknown> = {
    explanation: { type: 'string', minLength: 1 },
    promptTranslation: { type: 'string' },
  }
  const translationRequired = ['explanation']
  if (request.part <= 4) {
    translationProperties.transcript = { type: 'string', minLength: 1 }
    translationRequired.push('transcript')
  }
  const translation = { type: 'object', properties: translationProperties, required: translationRequired }
  const choiceCount = request.part === 2 ? 3 : 4
  return {
    type: 'array', minItems: request.count, maxItems: request.count,
    items: {
      type: 'object',
      properties: {
        groupId: { type: 'string', minLength: 1 },
        part: { type: 'integer', enum: [request.part] },
        groupType: { type: 'string', enum: groupTypes[request.part] },
        difficulty: { type: 'string', enum: [request.difficulty] },
        media: { type: 'array', maxItems: 0, items: { type: 'object' } },
        questions: {
          type: 'array', minItems: minimumQuestions, maxItems: maximumQuestions,
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', minLength: 1 },
              prompt: { type: 'object', properties: { text: { type: 'string', minLength: 1 } }, required: ['text'] },
              choiceShuffleAllowed: { type: 'boolean' },
              choices: {
                type: 'array', minItems: choiceCount, maxItems: choiceCount,
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', minLength: 1 }, label: { type: 'string', minLength: 1 },
                    content: { type: 'object', properties: { text: { type: 'string', minLength: 1 } }, required: ['text'] },
                    correct: { type: 'boolean' },
                  },
                  required: ['id', 'label', 'content', 'correct'],
                },
              },
              translations: {
                type: 'object', properties: { th: translation, en: translation }, required: ['th', 'en'],
              },
            },
            required: ['id', 'prompt', 'choiceShuffleAllowed', 'choices', 'translations'],
          },
        },
      },
      required: ['groupId', 'part', 'groupType', 'difficulty', 'media', 'questions'],
    },
  }
}

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
          generationConfig: {
            responseFormat: { text: { mimeType: 'application/json', schema: responseSchema(request) } },
            temperature: 0.8,
          },
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
