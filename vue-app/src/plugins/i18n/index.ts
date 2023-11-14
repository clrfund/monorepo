import { createI18n } from 'vue-i18n'
import cn from '@/locales/cn.json'
import en from '@/locales/en.json'
import it from '@/locales/it.json'
import es from '@/locales/es.json'

const defaultLocale = import.meta.env.VITE_I18N_LOCALE || 'en'
export const languages = [
  { locale: 'it', emoji: '🇮🇹', description: 'Italiano' },
  { locale: 'en', emoji: '🇺🇸', description: 'English' },
  { locale: 'es', emoji: '🇪🇸', description: 'Español' },
  { locale: 'zh-CN', emoji: '🇨🇳', description: '简体中文' },
  /*
  // comment out as we don't have the translations for these yet
  { locale: 'tw', emoji: '🇹🇼', description: '繁體中文' },
   */
]

const defaultShortDateTimeFormat = {
  short: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
}

const supportedLocales = languages.map(entry => entry.locale)
export function isLocaleSupported(locale) {
  return supportedLocales.includes(locale)
}

type MessageSchema = typeof en
const i18n = createI18n<[MessageSchema], 'it' | 'zh-CN' | 'es' | 'en'>({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  globalInjection: true,
  datetimeFormats: {
    it: defaultShortDateTimeFormat,
    'zh-CN': defaultShortDateTimeFormat,
    es: defaultShortDateTimeFormat,
    en: defaultShortDateTimeFormat,
  },
  messages: {
    it,
    'zh-CN': cn,
    es,
    en,
  },
})

export default i18n
