import { useTranslation } from 'react-i18next'
import { setLanguage, type Locale } from '../../i18n'

export function LanguageSwitch() {
  const { i18n, t } = useTranslation()
  const selected = i18n.resolvedLanguage === 'en' ? 'en' : 'th'
  const choose = (locale: Locale) => void setLanguage(locale)

  return (
    <div className="language-switch" role="group" aria-label={t('language.label')}>
      <button type="button" aria-pressed={selected === 'th'} onClick={() => choose('th')}>TH</button>
      <button type="button" aria-pressed={selected === 'en'} onClick={() => choose('en')}>EN</button>
    </div>
  )
}
