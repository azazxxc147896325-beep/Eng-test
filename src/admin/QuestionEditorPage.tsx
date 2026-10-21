import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContentRepository, EditorChoice, EditorDraft } from './contentRepository'

export function QuestionEditorPage({ draft, currentUserId, roles, repository }: {
  draft: EditorDraft; currentUserId: string; roles: string[]; repository: ContentRepository
}) {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState(draft.prompt)
  const [choices, setChoices] = useState(draft.choices ?? [])
  const [translations, setTranslations] = useState(draft.translations)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    setPrompt(draft.prompt)
    setChoices(draft.choices ?? [])
    setTranslations(draft.translations)
  }, [draft])
  const own = draft.createdBy === currentUserId
  const staff = roles.includes('reviewer') || roles.includes('admin')
  const editable = own && draft.status === 'draft'
  const updateChoice = (id: string, change: Partial<EditorChoice>) => setChoices((items) => items.map((choice) => choice.id === id ? { ...choice, ...change } : choice))
  const chooseCorrect = (id: string) => setChoices((items) => items.map((choice) => ({ ...choice, correct: choice.id === id })))
  const updateTranslation = (locale: 'th' | 'en', field: 'promptTranslation' | 'explanation', value: string) => setTranslations((current) => current ? { ...current, [locale]: { ...current[locale], [field]: value } } : current)
  async function save() {
    setError(''); setMessage('')
    const incomplete = !prompt.trim()
      || (choices.length > 0 && (choices.some((choice) => !choice.text.trim()) || choices.filter((choice) => choice.correct).length !== 1))
      || (translations && (!translations.th.explanation.trim() || !translations.en.explanation.trim()))
    if (incomplete) { setError(t('admin.editorIncomplete')); return }
    setSaving(true)
    try { await repository.saveDraft({ ...draft, prompt, choices, translations }); setMessage(t('admin.draftSaved')) }
    catch { setError(t('admin.saveError')) }
    finally { setSaving(false) }
  }
  return <main className="admin-page"><p className="eyebrow">Part {draft.part}</p><h1>{t('admin.editor')}</h1>
    <section className="admin-card admin-editor"><label>{t('admin.question')}<textarea aria-label={t('admin.promptLabel')} value={prompt} disabled={!editable} onChange={(event) => setPrompt(event.target.value)} /></label>
      {choices.length > 0 && <fieldset className="choice-editor"><legend>{t('admin.choices')}</legend>{choices.map((choice) => <div className="choice-editor-row" key={choice.id}><input aria-label={t('admin.correctChoiceLabel', { label: choice.label })} type="radio" name="correct-choice" checked={choice.correct} disabled={!editable} onChange={() => chooseCorrect(choice.id)} /><label>{t('admin.choiceLabel', { label: choice.label })}<input value={choice.text} disabled={!editable} onChange={(event) => updateChoice(choice.id, { text: event.target.value })} /></label></div>)}</fieldset>}
      {translations && <div className="translation-editor"><h2>{t('admin.translations')}</h2><label>{t('admin.promptTranslation')}<textarea value={translations.th.promptTranslation} disabled={!editable} onChange={(event) => updateTranslation('th', 'promptTranslation', event.target.value)} /></label><label>{t('admin.thaiExplanation')}<textarea value={translations.th.explanation} disabled={!editable} onChange={(event) => updateTranslation('th', 'explanation', event.target.value)} /></label><label>{t('admin.englishExplanation')}<textarea value={translations.en.explanation} disabled={!editable} onChange={(event) => updateTranslation('en', 'explanation', event.target.value)} /></label></div>}
      {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <p>{t('admin.status')}: <span className={`status status-${draft.status}`}>{draft.status}</span></p>
      <div className="admin-actions">
        {editable && <button disabled={saving} onClick={() => void save()}>{t('admin.saveDraft')}</button>}
        {own && ['draft', 'checks_passed'].includes(draft.status) && <button onClick={() => void repository.submitForReview(draft.id)}>{t('admin.submitReview')}</button>}
        {!own && staff && draft.status === 'in_review' && <button onClick={() => void repository.approve(draft.id)}>{t('admin.approve')}</button>}
        {roles.includes('admin') && draft.status === 'approved' && <button onClick={() => void repository.publish(draft.id)}>{t('admin.publish')}</button>}
        {roles.includes('admin') && draft.status === 'published' && <button onClick={() => void repository.retire(draft.id)}>{t('admin.retire')}</button>}
      </div>
    </section>
  </main>
}
