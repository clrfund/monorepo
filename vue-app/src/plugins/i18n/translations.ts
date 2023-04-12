// refer to https://github.com/bodrovis-learning/Lokalise-source/blob/master/vue-i18n/src/plugins/Translation.js
const languages = {
  tw: { emoji: '🇹🇼', description: '繁體中文' },
  en: { emoji: '🇺🇸', description: 'English' },
  es: { emoji: '🇪🇸', description: 'Español' },
  cn: { emoji: '🇨🇳', description: '简体中文' },
}

export const defaultLocale = import.meta.env.VITE_I18N_LOCALE || 'tw'
export const supportedLocales = ['tw', 'cn', 'en', 'es']

export function isLocaleSupported(locale) {
  return supportedLocales.includes(locale)
}
export function languageDescription(locale: string): string {
  return languages[locale].description || `${locale} not supported`
}
export function languageEmoji(locale: string) {
  return languages[locale].emoji || '🤔'
}
