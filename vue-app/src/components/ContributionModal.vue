<template>
  <div class="modal-body">
    <div v-if="step === 0">
      <h2>
        {{
          $t('contributionModal.confirm', {
            renderTotal: renderTotal,
            nativeTokenSymbol: currentRound.nativeTokenSymbol,
          })
        }}
      </h2>
      <p>
        {{ $t('contributionModal.your') }}
        <b>{{ renderTotal }} {{ currentRound.nativeTokenSymbol }}</b>
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
            nativeTokenSymbol: currentRound.nativeTokenSymbol,
          })
        }}
      </h2>
      <p>
        {{
          $t('contributionModal.permission', {
            renderTotal: renderTotal,
            nativeTokenSymbol: currentRound.nativeTokenSymbol,
          })
        }}
      </p>
      <transaction
        :hash="approvalTxHash"
        :error="approvalTxError || error"
        @close="$emit('close')"
        @retry="
          () => {
            this.step = 0
            this.approvalTxError = ''
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
            nativeTokenSymbol: currentRound.nativeTokenSymbol,
          })
        }}
      </h2>
      <p>
        {{
          $t('contributionModal.send_tx', {
            renderTotal: renderTotal,
            nativeTokenSymbol: currentRound.nativeTokenSymbol,
          })
        }}
      </p>
      <transaction
        :hash="contributionTxHash"
        :error="contributionTxError || error"
        @close="$emit('close')"
        @retry="
          () => {
            this.step = 0
            this.contributionTxError = ''
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
            nativeTokenSymbol: currentRound.nativeTokenSymbol,
          })
        }}
      </p>
      <transaction
        :hash="voteTxHash"
        :error="voteTxError || error"
        @close="$emit('close')"
        @retry="
          () => {
            this.voteTxError = ''
            sendVotes()
          }
        "
        :displayRetryBtn="true"
      ></transaction>
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

import { RoundInfo } from '@/api/round'
import Transaction from '@/components/Transaction.vue'
import {
  LOAD_ROUND_INFO,
  SAVE_COMMITTED_CART_DISPATCH,
  SAVE_CONTRIBUTOR_DATA,
} from '@/store/action-types'
import {
  SET_CONTRIBUTOR,
  SET_CONTRIBUTION,
  SET_HAS_VOTED,
} from '@/store/mutation-types'
import { formatAmount } from '@/utils/amounts'
import { waitForTransaction, getEventArg } from '@/utils/contracts'
import { createMessage } from '@/utils/maci'
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
  error = ''

  mounted() {
    if (
      this.$store.getters.hasUserContributed &&
      !this.$store.getters.hasUserVoted
    ) {
      // If the user has already contributed but without sending the votes
      // (final step 3), move automatically to that step
      this.step = 3
      this.sendVotes()
    }
  }

  get currentRound(): RoundInfo {
    return this.$store.state.currentRound
  }

  get signer(): Signer {
    return this.$store.state.currentUser.walletProvider.getSigner()
  }

  get fundingRound(): Contract {
    const { fundingRoundAddress } = this.currentRound
    return new Contract(fundingRoundAddress, FundingRound, this.signer)
  }

  get total(): BigNumber {
    const { voiceCreditFactor } = this.currentRound
    return this.votes.reduce((total: BigNumber, [, voiceCredits]) => {
      return total.add(voiceCredits.mul(voiceCreditFactor))
    }, BigNumber.from(0))
  }

  get renderTotal(): string {
    const { nativeTokenDecimals } = this.currentRound
    return formatAmount(this.total, nativeTokenDecimals)
  }

  formatDate(value: DateTime): string {
    return value.toLocaleString(DateTime.DATETIME_SHORT) || ''
  }

  async contribute() {
    try {
      this.step += 1
      const {
        nativeTokenAddress,
        voiceCreditFactor,
        maciAddress,
        fundingRoundAddress,
      } = this.currentRound
      const total = this.total
      const token = new Contract(nativeTokenAddress, ERC20, this.signer)
      // Approve transfer (step 1)
      const allowance = await token.allowance(
        this.signer.getAddress(),
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
      let contributionTxReceipt
      try {
        contributionTxReceipt = await waitForTransaction(
          this.fundingRound.contribute(
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
      const maci = new Contract(maciAddress, MACI, this.signer)
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
      this.step += 1
      // Vote (step 3)
      await this.sendVotes()
    } catch (err) {
      /* eslint-disable-next-line no-console */
      console.log(err)
      this.error =
        'Something unexpected ocurred. Refresh the page and try again.'
    }
  }

  async sendVotes() {
    const { coordinatorPubKey } = this.currentRound

    const contributor = this.$store.state.contributor
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

    try {
      await waitForTransaction(
        this.fundingRound.submitMessageBatch(
          messages.reverse().map((msg) => msg.asContractParam()),
          encPubKeys.reverse().map((key) => key.asContractParam())
        ),
        (hash) => (this.voteTxHash = hash)
      )
      this.$store.commit(SET_HAS_VOTED, true)
      this.$store.dispatch(SAVE_COMMITTED_CART_DISPATCH)
      this.$emit('close')
      this.$router.push({
        name: `transaction-success`,
        params: {
          type: 'contribution',
          hash: this.contributionTxHash,
        },
      })
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
}
</style>
