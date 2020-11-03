<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Reallocate funds</h3>
      <transaction
        :hash="voteTxHash"
        :error="voteTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 2">
      <h3>Success!</h3>
      <div>Contributed funds have been successfully reallocated.</div>
      <button class="btn close-btn" @click="$emit('close')">OK</button>
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
    const { coordinatorPubKey, fundingRoundAddress } = this.$store.state.currentRound
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
    const messages: Message[] = []
    const encPubKeys: PubKey[] = []
    let nonce = 1
    for (const [recipientIndex, voiceCredits] of this.votes) {
      const [message, encPubKey] = createMessage(
        contributor.stateIndex,
        contributor.keypair, null,
        coordinatorPubKey,
        recipientIndex, voiceCredits, nonce,
      )
      messages.push(message)
      encPubKeys.push(encPubKey)
      nonce += 1
    }
    try {
      await waitForTransaction(
        fundingRound.submitMessageBatch(
          messages.reverse().map((msg) => msg.asContractParam()),
          encPubKeys.reverse().map((key) => key.asContractParam()),
        ),
        (hash) => this.voteTxHash = hash,
      )
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
  margin-top: 20px;
}
</style>
