<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Step 1 of 4: Approve</h3>
      <div v-if="!approvalTx">Please approve transaction in your wallet</div>
      <div v-if="approvalTx">Waiting for confirmation...</div>
      <div class="loader"></div>
    </div>
    <div v-if="step === 2">
      <h3>Step 2 of 4: Contribute</h3>
      <div v-if="!contributionTx">Please approve transaction in your wallet</div>
      <div v-if="contributionTx">Waiting for confirmation...</div>
      <div class="loader"></div>
    </div>
    <div v-if="step === 3">
      <h3>Step 3 of 4: Are you being bribed?</h3>
      <button class="btn" @click="vote()">No</button>
    </div>
    <div v-if="step === 4">
      <h3>Step 4 of 4: Vote</h3>
      <div>Please send this transaction to {{ currentRound.fundingRoundAddress }} after {{ currentRound.contributionDeadline | formatDate }}:</div>
      <div class="hex">{{ voteTxData }}</div>
      <button class="btn" @click="$emit('close')">Done</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber, Contract, FixedNumber, Signer } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { parseFixed } from '@ethersproject/bignumber'
import { Keypair, PubKey, Message } from 'maci-domainobjs'

import { CartItem } from '@/api/contributions'
import { RoundInfo } from '@/api/round'
import { LOAD_ROUND_INFO } from '@/store/action-types'
import { REMOVE_CART_ITEM, SET_CONTRIBUTION } from '@/store/mutation-types'
import { getEventArg } from '@/utils/contracts'
import { createMessage } from '@/utils/maci'

import { FundingRound, ERC20, MACI } from '@/api/abi'

const VOICE_CREDIT_FACTOR = BigNumber.from(10).pow(4 + 18 - 9)

interface Contributor {
  keypair: Keypair;
  stateIndex: number;
  contribution: FixedNumber;
  voiceCredits: BigNumber;
}

@Component
export default class ContributionModal extends Vue {

  step = 1

  private amount: BigNumber = BigNumber.from(0)
  private votes: [number, BigNumber][] = []
  private contributor?: Contributor

  approvalTx: TransactionResponse | null = null
  contributionTx: TransactionResponse | null = null
  voteTxData = ''

  mounted() {
    const { nativeTokenDecimals } = this.currentRound
    this.$store.state.cart.forEach((item: CartItem) => {
      const amountRaw = parseFixed(item.amount.toString(), nativeTokenDecimals)
      const voiceCredits = amountRaw.div(VOICE_CREDIT_FACTOR)
      this.votes.push([item.index, voiceCredits])
      this.amount = this.amount.add(voiceCredits.mul(VOICE_CREDIT_FACTOR))
    })
    this.contribute()
  }

  get currentRound(): RoundInfo {
    return this.$store.state.currentRound
  }

  private getSigner(): Signer {
    const provider = this.$store.state.walletProvider
    return provider.getSigner()
  }

  private async contribute() {
    const signer = this.getSigner()
    const {
      nativeTokenAddress,
      nativeTokenDecimals,
      maciAddress,
      fundingRoundAddress,
    } = this.currentRound
    const token = new Contract(nativeTokenAddress, ERC20, signer)
    // Approve transfer
    const allowance = await token.allowance(signer.getAddress(), fundingRoundAddress)
    if (allowance < this.amount) {
      const approvalTx = await token.approve(fundingRoundAddress, this.amount)
      this.approvalTx = approvalTx
      await approvalTx.wait()
    }
    this.step += 1
    // Contribute
    const contributorKeypair = new Keypair()
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
    const contributionTx = await fundingRound.contribute(
      contributorKeypair.pubKey.asContractParam(),
      this.amount,
    )
    this.contributionTx = contributionTx
    // Get state index and amount of voice credits
    const maci = new Contract(maciAddress, MACI, signer)
    const stateIndex = await getEventArg(contributionTx, maci, 'SignUp', '_stateIndex')
    const voiceCredits = await getEventArg(contributionTx, maci, 'SignUp', '_voiceCreditBalance')
    this.step += 1
    this.contributor = {
      keypair: contributorKeypair,
      stateIndex,
      contribution: FixedNumber.fromValue(this.amount, nativeTokenDecimals),
      voiceCredits,
    }
    // Set contribution and clear the cart
    this.$store.commit(SET_CONTRIBUTION, this.contributor.contribution)
    this.$store.state.cart.slice().forEach((item) => {
      this.$store.commit(REMOVE_CART_ITEM, item)
    })
    this.$store.dispatch(LOAD_ROUND_INFO)
  }

  vote() {
    if (!this.contributor) {
      return
    }
    this.step += 1
    const { coordinatorPubKey, fundingRoundAddress } = this.currentRound
    const messages: Message[] = []
    const encPubKeys: PubKey[] = []
    let nonce = 1
    for (const [recipientIndex, voiceCredits] of this.votes) {
      const [message, encPubKey] = createMessage(
        this.contributor.stateIndex,
        this.contributor.keypair, null,
        coordinatorPubKey,
        recipientIndex, voiceCredits, nonce,
      )
      messages.push(message)
      encPubKeys.push(encPubKey)
      nonce += 1
    }
    const fundingRound = new Contract(fundingRoundAddress, FundingRound)
    this.voteTxData = fundingRound.interface.encodeFunctionData('submitMessageBatch', [
      messages.map((msg) => msg.asContractParam()),
      encPubKeys.map((key) => key.asContractParam()),
    ])
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

.hex {
  background-color: #666;
  font-family: monospace;
  font-size: 12px;
  height: 50px;
  padding: 5px;
  margin: 10px 0;
  overflow-y: scroll;
  text-align: left;
  word-wrap: break-word;
}
</style>
