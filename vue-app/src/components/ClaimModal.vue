<template>
  <vue-final-modal class="modal-container" background="interactive">
    <div class="modal-body">
      <div v-if="step === 1">
        <h2>{{ $t('claimModal.h2_1') }}</h2>
        <transaction :hash="claimTxHash" :error="claimTxError" @close="emit('close')"></transaction>
      </div>
      <div v-if="step === 2">
        <h2>{{ $t('claimModal.h2_2') }}</h2>
        <p>
          <strong>{{ formatAmount(amount) }} {{ currentRound?.nativeTokenSymbol }}</strong>
          {{ $t('claimModal.p1') }}
        </p>
        <div class="address-box">
          <div>
            <div class="address-label">{{ $t('claimModal.div1') }}</div>
            <div class="address">
              {{ recipientAddress }}
            </div>
          </div>
        </div>
        <button class="btn-primary" @click="emit('close')">
          {{ $t('claimModal.button1') }}
        </button>
      </div>
    </div>
  </vue-final-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Contract, BigNumber } from 'ethers'
import { FundingRound } from '@/api/abi'
import type { Project } from '@/api/projects'
import Transaction from '@/components/Transaction.vue'
// @ts-ignore
import { VueFinalModal } from 'vue-final-modal'
import { formatAmount as _formatAmount } from '@/utils/amounts'
import { waitForTransaction, getEventArg } from '@/utils/contracts'
import { getRecipientClaimData } from '@clrfund/maci-utils'
import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { currentRound, tally } = storeToRefs(appStore)
const userStore = useUserStore()

interface Props {
  project: Project
  claimed: () => void
}

const emit = defineEmits(['close'])
const props = defineProps<Props>()

const step = ref(1)
const claimTxHash = ref('')
const claimTxError = ref('')
const amount = ref(BigNumber.from(0))
const recipientAddress = ref('')

function formatAmount(value: BigNumber): string {
  const { nativeTokenDecimals } = currentRound.value!
  return _formatAmount(value, nativeTokenDecimals)
}

onMounted(() => {
  claim()
})

async function claim() {
  const signer = userStore.signer
  const { fundingRoundAddress, recipientTreeDepth } = currentRound.value!
  const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
  const recipientClaimData = getRecipientClaimData(props.project.index, recipientTreeDepth, tally.value!)
  let claimTxReceipt
  try {
    claimTxReceipt = await waitForTransaction(
      fundingRound.claimFunds(...recipientClaimData),
      hash => (claimTxHash.value = hash),
    )
  } catch (error: any) {
    claimTxError.value = error.message
    return
  }
  amount.value = getEventArg(claimTxReceipt, fundingRound, 'FundsClaimed', '_amount')
  recipientAddress.value = getEventArg(claimTxReceipt, fundingRound, 'FundsClaimed', '_recipient')

  props.claimed()
  step.value += 1
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
}

.address-box {
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  box-shadow: var(--box-shadow);
  background: var(--bg-address-box);
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: $breakpoint-m) {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .address-label {
    font-size: 14px;
    margin: 0;
    font-weight: 400;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
  }

  .address {
    display: flex;
    font-family: 'Glacial Indifference', sans-serif;
    font-weight: 600;
    border-radius: 8px;
    align-items: center;
    gap: 0.5rem;
    word-break: break-all;
  }
}
</style>
