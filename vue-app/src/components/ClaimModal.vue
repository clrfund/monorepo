<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Step 1 of 3: Provide URL of vote tally</h3>
      <input
        :value="tallyUrl"
        @input="tallyUrl = $event.target.value"
        class="input"
        name="tally-url"
      >
      <button
        class="btn"
        :disabled="!tallyUrl"
        @click="claim()"
      >
        Continue
      </button>
    </div>
    <div v-if="step === 2">
      <h3>Step 2 of 3: Claim funds</h3>
      <div>Please confirm transaction in your wallet</div>
      <div class="loader"></div>
    </div>
    <div v-if="step === 3">
      <h3>Step 3 of 3: Success</h3>
      <div>{{ amount | formatAmount }} {{ currentRound.nativeTokenSymbol }} has been sent to {{ project.address }}</div>
      <button class="btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { Contract, FixedNumber, Signer } from 'ethers'

import { FundingRound } from '@/api/abi'
import { Project } from '@/api/projects'
import { RoundInfo } from '@/api/round'
import { getEventArg } from '@/utils/contracts'
import { getRecipientClaimData } from '@/utils/maci'

@Component
export default class ClaimModal extends Vue {

  @Prop()
  project!: Project

  step = 1

  tallyUrl = ''
  tally: any
  amount = FixedNumber.from(0)

  get currentRound(): RoundInfo {
    return this.$store.state.currentRound
  }

  private getSigner(): Signer {
    const provider = this.$store.state.walletProvider
    return provider.getSigner()
  }

  async claim() {
    const response = await fetch(this.tallyUrl)
    this.tally = await response.json()
    this.step += 1
    const signer = this.getSigner()
    const { fundingRoundAddress, nativeTokenDecimals } = this.currentRound
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
    const recipientClaimData = getRecipientClaimData(
      this.project.address,
      this.project.index,
      this.tally,
    )
    const claimTx = await fundingRound.claimFunds(...recipientClaimData)
    this.amount = FixedNumber.fromValue(
      await getEventArg(claimTx, fundingRound, 'FundsClaimed', '_amount'),
      nativeTokenDecimals,
    )
    this.step += 1
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.modal-body {
  background-color: $bg-light-color;
  padding: 20px;
  text-align: center;
}

.input[name="tally-url"] {
  display: block;
  margin: 20px auto;
  width: 100%;
}

.btn {
  margin-top: 20px;
}
</style>
