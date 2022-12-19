// refer to https://github.com/bodrovis-learning/Lokalise-source/blob/master/vue-i18n/src/plugins/Translation.js
const languages = {
	'zh-TW': { emoji: '🇹🇼', description: '繁體中文' },
	en: { emoji: '🇺🇸', description: 'English' },
	es: { emoji: '🇪🇸', description: 'Español' },
	cn: { emoji: '🇨🇳', description: '简体中文' },
}

export const defaultLocale = import.meta.env.VITE_I18N_LOCALE || 'zh-TW'
export const supportedLocales = ['zh-TW', 'en']

export function languageDescription(locale: string): string {
	return languages[locale].description || `${locale} not supported`
}
export function languageEmoji(locale: string) {
	return languages[locale].emoji || '🤔'
}
