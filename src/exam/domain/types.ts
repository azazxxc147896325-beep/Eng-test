export type Part = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type ExamSection = 'listening' | 'reading' | 'practice'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type ExamMode = 'full' | 'quick' | 'practice'
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type BlueprintSlot = {
  part: Part
  section: ExamSection
  questionCount: number
  difficulty?: Difficulty
}

export type ExamBlueprint = {
  id: string
  mode: ExamMode
  totalQuestions: number
  sections: ReadonlyArray<{ section: ExamSection; durationMinutes?: number }>
  slots: ReadonlyArray<BlueprintSlot>
}

export type ExamChoice = {
  id: string
  label: string
  content: JsonValue
}

export type ExamMedia = {
  id: string
  kind: 'image' | 'audio'
  storagePath: string
  metadata: JsonValue
}

export type CandidateQuestion = {
  questionVersionId: string
  prompt: JsonValue
  choices: ExamChoice[]
  media: ExamMedia[]
  choiceShuffleAllowed: boolean
}

export type CandidateGroup = {
  id: string
  part: Part
  groupType: string
  difficulty: Difficulty
  questions: CandidateQuestion[]
  media: ExamMedia[]
}

export type SelectedQuestion = CandidateQuestion & { choiceOrder: string[] }
export type SelectedGroup = Omit<CandidateGroup, 'questions'> & { questions: SelectedQuestion[] }

export type SelectionHistory = {
  groupIds: readonly string[]
  questionVersionIds: readonly string[]
}
