<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Step 1 of 2: Vote</h3>
      <div v-if="!voteTx">Please approve transaction in your wallet</div>
      <div v-if="voteTx">Waiting for confirmation...</div>
      <div class="loader"></div>
    </div>
    <div v-if="step === 2">
      <h3>Step 2 of 2: Success</h3>
      <div>
        Your votes has been submitted.
      </div>
      <button class="btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { BigNumber, Contract } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { PubKey, Message } from 'maci-domainobjs'

import { createMessage } from '@/utils/maci'

import { FundingRound } from '@/api/abi'

@Component
export default class ReallocationModal extends Vue {

  @Prop()
  votes!: [number, BigNumber][]

  step = 1

  voteTx: TransactionResponse | null = null

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
    const voteTx = await fundingRound.submitMessageBatch(
      messages.reverse().map((msg) => msg.asContractParam()),
      encPubKeys.reverse().map((key) => key.asContractParam()),
    )
    this.voteTx = voteTx
    await voteTx.wait()
    this.step += 1
  }
}
</script>

<style scoped lang="scss">

.btn {
  margin-top: 20px;
}
</style>
