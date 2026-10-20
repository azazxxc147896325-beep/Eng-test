import { useTranslation } from 'react-i18next'
import type { ReviewItem } from './resultsRepository'

function text(value: ReviewItem['prompt'] | ReviewItem['choices'][number]['content']) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && !Array.isArray(value) && typeof value.text === 'string') return value.text
  return ''
}

export function ReviewQuestion({ item }: { item: ReviewItem }) {
  const { i18n, t } = useTranslation()
  const locale = i18n.language.startsWith('th') ? 'th' : 'en'
  return (
    <article className="review-question">
      <p className="eyebrow">Part {item.part} · {t('results.question', { number: item.ordinal })}</p>
      <h2>{text(item.prompt)}</h2>
      {locale === 'th' && item.promptTranslation && <p className="prompt-translation">{item.promptTranslation}</p>}
      <ul>{item.choices.map((choice) => <li key={choice.id} className={choice.id === item.correctChoiceId ? 'correct' : choice.id === item.selectedChoiceId ? 'incorrect' : ''}>
        <b>{choice.label}</b> {text(choice.content)}
      </li>)}</ul>
      <section className="explanation"><b>{t('results.explanation')}</b><p>{item.explanation[locale] ?? item.explanation.en}</p></section>
      {item.part <= 4 && item.transcript && <details><summary>{t('results.transcript')}</summary><p>{item.transcript}</p></details>}
    </article>
  )
}
