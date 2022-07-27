<template>
  <div>
    <join-optimistic v-if="$store.getters.canAddProject" />
    <not-found v-else />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import NotFound from '@/views/NotFound.vue'
import JoinOptimistic from '@/views/JoinOptimistic.vue'

@Component({
  components: {
    JoinOptimistic,
    NotFound,
  },
})
export default class JoinView extends Vue {}
</script>
