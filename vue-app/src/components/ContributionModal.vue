<template>
  <div class="modal-body">
    <div v-if="step === 0">
      <h2>
        Confirm {{ formatAmount(getTotal()) }}
        {{ currentRound.nativeTokenSymbol }} contribution
      </h2>
      <p>
        Your
        <b
          >{{ formatAmount(getTotal()) }}
          {{ currentRound.nativeTokenSymbol }}</b
        >
        contribution total is final. You won't be able to increase this amount.
        Make sure this is the maximum you might want to spend on contributions.
      </p>
      <!-- TODO: if you get 1/3 of the way through these transactions and come back, you shouldn't get this warning again. This warning should only appear if you haven't already signed 'approve' transaction -->
      <!-- <p>
        <em>After contributing, you'll be able to add/remove projects and change amounts as long as your cart adds up to <b>{{ formatAmount(getTotal()) }} {{ currentRound.nativeTokenSymbol }}</b>.</em>
      </p> -->
      <div class="btn-row">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="contribute()">Continue</button>
      </div>
    </div>
    <div v-if="step === 1">
      <progress-bar :currentStep="1" :totalSteps="3" />
      <h2>
        Approve {{ formatAmount(getTotal()) }}
        {{ currentRound.nativeTokenSymbol }}
      </h2>
      <p>
        This gives this app permission to withdraw
        {{ formatAmount(getTotal()) }} {{ currentRound.nativeTokenSymbol }} from
        your wallet for your contribution.
      </p>
      <transaction
        :hash="approvalTxHash"
        :error="approvalTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 2">
      <progress-bar :currentStep="2" :totalSteps="3" />
      <h2>
        Send {{ formatAmount(getTotal()) }}
        {{ currentRound.nativeTokenSymbol }} contribution
      </h2>
      <p>
        This transaction sends out your {{ formatAmount(getTotal()) }}
        {{ currentRound.nativeTokenSymbol }} contribution to your chosen
        projects.
      </p>
      <transaction
        :hash="contributionTxHash"
        :error="contributionTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 3">
      <progress-bar :currentStep="3" :totalSteps="3" />
      <h2>Matching pool magic ✨</h2>
      <p>
        This transaction lets the matching pool know how much
        {{ currentRound.nativeTokenSymbol }} to send to your favourite projects
        based on your contributions.
      </p>
      <transaction
        :hash="voteTxHash"
        :error="voteTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 4">
      <h3>You just contributed!</h3>
      <div>
        Thanks for contributing {{ formatAmount(getTotal()) }}
        {{ currentRound.nativeTokenSymbol }} to the Eth2 ecosystem.
        <br />
        You have
        <span v-if="$store.getters.canUserReallocate" class="flex">
          <span v-if="reallocationTimeLeft.days > 0">{{
            reallocationTimeLeft.days
          }}</span>
          <span v-if="reallocationTimeLeft.days > 0">days</span>
          <span>{{ reallocationTimeLeft.hours }}</span>
          <span>hours</span>
          <span v-if="reallocationTimeLeft.days === 0">{{
            reallocationTimeLeft.minutes
          }}</span>
          <span v-if="reallocationTimeLeft.days === 0">minutes</span>
        </span>
        to change your choices.
      </div>
      <button class="btn-secondary" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { BigNumber, Contract, Signer } from 'ethers'
import { DateTime } from 'luxon'
import { Keypair, PubKey, Message } from 'maci-domainobjs'

import { RoundInfo, TimeLeft } from '@/api/round'
import Transaction from '@/components/Transaction.vue'
import {
  LOAD_ROUND_INFO,
  SAVE_COMMITTED_CART_DISPATCH,
  SAVE_CONTRIBUTOR_DATA,
} from '@/store/action-types'
import { SET_CONTRIBUTOR, SET_CONTRIBUTION } from '@/store/mutation-types'
import { formatAmount } from '@/utils/amounts'
import { waitForTransaction, getEventArg } from '@/utils/contracts'
import { createMessage } from '@/utils/maci'
import { getTimeLeft } from '@/utils/dates'
import ProgressBar from '@/components/ProgressBar.vue'

import { FundingRound, ERC20, MACI } from '@/api/abi'

@Component({
  components: {
    Transaction,
    ProgressBar,
  },
})
export default class ContributionModal extends Vue {
  @Prop()
  votes!: [number, BigNumber][]

  step = 0

