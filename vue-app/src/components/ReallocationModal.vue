<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Reallocate funds</h3>
      <transaction
        :hash="voteTxHash"
        :error="voteTxError"
        @close="$emit('close')"
        @retry="
          () => {
            this.voteTxError = ''
            vote()
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
import { BigNumber, Contract } from 'ethers'
import { PubKey, Message } from 'maci-domainobjs'

import Transaction from '@/components/Transaction.vue'
import { SAVE_COMMITTED_CART_DISPATCH } from '@/store/action-types'
import { waitForTransaction } from '@/utils/contracts'
import { createMessage } from '@/utils/maci'

import { FundingRound } from '@/api/abi'

@Component({
  components: {
    Transaction,
  },
})
export default class ReallocationModal extends Vue {
  @Prop()
  votes!: [number, BigNumber][]

  step = 1

  voteTxHash = ''
  voteTxError = ''

  mounted() {
    this.vote()
  }

  private async vote() {
    const signer = this.$store.state.currentUser.walletProvider.getSigner()
    const contributor = this.$store.state.contributor
    const { coordinatorPubKey, fundingRoundAddress } =
      this.$store.state.currentRound
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
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
        fundingRound.submitMessageBatch(
          messages.reverse().map((msg) => msg.asContractParam()),
          encPubKeys.reverse().map((key) => key.asContractParam())
        ),
        (hash) => (this.voteTxHash = hash)
      )
      this.$store.dispatch(SAVE_COMMITTED_CART_DISPATCH)
      this.$emit('close')
      this.$router.push({
        name: `transaction-success`,
        params: {
          type: 'reallocation',
          hash: this.voteTxHash,
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

.close-btn {
  margin-top: $modal-space;
}
</style>
