import type { AttemptItemSnapshot } from '../data/AttemptRepository'
import { ChoiceList } from './ChoiceList'
import { DocumentPanel } from './DocumentPanel'
import type { ExamMode, ExamMedia } from '../domain/types'
import { ListeningPlayer } from './ListeningPlayer'
import { AudioPreloader } from './AudioPreloader'

function promptText(prompt: AttemptItemSnapshot['prompt']) {
  if (typeof prompt === 'string') return prompt
  if (prompt && typeof prompt === 'object' && !Array.isArray(prompt) && typeof prompt.text === 'string') return prompt.text
  return ''
}

export function QuestionRenderer({ item, mode, attemptId, nextAudio, selectedId, onSelect, onListeningStateChange }: {
  item: AttemptItemSnapshot
  mode: ExamMode
  attemptId: string
  nextAudio?: ExamMedia
  selectedId: string | null
  onSelect: (choiceId: string) => void
  onListeningStateChange?: Parameters<typeof ListeningPlayer>[0]['onStateChange']
}) {
  const images = item.media.filter((asset) => asset.kind === 'image')
  const audio = item.media.filter((asset) => asset.kind === 'audio')
  return (
    <div className={`question-renderer part-${item.part}`}>
      {(item.part === 6 || item.part === 7) && <DocumentPanel prompt={item.prompt} />}
      <section className="question-stage" aria-labelledby="question-prompt">
        {images.map((asset) => <img key={asset.id} className="question-image" src={asset.storagePath} alt="Question visual" />)}
        {audio[0] && <ListeningPlayer
          key={audio[0].id}
          mode={mode}
          attemptId={attemptId}
          asset={{ id: audio[0].id, url: audio[0].storagePath }}
          unlockAt={item.part === 3 || item.part === 4 ? 'cue' : 'ended'}
          cueSeconds={typeof audio[0].metadata === 'object' && audio[0].metadata && !Array.isArray(audio[0].metadata)
            && typeof audio[0].metadata.unlockCueSeconds === 'number' ? audio[0].metadata.unlockCueSeconds : undefined}
          onStateChange={onListeningStateChange}
        />}
        <AudioPreloader assets={nextAudio ? [{ id: nextAudio.id, url: nextAudio.storagePath }] : []} />
        <h1 id="question-prompt">{promptText(item.prompt)}</h1>
        <ChoiceList choices={item.choices} selectedId={selectedId} onSelect={onSelect} />
      </section>
    </div>
  )
}