  approvalTxHash = ''
  approvalTxError = ''
  contributionTxHash = ''
  contributionTxError = ''
  voteTxHash = ''
  voteTxError = ''

  get currentRound(): RoundInfo {
    return this.$store.state.currentRound
  }

  formatAmount(value: BigNumber): string {
    return formatAmount(value, this.currentRound.nativeTokenDecimals)
  }

  formatDate(value: DateTime): string {
    return value.toLocaleString(DateTime.DATETIME_SHORT) || ''
  }

  get reallocationTimeLeft(): TimeLeft {
    return getTimeLeft(this.$store.state.currentRound.votingDeadline)
  }

  getTotal(): BigNumber {
    const { voiceCreditFactor } = this.currentRound
    return this.votes.reduce((total: BigNumber, [, voiceCredits]) => {
      return total.add(voiceCredits.mul(voiceCreditFactor))
    }, BigNumber.from(0))
  }

  async contribute() {
    this.step += 1
    const signer: Signer =
      this.$store.state.currentUser.walletProvider.getSigner()
    const {
      coordinatorPubKey,
      nativeTokenAddress,
      voiceCreditFactor,
      maciAddress,
      fundingRoundAddress,
    } = this.currentRound
    const total = this.getTotal()
    const token = new Contract(nativeTokenAddress, ERC20, signer)
    // Approve transfer (step 1)
    const allowance = await token.allowance(
      signer.getAddress(),
      fundingRoundAddress
    )
    if (allowance < total) {
      try {
        await waitForTransaction(
          token.approve(fundingRoundAddress, total),
          (hash) => (this.approvalTxHash = hash)
        )
      } catch (error) {
        this.approvalTxError = error.message
        return
      }
    }
    this.step += 1
    // Contribute (step 2)
    const contributorKeypair = new Keypair()
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
    let contributionTxReceipt
    try {
      contributionTxReceipt = await waitForTransaction(
        fundingRound.contribute(
          contributorKeypair.pubKey.asContractParam(),
          total
        ),
        (hash) => (this.contributionTxHash = hash)
      )
    } catch (error) {
      this.contributionTxError = error.message
      return
    }
    // Get state index and amount of voice credits
    const maci = new Contract(maciAddress, MACI, signer)
    const stateIndex = getEventArg(
      contributionTxReceipt,
      maci,
      'SignUp',
      '_stateIndex'
    )
    const voiceCredits = getEventArg(
      contributionTxReceipt,
      maci,
      'SignUp',
      '_voiceCreditBalance'
    )
    if (!voiceCredits.mul(voiceCreditFactor).eq(total)) {
      throw new Error('Incorrect amount of voice credits')
    }
    const contributor = {
      keypair: contributorKeypair,
      stateIndex: stateIndex.toNumber(),
    }
    // Save contributor data to storage
    this.$store.commit(SET_CONTRIBUTOR, contributor)
    this.$store.dispatch(SAVE_CONTRIBUTOR_DATA)
    // Set contribution and update round info
    this.$store.commit(SET_CONTRIBUTION, total)
    // Reload contribution pool size
    this.$store.dispatch(LOAD_ROUND_INFO)
    // Vote (step 3)
    const messages: Message[] = []
    const encPubKeys: PubKey[] = []
    let nonce = 1
    for (const [recipientIndex, voiceCredits] of this.votes) {
      const [message, encPubKey] = createMessage(
        contributor.stateIndex,
        contributor.keypair,
        null,
        coordinatorPubKey,
        recipientIndex,
        voiceCredits,
        nonce
      )
      messages.push(message)
      encPubKeys.push(encPubKey)
      nonce += 1
    }
    this.step += 1
    try {
      await waitForTransaction(
        fundingRound.submitMessageBatch(
          messages.reverse().map((msg) => msg.asContractParam()),
          encPubKeys.reverse().map((key) => key.asContractParam())
        ),
        (hash) => (this.voteTxHash = hash)
      )
      this.$store.dispatch(SAVE_COMMITTED_CART_DISPATCH)
    } catch (error) {
      this.voteTxError = error.message
      return
    }
    this.step += 1
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
  justify-content: center;
  gap: 1rem;

  .btn {
    margin: 0 $modal-space;
  }
}

.modal-body {
  text-align: left;
  background: $bg-secondary-color;
  border-radius: 1rem;
  box-shadow: $box-shadow;
  padding: 1.5rem;
}

.close-btn {
  margin-top: $modal-space;
}
</style>
