<template>
  <div>
    <join-universal v-if="isUniversalRegistry" />
    <join-optimistic v-else-if="isOptimisticRegistry" />
    <not-found v-else />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import JoinOptimistic from '@/views/JoinOptimistic.vue'
import JoinUniversal from '@/views/JoinUniversal.vue'
import NotFound from '@/views/NotFound.vue'
import { recipientRegistryType, RecipientRegistryType } from '@/api/core'

@Component({
  components: {
    JoinOptimistic,
    JoinUniversal,
    NotFound,
  },
})
export default class JoinView extends Vue {
  get isOptimisticRegistry(): boolean {
    return recipientRegistryType === RecipientRegistryType.OPTIMISTIC
  }
  get isUniversalRegistry(): boolean {
    return recipientRegistryType === RecipientRegistryType.UNIVERSAL
  }
}
</script>
