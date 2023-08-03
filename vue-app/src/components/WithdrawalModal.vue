<template>
  <vue-final-modal class="modal-container" background="interactive">
    <div class="modal-body">
      <div v-if="step === 1">
        <h3>{{ $t('withdrawalModal.h3_1') }}</h3>
        <transaction
          :hash="withdrawalTxHash"
          :displayRetryBtn="true"
          :error="withdrawalTxError"
          @close="emit('close')"
        ></transaction>
      </div>
      <div v-if="step === 2">
        <h3>{{ $t('withdrawalModal.h3_2') }}</h3>
        <div>{{ $t('withdrawalModal.div1') }}</div>
        <button class="btn close-btn" @click="emit('close')">
          {{ $t('withdrawalModal.button1') }}
        </button>
      </div>
    </div>
  </vue-final-modal>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BigNumber } from 'ethers'
// @ts-ignore
import { VueFinalModal } from 'vue-final-modal'
import { withdrawContribution } from '@/api/contributions'
import Transaction from '@/components/Transaction.vue'
import { waitForTransaction } from '@/utils/contracts'
import { useAppStore, useUserStore } from '@/stores'

const appStore = useAppStore()
const userStore = useUserStore()

const step = ref(1)
const withdrawalTxHash = ref('')
const withdrawalTxError = ref('')

onMounted(async () => {
  await withdraw()
})

const emit = defineEmits(['close'])

async function withdraw() {
  const signer = userStore.signer
  const { fundingRoundAddress } = appStore.currentRound!
  try {
    await waitForTransaction(withdrawContribution(fundingRoundAddress, signer), hash => (withdrawalTxHash.value = hash))
  } catch (error) {
    withdrawalTxError.value = (error as Error).message
    return
  }
  appStore.setContribution(BigNumber.from(0))
  step.value += 1
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.close-btn {
  margin: $modal-space auto;
}
</style>
