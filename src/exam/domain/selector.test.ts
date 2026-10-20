import { describe, expect, it } from 'vitest'
import { FULL_BLUEPRINT, QUICK_BLUEPRINT } from './blueprints'
import { buildQuestionFixtures } from './__fixtures__/questions'
import { buildSelection, InsufficientQuestionPoolError } from './selector'

const ids = (selection: ReturnType<typeof buildSelection>) =>
  selection.flatMap((group) => group.questions.map((question) => question.questionVersionId))

const countByPart = (selection: ReturnType<typeof buildSelection>) =>
  Object.fromEntries(selection.map((group) => group.part).filter((part, index, parts) => parts.indexOf(part) === index)
    .map((part) => [part, selection.filter((group) => group.part === part)
      .reduce((total, group) => total + group.questions.length, 0)]))

describe('buildSelection', () => {
  it('is deterministic, isolates Parts, and keeps every group whole', () => {
    const candidates = buildQuestionFixtures(2)
    const first = buildSelection(FULL_BLUEPRINT, candidates, { groupIds: [], questionVersionIds: [] }, 'same-seed')
    const second = buildSelection(FULL_BLUEPRINT, candidates, { groupIds: [], questionVersionIds: [] }, 'same-seed')

    expect(ids(first)).toEqual(ids(second))
    expect(countByPart(first)).toEqual({ 1: 6, 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 })
    expect(first.every((selected) => {
      const source = candidates.find((candidate) => candidate.id === selected.id)
      return source?.questions.length === selected.questions.length
    })).toBe(true)
  })

  it('excludes recent history and does not shuffle order-sensitive choices', () => {
    const candidates = buildQuestionFixtures(2)
    const blocked = candidates.filter((group) => group.id.endsWith('-set-1'))
    const selected = buildSelection(FULL_BLUEPRINT, candidates, {
      groupIds: blocked.map((group) => group.id),
      questionVersionIds: [],
    }, 'history-seed')

    expect(selected.some((group) => blocked.some((item) => item.id === group.id))).toBe(false)
    const fixed = selected.flatMap((group) => group.questions).find((question) => !question.choiceShuffleAllowed)
    expect(fixed?.choices.map((choice) => choice.id)).toEqual(fixed?.choiceOrder)
  })

  it('reports deficient blueprint slots instead of silently changing counts', () => {
    const candidates = buildQuestionFixtures(1).filter((group) => group.part !== 7)

    expect(() => buildSelection(FULL_BLUEPRINT, candidates, { groupIds: [], questionVersionIds: [] }, 'seed'))
      .toThrowError(InsufficientQuestionPoolError)
    try {
      buildSelection(FULL_BLUEPRINT, candidates, { groupIds: [], questionVersionIds: [] }, 'seed')
    } catch (error) {
      expect((error as InsufficientQuestionPoolError).deficientSlots).toContainEqual(
        expect.objectContaining({ part: 7, required: 54, available: 0 }),
      )
    }
  })

  it('builds the 50-question Quick blueprint without splitting passage groups', () => {
    const candidates = buildQuestionFixtures(1)
    const selected = buildSelection(QUICK_BLUEPRINT, candidates, { groupIds: [], questionVersionIds: [] }, 'quick')

    expect(ids(selected)).toHaveLength(50)
    expect(countByPart(selected)).toEqual({ 1: 1, 2: 6, 3: 9, 4: 9, 5: 8, 6: 4, 7: 13 })
  })
})
