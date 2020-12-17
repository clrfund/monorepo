import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './filters'

import Meta from 'vue-meta'
import VModal from 'vue-js-modal'

Vue.use(Meta)
Vue.use(VModal, {
  dynamicDefaults: {
    adaptive: true,
    clickToClose: false,
    height: 'auto',
    width: 450,
  },
})

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app')
