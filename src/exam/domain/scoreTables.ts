function buildInternalEstimateTable() {
  return Array.from({ length: 101 }, (_, raw) => {
    const estimate = Math.round((5 + (raw / 100) * 490) / 5) * 5
    return Math.min(495, Math.max(5, estimate))
  })
}

// Score Quest estimate tables. These are not ETS conversion tables.
export const LISTENING_ESTIMATE_SQ_V1 = buildInternalEstimateTable()
export const READING_ESTIMATE_SQ_V1 = buildInternalEstimateTable()

export const SCORE_TABLES = {
  'sq-v1': {
    listening: LISTENING_ESTIMATE_SQ_V1,
    reading: READING_ESTIMATE_SQ_V1,
  },
} as const

export type ScoringVersion = keyof typeof SCORE_TABLES
