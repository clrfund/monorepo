<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Step 1 of 4: Approve</h3>
      <div v-if="!approvalTxHash">Please approve transaction in your wallet</div>
      <div v-if="approvalTxHash">Waiting for confirmation...</div>
      <div class="loader"></div>
    </div>
    <div v-if="step === 2">
      <h3>Step 2 of 4: Contribute</h3>
      <div v-if="!contributionTxHash">Please approve transaction in your wallet</div>
      <div v-if="contributionTxHash">Waiting for confirmation...</div>
      <div class="loader"></div>
    </div>
    <div v-if="step === 3">
      <h3>Step 3 of 4: Vote</h3>
      <div v-if="!voteTxHash">Please approve transaction in your wallet</div>
      <div v-if="voteTxHash">Waiting for confirmation...</div>
      <div class="loader"></div>
    </div>
    <div v-if="step === 4">
      <h3>Step 4 of 4: Success</h3>
      <div>
        Successfully contributed {{ contribution | formatAmount }} {{ currentRound.nativeTokenSymbol }} to the funding round. Only the coordinator can know which projects you have supported.
        <br>
        You can reallocate contributed funds until {{ currentRound.votingDeadline | formatDate }}.
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
import { Keypair, PubKey, Message } from 'maci-domainobjs'

import { Contributor } from '@/api/contributions'
import { RoundInfo } from '@/api/round'
import { storage } from '@/api/storage'
import { User } from '@/api/user'
import { LOAD_ROUND_INFO } from '@/store/action-types'
import { SET_CURRENT_USER, SET_CONTRIBUTOR } from '@/store/mutation-types'
import { waitForTransaction, getEventArg } from '@/utils/contracts'
import { createMessage } from '@/utils/maci'

import { FundingRound, ERC20, MACI } from '@/api/abi'

const CONTRIBUTOR_INFO_STORAGE_KEY = 'contributor-info'

function saveContributorInfo(
  fundingRoundAddress: string,
  user: User,
  contributor: Contributor,
) {
  const serializedData = JSON.stringify({
    privateKey: contributor.keypair.privKey.serialize(),
    stateIndex: contributor.stateIndex,
  })
  storage.setItem(
    user.walletAddress,
    user.encryptionKey,
    fundingRoundAddress,
    CONTRIBUTOR_INFO_STORAGE_KEY,
    serializedData,
  )
}

@Component
export default class ContributionModal extends Vue {

  @Prop()
  votes!: [number, BigNumber][]

  step = 1

  approvalTxHash: string | null = null
  contributionTxHash: string | null = null
  voteTxHash: string | null = null

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
      await waitForTransaction(
        token.approve(fundingRoundAddress, total),
        (hash) => this.approvalTxHash = hash,
      )
    }
    this.step += 1
    // Contribute (step 2)
    const contributorKeypair = new Keypair()
    const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer)
    const contributionTxReceipt = await waitForTransaction(
      fundingRound.contribute(
        contributorKeypair.pubKey.asContractParam(),
        total,
      ),
      (hash) => this.contributionTxHash = hash,
    )
    // Get state index and amount of voice credits
    const maci = new Contract(maciAddress, MACI, signer)
    const stateIndex = getEventArg(contributionTxReceipt, maci, 'SignUp', '_stateIndex')
    const voiceCredits = getEventArg(contributionTxReceipt, maci, 'SignUp', '_voiceCreditBalance')
    if (!voiceCredits.mul(voiceCreditFactor).eq(total)) {
      throw new Error('Incorrect amount of voice credits')
    }
    const contributor = {
      keypair: contributorKeypair,
      stateIndex: stateIndex.toNumber(),
    }
    // Save contributor info to storage
    saveContributorInfo(
      fundingRoundAddress,
      this.$store.state.currentUser,
      contributor,
    )
    // Set contribution and update round info
    this.$store.commit(SET_CONTRIBUTOR, contributor)
    this.$store.commit(SET_CURRENT_USER, {
      ...this.$store.state.currentUser,
      contribution: total,
    })
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
    await waitForTransaction(
      fundingRound.submitMessageBatch(
        messages.reverse().map((msg) => msg.asContractParam()),
        encPubKeys.reverse().map((key) => key.asContractParam()),
      ),
      (hash) => this.voteTxHash = hash,
    )
    this.step += 1
  }

  get contribution(): FixedNumber {
    return FixedNumber.fromValue(
      this.$store.state.currentUser.contribution,
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
