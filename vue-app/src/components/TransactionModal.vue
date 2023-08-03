<template>
  <vue-final-modal class="modal-container" background="interactive">
    <div class="modal-body">
      <transaction
        :hash="txHash"
        :error="txError"
        :displayRetryBtn="true"
        @close="emit('close')"
        @retry="
          () => {
            txError = ''
            executeTx()
          }
        "
      ></transaction>
      <button v-if="txHash" class="btn-secondary close-btn" @click="emit('close')">
        {{ $t('transactionModal.button1') }}
      </button>
    </div>
  </vue-final-modal>
</template>

<script setup lang="ts">
import type { TransactionResponse } from '@ethersproject/abstract-provider'
// @ts-ignore
import { VueFinalModal } from 'vue-final-modal'
import Transaction from '@/components/Transaction.vue'
import { waitForTransaction } from '@/utils/contracts'

interface Props {
  transaction: Promise<TransactionResponse>
  onTxSuccess: (txHash: string) => void
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const txHash = ref('')
const txError = ref('')

onMounted(() => {
  executeTx()
})

async function executeTx() {
  try {
    await waitForTransaction(props.transaction, hash => (txHash.value = hash))

    props.onTxSuccess(txHash.value)
  } catch (error: any) {
    txError.value = error.message
    return
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.modal-body {
  text-align: left;
  background: var(--bg-secondary-color);
  border-radius: 1rem;
  box-shadow: var(--box-shadow);
  padding: 1.5rem;

  div {
    border: 1px solid var(--bg-primary-color);
    border-radius: 1rem;
  }
}

.close-btn {
  margin: $modal-space auto 0;
}
</style>
