import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContentDraft } from './contentSchema'
import { getBrowserClient } from '../shared/supabase/browser'
import type { Json } from '../shared/supabase/database.types'

export type GeneratedDraft = { status: 'draft'; content: ContentDraft }
type GenerateInput = { part: number; count: number; difficulty: 'easy' | 'medium' | 'hard'; skills: string[]; topic: string }
type Props = { generate?: (input: GenerateInput) => Promise<GeneratedDraft[]>; saveDraft?: (draft: ContentDraft) => Promise<unknown> }

function contentText(value: unknown) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'text' in value && typeof value.text === 'string') return value.text
  return JSON.stringify(value, null, 2)
}

async function generateWithCloud(input: GenerateInput) {
  const { data, error } = await getBrowserClient().functions.invoke('generate-question', { body: input })
  if (error) throw error
  return (data as { drafts: GeneratedDraft[] }).drafts
}

async function saveWithCloud(draft: ContentDraft) {
  const { error } = await getBrowserClient().rpc('save_generated_content_draft', { p_draft: draft as Json })
  if (error) throw error
}

export function GenerateQuestionsPanel({ generate = generateWithCloud, saveDraft = saveWithCloud }: Props) {
  const { t } = useTranslation(); const [part, setPart] = useState(5); const [count, setCount] = useState(1)
  const [difficulty, setDifficulty] = useState<GenerateInput['difficulty']>('medium')
  const [topic, setTopic] = useState('office communication'); const [drafts, setDrafts] = useState<GeneratedDraft[]>([])
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function onGenerate() {
    setBusy(true); setMessage('')
    try { setDrafts(await generate({ part, count, difficulty, skills: [], topic })) } catch { setMessage(t('admin.generateError')) } finally { setBusy(false) }
  }
  async function onSave(draft: ContentDraft) {
    setBusy(true); setMessage('')
    try { await saveDraft(draft); setMessage(t('admin.draftSaved')) } catch { setMessage(t('admin.saveError')) } finally { setBusy(false) }
  }
  return <main className="admin-page"><h1>{t('admin.generate')}</h1><p>{t('admin.generateHint')}</p>
    <div className="admin-form">
      <label>Part <select value={part} onChange={(event) => setPart(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6, 7].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>{t('admin.count')} <input type="number" min="1" max="10" value={count} onChange={(event) => setCount(Number(event.target.value))} /></label>
      <label>{t('admin.difficulty')} <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as GenerateInput['difficulty'])}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
      <label>{t('admin.topic')} <input value={topic} onChange={(event) => setTopic(event.target.value)} /></label>
      <button disabled={busy} onClick={onGenerate}>{t('admin.generatePreview')}</button>
    </div>
    {message && <p role="status">{message}</p>}
    <section className="admin-grid">{drafts.map((draft, index) => <article className="admin-card" key={`${draft.content.groupId}-${index}`}>
      <h2>Part {draft.content.part} · {draft.status}</h2>
      <p>{draft.content.groupType} · {draft.content.difficulty}</p>
      <div className="draft-preview">{draft.content.questions.map((question, questionIndex) => <section className="draft-question" key={question.id}>
        <h3>{t('admin.question')} {questionIndex + 1}</h3>
        <p className="draft-prompt">{contentText(question.prompt)}</p>
        <ul className="draft-choices" aria-label={t('admin.choices')}>
          {question.choices.map((choice) => <li
            aria-label={choice.correct ? `${t('admin.correctAnswer')}: ${choice.label}. ${contentText(choice.content)}` : undefined}
            className={choice.correct ? 'correct-choice' : undefined}
            key={choice.id}
          >{choice.label}. {contentText(choice.content)}{choice.correct && <strong> — {t('admin.correctAnswer')}</strong>}</li>)}
        </ul>
        {question.translations.th.promptTranslation && <p><strong>{t('admin.promptTranslation')}:</strong> {question.translations.th.promptTranslation}</p>}
        <div className="draft-explanations">
          <p><strong>{t('admin.thaiExplanation')}:</strong> {question.translations.th.explanation}</p>
          <p><strong>{t('admin.englishExplanation')}:</strong> {question.translations.en.explanation}</p>
        </div>
      </section>)}</div>
      <button disabled={busy} onClick={() => onSave(draft.content)}>{t('admin.saveDraft')}</button>
    </article>)}</section>
  </main>
}
