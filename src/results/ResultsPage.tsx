import type { ScoreResult } from '../exam/domain/scoring'
import { PartBreakdown } from './PartBreakdown'
import { ScoreSummary } from './ScoreSummary'

export function ResultsPage({ result }: { result: ScoreResult }) {
  return <main className="page results-page"><ScoreSummary result={result} /><PartBreakdown result={result} /></main>
}
