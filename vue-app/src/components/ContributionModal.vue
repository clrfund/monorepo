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
        Successfully contributed {{ contribution | formatAmount }} {{ currentRound.nativeTokenSymbol }} to the funding round.
        <br>
        If you are being bribed, please override your vote before {{ currentRound.votingDeadline | formatDate }}.
      </div>
      <button class="btn close-btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { BigNumber, Contract, FixedNumber, Signer } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Keypair, PubKey, Message } from 'maci-domainobjs'

import { Contributor } from '@/api/contributions'
import { RoundInfo } from '@/api/round'
import { storage } from '@/api/storage'
import { User } from '@/api/user'
import { LOAD_ROUND_INFO } from '@/store/action-types'
import { REMOVE_CART_ITEM, SET_CONTRIBUTOR, SET_CONTRIBUTION } from '@/store/mutation-types'
import { getEventArg } from '@/utils/contracts'
import { createMessage } from '@/utils/maci'

import { FundingRound, ERC20, MACI } from '@/api/abi'

const CONTRIBUTOR_INFO_STORAGE_KEY = 'contributor-info'

function saveContributorInfo(user: User, contributor: Contributor) {
  const serializedData = JSON.stringify({
    privateKey: contributor.keypair.privKey.serialize(),
    stateIndex: contributor.stateIndex,
  })
  storage.setItem(
    user.walletAddress,
    user.encryptionKey,
    CONTRIBUTOR_INFO_STORAGE_KEY,
    serializedData,
  )
}

@Component
export default class ContributionModal extends Vue {

  @Prop()
  votes!: [number, BigNumber][]

  step = 1

  approvalTx: TransactionResponse | null = null
  contributionTx: TransactionResponse | null = null
  voteTx: TransactionResponse | null = null

  mounted() {
    this.contribute()
  }

  get currentRound(): RoundInfo {
    return this.$store.state.currentRound
  }

  private async contribute() {
    const signer: Signer = this.$store.state.currentUser.walletProvider.getSigner()
    const {
      coordinatorPubKey,
      nativeTokenAddress,
      voiceCreditFactor,
      maciAddress,
      fundingRoundAddress,
    } = this.currentRound
    const total = this.votes.reduce((total: BigNumber, [, voiceCredits]) => {
      return total.add(voiceCredits.mul(voiceCreditFactor))
    }, BigNumber.from(0))
    const token = new Contract(nativeTokenAddress, ERC20, signer)
    // Approve transfer (step 1)
    const allowance = await token.allowance(signer.getAddress(), fundingRoundAddress)
    if (allowance < total) {
      const approvalTx = await token.approve(fundingRoundAddress, total)
      this.approvalTx = approvalTx
      await approvalTx.wait()
    }
    this.step += 1
    // Contribute (step 2)
    const contributorKeypair = new Keypair()
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
    const contributionTx = await fundingRound.contribute(
      contributorKeypair.pubKey.asContractParam(),
      total,
    )
    this.contributionTx = contributionTx
    // Get state index and amount of voice credits
    const maci = new Contract(maciAddress, MACI, signer)
    const stateIndex = await getEventArg(contributionTx, maci, 'SignUp', '_stateIndex')
    const voiceCredits = await getEventArg(contributionTx, maci, 'SignUp', '_voiceCreditBalance')
    if (!voiceCredits.mul(voiceCreditFactor).eq(total)) {
      throw new Error('Incorrect amount of voice credits')
    }
    const contributor = {
      keypair: contributorKeypair,
      stateIndex: stateIndex.toNumber(),
    }
    // Save contributor info to storage
    saveContributorInfo(this.$store.state.currentUser, contributor)
    // Set contribution and update round info
    this.$store.commit(SET_CONTRIBUTOR, contributor)
    this.$store.commit(SET_CONTRIBUTION, total)
    this.$store.dispatch(LOAD_ROUND_INFO)
    // Vote (step 3)
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

  get contribution(): FixedNumber {
    return FixedNumber.fromValue(
      this.$store.state.contribution,
      this.currentRound.nativeTokenDecimals,
    )
  }
}
</script>

<style scoped lang="scss">
.close-btn {
  margin-top: 20px;
}
</style>
