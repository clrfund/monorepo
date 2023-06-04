<template>
  <div>
    <div class="btn-row">
      <button
        v-if="currentStep > 0"
        @click="onClickPrevious"
        class="btn-secondary float-left"
        :disabled="isNavDisabled"
      >
        {{ $t('formNavigation.button1') }}
      </button>
      <wallet-widget class="float-right" v-if="!currentUser && currentStep === finalStep" :isActionButton="true" />
      <button v-else @click="onClickNextOrConfirm" class="btn-primary float-right" :disabled="!isStepValid">
        {{ currentStep === finalStep ? $t('formNavigation.button2_1') : $t('formNavigation.button2_2') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/api/user'
import WalletWidget from '@/components/WalletWidget.vue'
import { useUserStore } from '@/stores'

interface Props {
  currentStep: number
  finalStep: number
  steps: string[]
  isStepValid: boolean
  callback: (updateFurthest?: boolean) => void
  handleStepNav: (step: number, updateFurthest?: boolean) => void
  isNavDisabled: boolean
}
const props = defineProps<Props>()

const userStore = useUserStore()
const currentUser = computed<User | null>(() => userStore.currentUser)

function onClickPrevious() {
  props.handleStepNav(props.currentStep - 1)
}

function onClickNextOrConfirm() {
  props.handleStepNav(props.currentStep + 1, true)
}
</script>

<style scoped lang="scss">
@import '../styles/theme';
@import '../styles/vars';

.btn-row {
  display: flex;
  justify-content: space-between;
  height: 2.75rem;
}
</style>
