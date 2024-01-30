<template>
  <vue-final-modal class="modal-container" background="interactive">
    <div class="modal-body">
      <div v-if="step === 0">
        <h3>
          {{ $t('reallocationModal.confirm') }}
        </h3>
        <p>
          {{
            $t('reallocationModal.confirm_details', {
              renderAmount,
              nativeTokenSymbol: currentRound?.nativeTokenSymbol,
            })
          }}
        </p>
        <div class="btn-row">
          <button class="btn-secondary" @click="$emit('close')">
            {{ $t('reallocationModal.btn_cancel') }}
          </button>
          <button class="btn-primary" @click="topup()">
            {{ $t('reallocationModal.btn_continue') }}
          </button>
        </div>
      </div>
      <div v-else-if="step === 1">
        <progress-bar :currentStep="1" :totalSteps="3" />
        <h3>
          {{
            $t('reallocationModal.approve', {
              renderAmount,
              nativeTokenSymbol: currentRound?.nativeTokenSymbol,
            })
          }}
        </h3>
        <p>
          {{
            $t('reallocationModal.permission', {
              renderAmount,
              nativeTokenSymbol: currentRound?.nativeTokenSymbol,
            })
          }}
        </p>
        <transaction
          :hash="approvalTxHash"
          :error="approvalTxError || error"
          @close="$emit('close')"
          @retry="
            () => {
              step = 0
              approvalTxError = ''
              topup()
            }
          "
          :displayRetryBtn="true"
        ></transaction>
      </div>
      <div v-else-if="step === 2">
        <progress-bar :currentStep="2" :totalSteps="3" />
        <h3>{{ $t('reallocationModal.increase') }}</h3>
        <p>
          {{
            $t('reallocationModal.increase_details', {
              nativeTokenSymbol: currentRound?.nativeTokenSymbol,
            })
          }}
        </p>
        <transaction
          :hash="topupTxHash"
          :error="topupTxError || error"
          @close="emit('close')"
          @retry="
            () => {
              topupTxError = ''
              topup()
            }
          "
          :displayRetryBtn="true"
        ></transaction>
      </div>
      <div v-if="step === 3">
        <progress-bar :currentStep="3" :totalSteps="3" />
        <h2>{{ $t('reallocationModal.reallocate') }}</h2>
        <p>
          {{ $t('reallocationModal.reallocate_details') }}
        </p>
        <transaction
          :hash="voteTxHash"
          :error="voteTxError || error"
          @close="$emit('close')"
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
import { Contract, type Signer } from 'ethers'
import type { PubKey, Message } from '@clrfund/common'
import Transaction from '@/components/Transaction.vue'
import { waitForTransaction } from '@/utils/contracts'
import { createMessage } from '@clrfund/common'
import { VueFinalModal } from 'vue-final-modal'

import { ERC20, FundingRound } from '@/api/abi'
import { useAppStore, useUserStore } from '@/stores'
import { useRouter } from 'vue-router'
import { formatAmount } from '@/utils/amounts'

interface Props {
  contribution: bigint
  votes: [number, bigint, bigint][]
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const { currentRound } = storeToRefs(appStore)

const step = ref(0)
const voteTxHash = ref('')
const voteTxError = ref('')
const topupTxHash = ref('')
const topupTxError = ref('')
const approvalTxHash = ref('')
const approvalTxError = ref('')
const error = ref('')

const totalInVotes = computed(() => {
  return props.votes.reduce((total, [, , amount]) => {
    return total + amount
  }, BigInt(0))
})

const topupAmount = computed(() => {
  return props.contribution < totalInVotes.value ? totalInVotes.value - props.contribution : BigInt(0)
})

const renderAmount = computed(() => {
  const { nativeTokenDecimals } = currentRound.value!
  return formatAmount(topupAmount.value, nativeTokenDecimals)
})

onMounted(async () => {
  if (topupAmount.value > BigInt(0)) {
    step.value = 0
  } else {
    step.value = 2
    vote()
  }
})

const total = computed(() => {
  return props.votes.reduce((total: bigint, [, , amount]) => {
    return total + amount
  }, BigInt(0))
})

async function topup() {
  step.value += 1
  const contributor = appStore.contributor
  const { fundingRoundAddress, nativeTokenAddress } = appStore.currentRound!

  let signer: Signer
  try {
    signer = await userStore.getSigner()
  } catch (err) {
    error.value = 'Error getting signer. ' + (err as Error).message
    return
  }

  try {
    const signerAddress = await signer.getAddress()
    const token = new Contract(nativeTokenAddress, ERC20, signer)
    const allowance = await token.allowance(signerAddress, fundingRoundAddress)
    if (allowance < topupAmount.value) {
      await waitForTransaction(
        token.approve(fundingRoundAddress, topupAmount.value),
        hash => (approvalTxHash.value = hash),
      )
    }
  } catch (err) {
    approvalTxError.value = (err as Error).message
    return
  }
  step.value += 1

  try {
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
    await waitForTransaction(
      fundingRound.topup(contributor!.stateIndex, topupAmount.value),
      hash => (topupTxHash.value = hash),
    )
  } catch (err) {
    topupTxError.value = 'Error adding more contribution ' + (err as Error).message
    return
  }

  appStore.saveCommittedCart()
  appStore.setContribution(total.value)
  // Reload contribution pool size
  appStore.loadRoundInfo()
  step.value += 1
  vote()
}

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
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
    await waitForTransaction(
      fundingRound.submitMessageBatch(
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

.btn-row {
  display: flex;
  margin: 1rem 0;
  margin-top: 1.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  .btn {
    margin: 0 $modal-space;
  }
}
</style>
