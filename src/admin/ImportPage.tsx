import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ContentDraft } from './contentSchema'
import { parseImportText, spreadsheetRowsToDrafts } from './importParser'
import { getBrowserClient } from '../shared/supabase/browser'
import type { Json } from '../shared/supabase/database.types'
import { createQuestionTemplate, part5CsvTemplate, textDownloadUrl } from './contentTemplates'

type Part = 1 | 2 | 3 | 4 | 5 | 6 | 7

async function saveWithCloud(drafts: ContentDraft[]) { const { error } = await getBrowserClient().rpc('save_content_drafts', { p_drafts: drafts as Json }); if (error) throw error }

export function ImportPage({ saveDrafts = saveWithCloud }: { saveDrafts?: (drafts: ContentDraft[]) => Promise<unknown> }) {
  const { t } = useTranslation(); const [text, setText] = useState(''); const [message, setMessage] = useState(''); const [drafts, setDrafts] = useState<ContentDraft[]>([]); const [busy, setBusy] = useState(false); const [templatePart, setTemplatePart] = useState<Part>(5)
  const templateJson = JSON.stringify(createQuestionTemplate(templatePart), null, 2)
  function validate() {
    if (text.length > 5_000_000) { setDrafts([]); setMessage(t('admin.fileTooLarge')); return }
    try { const parsed = parseImportText(text, text.trim().startsWith('[') ? 'json' : 'jsonl'); setDrafts(parsed); setMessage(parsed.length ? t('admin.valid') : t('admin.invalid')) } catch (error) { setDrafts([]); setMessage(`${t('admin.invalid')}: ${(error as Error).message}`) }
  }
  async function chooseFile(file?: File) { if (!file) return; if (file.size > 5_000_000) { setMessage(t('admin.fileTooLarge')); return } try { const extension = file.name.split('.').pop()?.toLowerCase(); if (!extension || !['xlsx', 'csv', 'json', 'jsonl'].includes(extension)) throw new Error(t('admin.unsupportedFile')); const parsed = extension === 'xlsx' ? spreadsheetRowsToDrafts(await (await import('read-excel-file')).default(file) as unknown[][]) : parseImportText(await file.text(), extension as 'csv' | 'json' | 'jsonl'); setDrafts(parsed); setMessage(`${t('admin.valid')} ${parsed.length}`) } catch (error) { setDrafts([]); setMessage(`${t('admin.invalid')}: ${(error as Error).message}`) } }
  async function saveAll() { setBusy(true); try { await saveDrafts(drafts); setMessage(t('admin.savedCount', { count: drafts.length })); setDrafts([]) } catch { setMessage(t('admin.saveError')) } finally { setBusy(false) } }
  return <main className="admin-page"><header className="admin-heading"><div><h1>{t('admin.import')}</h1><p>{t('admin.importHint')}</p></div></header>
    <section className="admin-card template-card"><div><h2>{t('admin.templates')}</h2><p className="admin-note">{t('admin.templateHint')}</p></div><div className="template-actions"><label>{t('admin.templatePart')}<select aria-label="Template Part" value={templatePart} onChange={(event) => setTemplatePart(Number(event.target.value) as Part)}>{[1, 2, 3, 4, 5, 6, 7].map((part) => <option key={part} value={part}>Part {part}</option>)}</select></label><button type="button" onClick={() => { setText(templateJson); setMessage(t('admin.exampleLoaded')) }}>{t('admin.useExample')}</button><a href={textDownloadUrl(templateJson, 'application/json')} download={`score-quest-part-${templatePart}-template.json`}>{t('admin.downloadJson')}</a>{templatePart === 5 && <a href={textDownloadUrl(part5CsvTemplate, 'text/csv')} download="score-quest-part-5-template.csv">{t('admin.downloadCsv')}</a>}</div><p className="admin-note">{t(`admin.partGuide.${templatePart}`)}</p></section>
    <section className="admin-card import-card"><label className="dropzone">⇧<strong>{t('admin.chooseFile')}</strong><span>{t('admin.fileSupport')}</span><input aria-label={t('admin.chooseFile')} type="file" accept=".xlsx,.csv,.json,.jsonl" onChange={(event) => void chooseFile(event.target.files?.[0])} /></label><p className="admin-note">{t('admin.rightsNote')}</p></section>
    <details className="admin-card" open><summary>{t('admin.manualPaste')}</summary><textarea maxLength={5_000_000} value={text} onChange={(event) => setText(event.target.value)} aria-label="JSONL" /><button onClick={validate}>{t('admin.validate')}</button></details>
    {message && <p role="status">{message}</p>}{drafts.length > 0 && <section className="admin-card"><h2>{t('admin.preview', { count: drafts.length })}</h2>{drafts.slice(0, 5).map((draft) => <p key={draft.groupId}><strong>Part {draft.part}</strong> · {draft.difficulty} · {draft.questions.length} {t('admin.question')}</p>)}<button disabled={busy} onClick={() => void saveAll()}>{t('admin.saveAll')}</button></section>}
  </main>
}
