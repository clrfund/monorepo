import i18n from './index'

// refer to https://github.com/bodrovis-learning/Lokalise-source/blob/master/vue-i18n/src/plugins/Translation.js

export default {
  get defaultLocale() {
    return process.env.VUE_APP_I18N_LOCALE
  },
  get supportedLocales() {
    return ['en', 'es', 'tw']
  },
  get currentLocale() {
    return i18n.locale
  },
  set currentLocale(locale) {
    i18n.locale = locale
  },
  changeLocale(locale) {
    if (!this.isLocaleSupported(locale))
      return Promise.reject(new Error('Locale not supported'))
    if (i18n.locale === locale) return Promise.resolve(locale)
    return this.loadLocaleFile(locale).then((msgs) => {
      i18n.setLocaleMessage(locale, msgs.default || msgs)
      return this.setI18nLocaleInServices(locale)
    })
  },
  loadLocaleFile(locale) {
    return import(`@/locales/${locale}.json`)
  },
  isLocaleSupported(locale) {
    return this.supportedLocales.includes(locale)
  },
  setI18nLocaleInServices(locale) {
    this.currentLocale = locale
    document.querySelector('html')!.setAttribute('lang', locale)
    return locale
  },
  i18nRoute(to) {
    return {
      ...to,
      params: {
        locale: this.currentLocale,
        ...to.params,
      },
    }
  },
}
