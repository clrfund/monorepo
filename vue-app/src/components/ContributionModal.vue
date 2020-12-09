<template>
  <div class="modal-body">
    <div v-if="step === 0">
      <h3>Contributing</h3>
      <div>
        You are about to contribute {{ contribution | formatAmount }} {{ currentRound.nativeTokenSymbol }} to {{ votes.length }} projects.
        You can re-allocate contributed funds later to different projects but it is not possible to increase the total contribution amount.
      </div>
      <div class="btn-row">
        <button class="btn" @click="$emit('close')">Go back</button>
        <button class="btn" @click="contribute()">Continue</button>
      </div>
    </div>
    <div v-if="step === 1">
      <h3>Step 1 of 3: Approve</h3>
      <transaction
        :hash="approvalTxHash"
        :error="approvalTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 2">
      <h3>Step 2 of 3: Contribute</h3>
      <transaction
        :hash="contributionTxHash"
        :error="contributionTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 3">
      <h3>Step 3 of 3: Vote</h3>
      <transaction
        :hash="voteTxHash"
        :error="voteTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 4">
      <h3>Success!</h3>
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
import Transaction from '@/components/Transaction.vue'
import { LOAD_ROUND_INFO } from '@/store/action-types'
import { SET_CONTRIBUTOR, SET_CONTRIBUTION } from '@/store/mutation-types'
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

@Component({
  components: {
    Transaction,
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

  getTotal(): BigNumber {
    const { voiceCreditFactor } = this.currentRound
    return this.votes.reduce((total: BigNumber, [, voiceCredits]) => {
      return total.add(voiceCredits.mul(voiceCreditFactor))
    }, BigNumber.from(0))
  }

  get contribution(): FixedNumber {
    return FixedNumber.fromValue(
      this.getTotal(),
      this.currentRound.nativeTokenDecimals,
    )
  }

  async contribute() {
    this.step += 1
    const signer: Signer = this.$store.state.currentUser.walletProvider.getSigner()
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
    const allowance = await token.allowance(signer.getAddress(), fundingRoundAddress)
    if (allowance < total) {
      try {
        await waitForTransaction(
          token.approve(fundingRoundAddress, total),
          (hash) => this.approvalTxHash = hash,
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
          total,
        ),
        (hash) => this.contributionTxHash = hash,
      )
    } catch (error) {
      this.contributionTxError = error.message
      return
    }
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

$button-space: 20px;

.btn-row {
  margin: $button-space auto 0;

  .btn {
    margin: 0 $button-space;
  }
}

.close-btn {
  margin-top: $button-space;
}
</style>
