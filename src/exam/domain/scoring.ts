import { SCORE_TABLES, type ScoringVersion } from './scoreTables'
import type { ExamMode, Part } from './types'

export type ScoreAnswer = { part: Part; correct: boolean; skillTags?: string[] }
export type PartScore = { part: Part; correct: number; total: number; accuracy: number }
export type ScoreResult = {
  mode: ExamMode
  scoringVersion: ScoringVersion
  section: { listening: number | null; reading: number | null }
  total: number | null
  range: { min: number; max: number; confidence: 'low' } | null
  accuracy: number
  parts: PartScore[]
  skills: Record<string, { correct: number; total: number; accuracy: number }>
  weakParts: Part[]
}

const percent = (correct: number, total: number) => total ? Math.round((correct / total) * 100) : 0

export function scoreAttempt(
  input: { mode: ExamMode; answers: ScoreAnswer[] },
  scoringVersion: ScoringVersion,
): ScoreResult {
  const table = SCORE_TABLES[scoringVersion]
  const byPart = new Map<Part, { correct: number; total: number }>()
  const bySkill = new Map<string, { correct: number; total: number }>()

  for (const answer of input.answers) {
    const part = byPart.get(answer.part) ?? { correct: 0, total: 0 }
    part.total += 1
    if (answer.correct) part.correct += 1
    byPart.set(answer.part, part)
    for (const skill of answer.skillTags ?? []) {
      const value = bySkill.get(skill) ?? { correct: 0, total: 0 }
      value.total += 1
      if (answer.correct) value.correct += 1
      bySkill.set(skill, value)
    }
  }

  const listeningAnswers = input.answers.filter((answer) => answer.part <= 4)
  const readingAnswers = input.answers.filter((answer) => answer.part >= 5)
  const listeningPercent = percent(listeningAnswers.filter((answer) => answer.correct).length, listeningAnswers.length)
  const readingPercent = percent(readingAnswers.filter((answer) => answer.correct).length, readingAnswers.length)
  const listening = listeningAnswers.length ? table.listening[listeningPercent] : null
  const reading = readingAnswers.length ? table.reading[readingPercent] : null
  const estimatedTotal = (listening ?? 5) + (reading ?? 5)
  const accuracy = percent(input.answers.filter((answer) => answer.correct).length, input.answers.length)
  const parts = [...byPart.entries()].sort(([left], [right]) => left - right).map(([part, value]) => ({
    part, ...value, accuracy: percent(value.correct, value.total),
  }))
  const skills = Object.fromEntries([...bySkill.entries()].map(([skill, value]) => [skill, {
    ...value, accuracy: percent(value.correct, value.total),
  }]))
  const weakParts = parts.filter((part) => part.accuracy < 70).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3).map((part) => part.part)

  return {
    mode: input.mode,
    scoringVersion,
    section: input.mode === 'practice' ? { listening: null, reading: null } : { listening, reading },
    total: input.mode === 'full' ? estimatedTotal : null,
    range: input.mode === 'quick'
      ? { min: Math.max(10, estimatedTotal - 80), max: Math.min(990, estimatedTotal + 80), confidence: 'low' }
      : null,
    accuracy,
    parts,
    skills,
    weakParts,
  }
}
