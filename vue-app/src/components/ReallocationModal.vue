<template>
  <vue-final-modal class="modal-container" background="interactive">
    <div class="modal-body">
      <div v-if="step === 1">
        <h3>{{ $t('reallocationModal.h3') }}</h3>
        <transaction
          :hash="voteTxHash"
          :error="voteTxError"
          @close="emit('close')"
          @retry="
            () => {
              voteTxError = ''
              vote()
            }
          "
          :displayRetryBtn="true"
        ></transaction>
      </div>
    </div>
  </vue-final-modal>
</template>

<script lang="ts" setup>
import { Contract } from 'ethers'
import type { PubKey, Message } from '@clrfund/common'
import Transaction from '@/components/Transaction.vue'
import { waitForTransaction, getPollContract } from '@/utils/contracts'
import { createMessage } from '@clrfund/common'
import { VueFinalModal } from 'vue-final-modal'

import { useAppStore, useUserStore } from '@/stores'
import { useRouter } from 'vue-router'

interface Props {
  votes: [number, bigint][]
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const step = ref(1)
const voteTxHash = ref('')
const voteTxError = ref('')

onMounted(() => {
  vote()
})

async function vote() {
  const contributor = appStore.contributor
  const { coordinatorPubKey, fundingRoundAddress, pollId } = appStore.currentRound!
  const messages: Message[] = []
  const encPubKeys: PubKey[] = []
  let nonce = 1
  for (const [recipientIndex, voiceCredits] of props.votes) {
    const [message, encPubKey] = createMessage(
      contributor!.stateIndex,
      contributor!.keypair,
      null,
      coordinatorPubKey,
      recipientIndex,
      voiceCredits,
      nonce,
      pollId,
    )
    messages.push(message)
    encPubKeys.push(encPubKey)
    nonce += 1
  }
  try {
    const signer = await userStore.getSigner()
    const pollContract = await getPollContract(fundingRoundAddress, signer)
    await waitForTransaction(
      pollContract.publishMessageBatch(
        messages.reverse().map(msg => msg.asContractParam()),
        encPubKeys.reverse().map(key => key.asContractParam()),
      ),
      hash => (voteTxHash.value = hash),
    )
    appStore.saveCommittedCart()
    emit('close')
    router.push({
      name: `transaction-success`,
      params: {
        type: 'reallocation',
        hash: voteTxHash.value,
      },
    })
  } catch (error: any) {
    voteTxError.value = error.message
    return
  }
  step.value += 1
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.close-btn {
  margin-top: $modal-space;
}
</style>
