import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import App from '@/App.vue'
import { createMetaManager } from 'vue-meta'
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'
import i18n from '@/plugins/i18n'
import { createVfm } from 'vue-final-modal'
import 'vue-final-modal/style.css'
import ClickOutside from '@/directives/ClickOutside'

const pinia = createPinia()
const app = createApp(App)
const vfm = createVfm()

app.use(pinia)
app.use(router)
app.use(createMetaManager())
app.use(i18n)
app.use(vfm)
app.directive('click-outside', ClickOutside)

app.use(FloatingVue, {
  themes: {
    'contract-popover': {
      $extend: 'dropdown',
      $resetCss: true,
    },
  },
})

app.mount('#app')
