import Vue from 'vue'

// https://vuejs.org/v2/guide/typescript.html#Augmenting-Types-for-Use-with-Plugins
declare module 'vue/types/vue' {
  interface Vue {
    $web3: any // TODO: define better type for this
  }
}

declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}
