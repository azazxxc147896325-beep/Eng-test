import { createSeededRandom, shuffled } from './random'
import type { BlueprintSlot, CandidateGroup, ExamBlueprint, SelectedGroup, SelectionHistory } from './types'

export type DeficientSlot = Pick<BlueprintSlot, 'part' | 'questionCount'> & {
  required: number
  available: number
}

export class InsufficientQuestionPoolError extends Error {
  readonly deficientSlots: DeficientSlot[]

  constructor(deficientSlots: DeficientSlot[]) {
    super(`Insufficient question pool for Part ${deficientSlots.map((slot) => slot.part).join(', ')}`)
    this.name = 'InsufficientQuestionPoolError'
    this.deficientSlots = deficientSlots
  }
}

function chooseWholeGroups(groups: CandidateGroup[], target: number): CandidateGroup[] | null {
  const memo = new Set<string>()
  function visit(index: number, remaining: number): CandidateGroup[] | null {
    if (remaining === 0) return []
    if (remaining < 0 || index >= groups.length) return null
    const key = `${index}:${remaining}`
    if (memo.has(key)) return null

    const withCurrent = visit(index + 1, remaining - groups[index].questions.length)
    if (withCurrent) return [groups[index], ...withCurrent]
    const withoutCurrent = visit(index + 1, remaining)
    if (withoutCurrent) return withoutCurrent

    memo.add(key)
    return null
  }
  return visit(0, target)
}

export function buildSelection(
  blueprint: ExamBlueprint,
  candidates: readonly CandidateGroup[],
  history: SelectionHistory,
  seed: string,
): SelectedGroup[] {
  const random = createSeededRandom(seed)
  const blockedGroups = new Set(history.groupIds)
  const blockedQuestions = new Set(history.questionVersionIds)
  const eligible = candidates.filter((group) =>
    !blockedGroups.has(group.id)
    && group.questions.every((question) => !blockedQuestions.has(question.questionVersionId)),
  )

  const selectedBySlot = blueprint.slots.map((slot) => {
    const pool = shuffled(eligible.filter((group) =>
      group.part === slot.part && (!slot.difficulty || group.difficulty === slot.difficulty)), random)
    const selected = chooseWholeGroups(pool, slot.questionCount)
    return { slot, pool, selected }
  })

  const deficientSlots = selectedBySlot
    .filter(({ selected }) => !selected)
    .map(({ slot, pool }) => ({
      part: slot.part,
      questionCount: slot.questionCount,
      required: slot.questionCount,
      available: pool.reduce((sum, group) => sum + group.questions.length, 0),
    }))

  if (deficientSlots.length) throw new InsufficientQuestionPoolError(deficientSlots)

  return selectedBySlot.flatMap(({ selected }) => selected ?? []).map((group) => ({
    ...group,
    questions: group.questions.map((question) => {
      const choices = question.choiceShuffleAllowed ? shuffled(question.choices, random) : [...question.choices]
      return { ...question, choices, choiceOrder: choices.map((choice) => choice.id) }
    }),
  }))
}
