import type { ExamChoice } from '../domain/types'

function choiceText(choice: ExamChoice) {
  const content = choice.content
  if (typeof content === 'string') return content
  if (content && typeof content === 'object' && !Array.isArray(content) && typeof content.text === 'string') return content.text
  return choice.label
}

export function ChoiceList({ choices, selectedId, onSelect }: {
  choices: ExamChoice[]
  selectedId: string | null
  onSelect: (choiceId: string) => void
}) {
  return (
    <div className="choice-list" role="radiogroup" aria-label="Answer choices">
      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          role="radio"
          aria-checked={selectedId === choice.id}
          className="exam-choice"
          onClick={() => onSelect(choice.id)}
        >
          <span className="choice-label">{choice.label}</span>
          <span>{choiceText(choice)}</span>
        </button>
      ))}
    </div>
  )
}
