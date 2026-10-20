export type ResponseMutation = {
  attemptId: string
  attemptItemId: string
  questionVersionId: string
  choiceId: string | null
  marked: boolean
  answeredAt: string
}

export interface ResponseRepository {
  save(response: ResponseMutation): Promise<void>
}
