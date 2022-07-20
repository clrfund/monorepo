<template>
  <div>
    <join-optimistic v-if="isOptimisticRegistry" />
    <not-found v-else />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import NotFound from '@/views/NotFound.vue'
import JoinOptimistic from '@/views/JoinOptimistic.vue'
import { recipientRegistryType, RecipientRegistryType } from '@/api/core'

@Component({
  components: {
    JoinOptimistic,
    NotFound,
  },
})
export default class JoinView extends Vue {
  get isOptimisticRegistry(): boolean {
    return recipientRegistryType === RecipientRegistryType.OPTIMISTIC
  }
}
</script>
