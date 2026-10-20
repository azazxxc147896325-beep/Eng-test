import type { GenerateQuestionRequest } from '../_providers/types.ts'

export function buildGenerationPrompt(request: GenerateQuestionRequest) {
  return `Create ${request.count} original TOEIC-style practice group(s) for Part ${request.part}.
Difficulty: ${request.difficulty}. Skills: ${request.skills.join(', ') || 'general'}. Topic: ${request.topic}.
Use entirely original workplace situations. Never copy, quote, imitate, or reconstruct proprietary ETS/TOEIC questions.
Return JSON only as an array. Each group must contain groupId, part, groupType, difficulty, media, and questions.
Each question needs id, prompt, choiceShuffleAllowed, choices, and Thai/English translations with explanations.
Part 2 has exactly 3 choices; all other Parts have 4. Exactly one choice is correct.
For Parts 1–4 include original transcripts in both translation objects. Media may be empty because audio/image approval happens separately.`
}
