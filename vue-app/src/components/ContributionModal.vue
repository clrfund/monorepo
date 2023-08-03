<template>
  <vue-final-modal class="modal-container" background="interactive">
    <div class="modal-body">
      <div v-if="step === 0">
        <h2>
          {{
            $t('contributionModal.confirm', {
              renderTotal: renderTotal,
              nativeTokenSymbol: currentRound?.nativeTokenSymbol,
            })
          }}
        </h2>
        <p>
          {{ $t('contributionModal.your') }}
          <b>{{ renderTotal }} {{ currentRound?.nativeTokenSymbol }}</b>
          {{ $t('contributionModal.contribution_final') }}
        </p>
        <!-- TODO: if you get 1/3 of the way through these transactions and come back, you shouldn't get this warning again. This warning should only appear if you haven't already signed 'approve' transaction -->
        <!-- <p>
        <em>After contributing, you'll be able to add/remove projects and change amounts as long as your cart adds up to <b>{{ renderTotal }} {{ currentRound.nativeTokenSymbol }}</b>.</em>
      </p> -->
        <div class="btn-row">
          <button class="btn-secondary" @click="$emit('close')">
            {{ $t('contributionModal.btn_cancel') }}
          </button>
          <button class="btn-primary" @click="contribute()">
            {{ $t('contributionModal.btn_continue') }}
          </button>
        </div>
      </div>
      <div v-if="step === 1">
        <progress-bar :currentStep="1" :totalSteps="3" />
        <h2>
          {{
            $t('contributionModal.approve', {
              renderTotal: renderTotal,
              nativeTokenSymbol: currentRound?.nativeTokenSymbol,
            })
          }}
        </h2>
        <p>
          {{
            $t('contributionModal.permission', {
              renderTotal: renderTotal,
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
              contribute()
            }
          "
          :displayRetryBtn="true"
        ></transaction>
      </div>
      <div v-if="step === 2">
        <progress-bar :currentStep="2" :totalSteps="3" />
        <h2>
          {{
            $t('contributionModal.send_contribution', {
              renderTotal: renderTotal,
              nativeTokenSymbol: currentRound?.nativeTokenSymbol,
            })
          }}
        </h2>
        <p>
          {{
            $t('contributionModal.send_tx', {
              renderTotal: renderTotal,
              nativeTokenSymbol: currentRound?.nativeTokenSymbol,
            })
          }}
        </p>
        <transaction
          :hash="contributionTxHash"
          :error="contributionTxError || error"
          @close="$emit('close')"
          @retry="
            () => {
              step = 0
              contributionTxError = ''
              contribute()
            }
          "
          :displayRetryBtn="true"
        ></transaction>
      </div>
      <div v-if="step === 3">
        <progress-bar :currentStep="3" :totalSteps="3" />
        <h2>{{ $t('contributionModal.magic') }}</h2>
        <p>
          {{
            $t('contributionModal.how_much', {
              nativeTokenSymbol: currentRound?.nativeTokenSymbol,
            })
          }}
        </p>
        <transaction
          :hash="voteTxHash"
          :error="voteTxError || error"
          @close="$emit('close')"
          @retry="
            () => {
              voteTxError = ''
              sendVotes()
            }
          "
          :displayRetryBtn="true"
        ></transaction>
      </div>
    </div>
  </vue-final-modal>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { BigNumber, Contract } from 'ethers'
import { Keypair, PubKey, Message, createMessage } from '@clrfund/maci-utils'

import Transaction from '@/components/Transaction.vue'
import { formatAmount } from '@/utils/amounts'
import { waitForTransaction, getEventArg } from '@/utils/contracts'
import ProgressBar from '@/components/ProgressBar.vue'
// @ts-ignore
import { VueFinalModal } from 'vue-final-modal'
import { FundingRound, ERC20, MACI } from '@/api/abi'
import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const { hasUserContributed, hasUserVoted, currentRound } = storeToRefs(appStore)
const { currentUser } = storeToRefs(userStore)

const emit = defineEmits(['close'])

interface Props {
  votes: [number, BigNumber][]
}

const props = defineProps<Props>()

const step = ref(0)
const approvalTxHash = ref('')
const approvalTxError = ref('')
const contributionTxHash = ref('')
const contributionTxError = ref('')
const voteTxHash = ref('')
const voteTxError = ref('')
const error = ref('')

onMounted(() => {
  if (hasUserContributed.value && !hasUserVoted.value) {
    // If the user has already contributed but without sending the votes
    // (final step 3), move automatically to that step
    step.value = 3
    sendVotes()
  }
})

async function sendVotes() {
  const { coordinatorPubKey } = currentRound.value!

  const contributor = appStore.contributor
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
    )
    messages.push(message)
    encPubKeys.push(encPubKey)
    nonce += 1
  }

  try {
    await waitForTransaction(
      fundingRound.value.submitMessageBatch(
        messages.reverse().map(msg => msg.asContractParam()),
        encPubKeys.reverse().map(key => key.asContractParam()),
      ),
      hash => (voteTxHash.value = hash),
    )
    appStore.setHasVote(true)
    appStore.saveCommittedCart()
    // TODO: how to execute this?
    emit('close')
    router.push({
      name: `transaction-success`,
      params: {
        type: 'contribution',
        hash: contributionTxHash.value,
      },
    })
  } catch (error) {
    voteTxError.value = error.message
    return
  }
  step.value += 1
}

const fundingRound = computed(() => {
  const { fundingRoundAddress } = currentRound.value!
  return new Contract(fundingRoundAddress, FundingRound, userStore.signer)
})

const total = computed(() => {
  const { voiceCreditFactor } = currentRound.value!
  return props.votes.reduce((total: BigNumber, [, voiceCredits]) => {
    return total.add(voiceCredits.mul(voiceCreditFactor))
  }, BigNumber.from(0))
})

const renderTotal = computed(() => {
  const { nativeTokenDecimals } = currentRound.value!
  return formatAmount(total.value, nativeTokenDecimals)
})

async function contribute() {
  try {
    step.value += 1
    const { nativeTokenAddress, voiceCreditFactor, maciAddress, fundingRoundAddress } = currentRound.value!
    const token = new Contract(nativeTokenAddress, ERC20, userStore.signer)
    // Approve transfer (step 1)
    const allowance = await token.allowance(userStore.signer.getAddress(), fundingRoundAddress)
    if (allowance < total.value) {
      try {
        await waitForTransaction(token.approve(fundingRoundAddress, total.value), hash => (approvalTxHash.value = hash))
      } catch (error) {
        approvalTxError.value = error.message
        return
      }
    }
    step.value += 1
    // Contribute (step 2)
    const encryptionKey = currentUser.value?.encryptionKey || ''
    if (!encryptionKey) {
      throw new Error('Missing encryption key')
    }
    const contributorKeypair = Keypair.createFromSeed(encryptionKey)

    let contributionTxReceipt
    try {
      contributionTxReceipt = await waitForTransaction(
        fundingRound.value.contribute(contributorKeypair.pubKey.asContractParam(), total.value),
        hash => (contributionTxHash.value = hash),
      )
    } catch (error) {
      contributionTxError.value = error.message
      return
    }
    // Get state index
    const maci = new Contract(maciAddress, MACI, userStore.signer)
    const stateIndex = getEventArg(contributionTxReceipt, maci, 'SignUp', '_stateIndex')
    const contributor = {
      keypair: contributorKeypair,
      stateIndex: stateIndex.toNumber(),
    }
    // Save contributor data to storage
    appStore.setContributor(contributor)
    // Set contribution and update round info
    appStore.setContribution(total.value)
    // Reload contribution pool size
    appStore.loadRoundInfo()
    step.value += 1
    // Vote (step 3)
    await sendVotes()
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.log(err)
    error.value = 'Something unexpected ocurred. Refresh the page and try again.'
    if (err instanceof Error) {
      error.value = error.value + ' ' + err.message
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

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

.modal-body {
  text-align: left;
  background: var(--bg-secondary-color);
  border-radius: 1rem;
  box-shadow: var(--box-shadow);
  padding: 1.5rem;

  // 	add for vfm
  max-width: 500px;
  margin: auto;
}
</style>
