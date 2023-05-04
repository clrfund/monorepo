import { createI18n } from 'vue-i18n'
import cn from '@/locales/cn.json'
import en from '@/locales/en.json'
import it from '@/locales/it.json'

const defaultLocale = import.meta.env.VITE_I18N_LOCALE || 'en'
export const languages = [
  { locale: 'it', emoji: '🇮🇹', description: 'Italiana' },
  { locale: 'en', emoji: '🇺🇸', description: 'English' },
  { locale: 'cn', emoji: '🇨🇳', description: '简体中文' },
  /*
  // comment out as we don't have the translations for these yet
  { locale: 'es', emoji: '🇪🇸', description: 'Español'  },
  { locale: 'tw', emoji: '🇹🇼', description: '繁體中文' },
   */
]

const supportedLocales = languages.map(entry => entry.locale)
export function isLocaleSupported(locale) {
  return supportedLocales.includes(locale)
}

type MessageSchema = typeof en
const i18n = createI18n<[MessageSchema], 'it' | 'cn' | 'en'>({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  globalInjection: true,
  messages: {
    it,
    cn,
    en,
  },
})

export default i18n
