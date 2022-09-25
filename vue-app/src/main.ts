import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Web3 from './plugins/Web3'

// import i18n from './plugins/i18n'

import Meta from 'vue-meta'
import VModal from 'vue-js-modal'
import VTooltip from 'v-tooltip'
import i18n from './plugins/i18n'

Vue.use(Meta)
Vue.use(VModal, {
  dynamicDefaults: {
    adaptive: true,
    height: '100%',
    width: 450,
  },
})
Vue.use(Web3)
Vue.use(VTooltip)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  i18n,
  render: (h) => h(App),
}).$mount('#app')
