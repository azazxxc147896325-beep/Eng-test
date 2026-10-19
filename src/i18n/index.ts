import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import th from './locales/th.json'

export type Locale = 'th' | 'en'

const storageKey = 'score-quest-locale'
const storedLocale = typeof localStorage === 'undefined' ? null : localStorage.getItem(storageKey)
const initialLocale: Locale = storedLocale === 'en' ? 'en' : 'th'

export const i18n = i18next.createInstance()
void i18n.use(initReactI18next).init({
  resources: { th: { translation: th }, en: { translation: en } },
  lng: initialLocale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export async function setLanguage(locale: Locale): Promise<void> {
  localStorage.setItem(storageKey, locale)
  await i18n.changeLanguage(locale)
}
