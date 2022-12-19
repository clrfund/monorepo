import { createI18n } from 'vue-i18n'
import zh from '@/locales/zh-TW.json'
import en from '@/locales/en.json'

type MessageSchema = typeof zh

const i18n = createI18n<[MessageSchema], 'zh-TW' | 'en'>({
	legacy: false,
	locale: 'zh-TW',
	fallbackLocale: 'zh-TW',
	globalInjection: true,
	messages: {
		'zh-TW': zh,
		en: en,
	},
})

export default i18n
