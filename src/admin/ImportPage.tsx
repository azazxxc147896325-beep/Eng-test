import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ContentDraftSchema } from './contentSchema'

export function ImportPage() {
  const { t } = useTranslation(); const [text, setText] = useState(''); const [message, setMessage] = useState('')
  function validate() {
    try {
      const valid = text.split(/\r?\n/).filter(Boolean).every((line) => ContentDraftSchema.safeParse(JSON.parse(line)).success)
      setMessage(valid ? t('admin.valid') : t('admin.invalid'))
    } catch { setMessage(t('admin.invalid')) }
  }
  return <main className="admin-page"><h1>{t('admin.import')}</h1><textarea value={text} onChange={(event) => setText(event.target.value)} aria-label="JSONL" />
    <button onClick={validate}>{t('admin.validate')}</button>
    {message && <p role="status">{message}</p>}
  </main>
}
