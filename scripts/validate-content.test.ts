import { describe, expect, it } from 'vitest'
import { validateContentText } from './validate-content'

describe('validateContentText', () => {
  it('returns row, group id, field path, and an actionable error', () => {
    const result = validateContentText('{"groupId":"broken","part":3,"questions":[]}\n', 'jsonl')

    expect(result.valid).toBe(false)
    expect(result.errors[0]).toEqual(expect.objectContaining({ row: 1, groupId: 'broken' }))
    expect(result.errors.some((error) => error.path.includes('questions') && error.message.length > 5)).toBe(true)
  })
})
