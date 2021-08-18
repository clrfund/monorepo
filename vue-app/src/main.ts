import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Web3 from './plugins/Web3'

import Meta from 'vue-meta'
import VModal from 'vue-js-modal'
import VTooltip from 'v-tooltip'

Vue.use(Meta)
Vue.use(VModal, {
  dynamicDefaults: {
    adaptive: true,
    clickToClose: false,
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
  render: (h) => h(App),
}).$mount('#app')
