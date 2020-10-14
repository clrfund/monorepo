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
      <h3>Step 3 of 4: Vote</h3>
      <div v-if="!voteTx">Please approve transaction in your wallet</div>
      <div v-if="voteTx">Waiting for confirmation...</div>
      <div class="loader"></div>
    </div>
    <div v-if="step === 4">
      <h3>Step 4 of 4: Success</h3>
      <div>
        Successfully contributed {{ contributor.contribution | formatAmount }} {{ currentRound.nativeTokenSymbol }} to the funding round.
        <br>
        If you are being bribed, please override your vote before {{ currentRound.votingDeadline | formatDate }}.
      </div>
      <button class="btn" @click="$emit('close')">OK</button>
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
import { storage } from '@/api/storage'
import { User } from '@/api/user'
import { LOAD_ROUND_INFO } from '@/store/action-types'
import { REMOVE_CART_ITEM, SET_CONTRIBUTION } from '@/store/mutation-types'
import { getEventArg } from '@/utils/contracts'
import { createMessage } from '@/utils/maci'

import { FundingRound, ERC20, MACI } from '@/api/abi'

interface Contributor {
  keypair: Keypair;
  stateIndex: number;
  contribution: FixedNumber;
  voiceCredits: BigNumber;
}

const CONTRIBUTOR_KEY_STORAGE_KEY = 'contributor-key'

function saveContributorKey(
  contributor: Contributor,
  user: User,
) {
  const serializedData = JSON.stringify({
    privateKey: contributor.keypair.privKey.serialize(),
    stateIndex: contributor.stateIndex,
  })
  storage.setItem(
    user.walletAddress,
    user.encryptionKey,
    CONTRIBUTOR_KEY_STORAGE_KEY,
    serializedData,
  )
}

@Component
export default class ContributionModal extends Vue {

  step = 1

  private amount: BigNumber = BigNumber.from(0)
  private votes: [number, BigNumber][] = []
  contributor: Contributor | null = null

  approvalTx: TransactionResponse | null = null
  contributionTx: TransactionResponse | null = null
  voteTx: TransactionResponse | null = null

  mounted() {
    const { nativeTokenDecimals, voiceCreditFactor } = this.currentRound
    this.$store.state.cart.forEach((item: CartItem) => {
      const amountRaw = parseFixed(item.amount, nativeTokenDecimals)
      const voiceCredits = amountRaw.div(voiceCreditFactor)
      this.votes.push([item.index, voiceCredits])
      this.amount = this.amount.add(voiceCredits.mul(voiceCreditFactor))
    })
    this.contribute()
  }

  get currentRound(): RoundInfo {
    return this.$store.state.currentRound
  }

  private getSigner(): Signer {
    const provider = this.$store.state.currentUser.walletProvider
    return provider.getSigner()
  }

  private async contribute() {
    const signer = this.getSigner()
    const {
      coordinatorPubKey,
      nativeTokenAddress,
      nativeTokenDecimals,
      maciAddress,
      fundingRoundAddress,
    } = this.currentRound
    const token = new Contract(nativeTokenAddress, ERC20, signer)
    // Approve transfer (step 1)
    const allowance = await token.allowance(signer.getAddress(), fundingRoundAddress)
    if (allowance < this.amount) {
      const approvalTx = await token.approve(fundingRoundAddress, this.amount)
      this.approvalTx = approvalTx
      await approvalTx.wait()
    }
    this.step += 1
    // Contribute (step 2)
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
    this.contributor = {
      keypair: contributorKeypair,
      stateIndex: stateIndex.toNumber(),
      contribution: FixedNumber.fromValue(this.amount, nativeTokenDecimals),
      voiceCredits,
    }
    // Save contributor info to storage
    saveContributorKey(this.contributor, this.$store.state.currentUser)
    // Set contribution and update round info
    this.$store.commit(SET_CONTRIBUTION, this.amount)
    this.$store.dispatch(LOAD_ROUND_INFO)
    // Vote (step 3)
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
    this.step += 1
    const voteTx = await fundingRound.submitMessageBatch(
      messages.reverse().map((msg) => msg.asContractParam()),
      encPubKeys.reverse().map((key) => key.asContractParam()),
    )
    this.voteTx = voteTx
    await voteTx.wait()
    this.step += 1
    // Clear the cart
    this.$store.state.cart.slice().forEach((item) => {
      this.$store.commit(REMOVE_CART_ITEM, item)
    })
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

.btn {
  margin-top: 20px;
}
</style>
