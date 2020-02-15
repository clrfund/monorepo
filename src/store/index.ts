import Vue from 'vue'
import Vuex from 'vuex'
import counter from './counter'
import ethers from './ethers'

// import example from './module-example'

Vue.use(Vuex)

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default function (/* { ssrContext } */) {
  const store = new Vuex.Store({
    modules: {
      counter,
      ethers
    },

    // enable strict mode (adds overhead!)
    // for dev mode only
    // strict: true
  })

  store.dispatch('ethers/init')

  return store
}
