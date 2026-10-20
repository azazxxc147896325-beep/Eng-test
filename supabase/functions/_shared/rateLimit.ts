export type StaffRole = 'user' | 'reviewer' | 'admin'

type UsageClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): { gte(column: string, value: string): Promise<{ data: Array<{ requested_count: number }> | null; error: unknown }> }
    }
  }
}

export class RateLimitError extends Error {}

export async function enforceGenerationQuota(client: UsageClient, userId: string, role: StaffRole, requestedCount: number) {
  const limit = role === 'admin' ? 100 : role === 'reviewer' ? 30 : 0
  const start = new Date(); start.setUTCHours(0, 0, 0, 0)
  const { data, error } = await client.from('ai_generation_usage').select('requested_count')
    .eq('user_id', userId).gte('created_at', start.toISOString())
  if (error) throw error
  const used = (data ?? []).reduce((sum, row) => sum + row.requested_count, 0)
  if (used + requestedCount > limit) throw new RateLimitError('daily_generation_limit')
}
