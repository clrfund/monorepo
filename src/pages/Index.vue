<template>
  <q-page class="flex flex-center column">
    <img alt="Quasar logo" src="~assets/quasar-logo-full.svg">
    <div class="q-pa-md text-h6">Count: {{ $store.state.counter.count.toString() }}</div>
    <div class="row q-gutter-md">
      <q-btn @click="decrement">Decrement</q-btn>
      <q-btn @click="increment">Increment</q-btn>
    </div>
  </q-page>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PageIndex',
  async created() {
    try {
      await this.$store.dispatch('counter/init');
    } catch({ message }) {
      this.$q.notify({color: 'negative', message});
    }
  },
  methods: {
    async decrement() {
      try {
        await this.$store.dispatch('counter/decrement');
      } catch({ message }) {
        this.$q.notify({color: 'negative', message});
      }
    },
    async increment() {
      try {
        await this.$store.dispatch('counter/increment');
      }
      catch ({ message }) {
        this.$q.notify({color: 'negative', message});
      }
    }
  },
})
</script>
