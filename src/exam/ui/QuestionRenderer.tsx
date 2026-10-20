import type { AttemptItemSnapshot } from '../data/AttemptRepository'
import { ChoiceList } from './ChoiceList'
import { DocumentPanel } from './DocumentPanel'

function promptText(prompt: AttemptItemSnapshot['prompt']) {
  if (typeof prompt === 'string') return prompt
  if (prompt && typeof prompt === 'object' && !Array.isArray(prompt) && typeof prompt.text === 'string') return prompt.text
  return ''
}

export function QuestionRenderer({ item, selectedId, onSelect }: {
  item: AttemptItemSnapshot
  selectedId: string | null
  onSelect: (choiceId: string) => void
}) {
  const images = item.media.filter((asset) => asset.kind === 'image')
  const audio = item.media.filter((asset) => asset.kind === 'audio')
  return (
    <div className={`question-renderer part-${item.part}`}>
      {(item.part === 6 || item.part === 7) && <DocumentPanel prompt={item.prompt} />}
      <section className="question-stage" aria-labelledby="question-prompt">
        {images.map((asset) => <img key={asset.id} className="question-image" src={asset.storagePath} alt="Question visual" />)}
        {audio.map((asset) => <audio key={asset.id} src={asset.storagePath} preload="metadata" />)}
        <h1 id="question-prompt">{promptText(item.prompt)}</h1>
        <ChoiceList choices={item.choices} selectedId={selectedId} onSelect={onSelect} />
      </section>
    </div>
  )
}
