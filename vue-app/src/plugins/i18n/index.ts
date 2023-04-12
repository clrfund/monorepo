import { createI18n } from 'vue-i18n'
import tw from '@/locales/tw.json'
import cn from '@/locales/cn.json'
import en from '@/locales/en.json'
import es from '@/locales/es.json'

type MessageSchema = typeof tw

const i18n = createI18n<[MessageSchema], 'tw' | 'cn' | 'en' | 'es'>({
  legacy: false,
  locale: 'tw',
  fallbackLocale: 'tw',
  globalInjection: true,
  messages: {
    tw,
    cn,
    en,
    es,
  },
})

export default i18n
