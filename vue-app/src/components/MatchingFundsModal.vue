<template>
  <div class="modal-body">
    <div v-if="walletProvider && !currentUser">
      <h3>Connect your wallet to contribute to the matching pool!</h3>
      <button
        class="btn-action"
        @click="connect"
      >
        Connect wallet
      </button>
    </div>
    <div v-if="step === 1">
      <h3>Contribute matching funds to the {{ isRoundFinished() ? 'next' : 'current' }} round</h3>
      <form class="contribution-form">
        <div>Please enter amount:</div>
        <input
          v-model="amount"
          class="input"
          :class="{ invalid: !isAmountValid() }"
          name="amount"
          placeholder="Amount"
        >
        <div>{{ tokenSymbol }}</div>
      </form>
      <div class="btn-row">
        <button class="btn" @click="$emit('close')">Go back</button>
        <button class="btn" :disabled="!isAmountValid()" @click="contributeMatchingFunds()">Continue</button>
      </div>
    </div>
    <div v-if="step === 2">
      <h3>Contribute matching funds to the {{ isRoundFinished() ? 'next' : 'current' }} round</h3>
      <transaction
        :hash="transferTxHash"
        :error="transferTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 3">
      <h3>Success!</h3>
      <div>Tokens has been sent to the matching pool.</div>
      <button class="btn close-btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber, Contract, Signer } from 'ethers'
import { parseFixed } from '@ethersproject/bignumber'
import { Web3Provider } from '@ethersproject/providers'
import { provider as jsonRpcProvider } from '@/api/core'
import Transaction from '@/components/Transaction.vue'
import { waitForTransaction } from '@/utils/contracts'
import { LOGIN_MESSAGE, User, getProfileImageUrl } from '@/api/user'
import {
  LOAD_USER_INFO,
  LOAD_CART,
  LOAD_CONTRIBUTOR_DATA,
  LOGIN_USER,
  LOGOUT_USER,
} from '@/store/action-types'
import {
  SET_CURRENT_USER,
} from '@/store/mutation-types'
import { sha256 } from '@/utils/crypto'
import { ERC20 } from '@/api/abi'
import { factory } from '@/api/core'
import { RoundStatus } from '@/api/round'

@Component({
  components: {
    Transaction,
  },
})
export default class MatchingFundsModal extends Vue {
  private jsonRpcNetwork: Network | null = null
  private walletChainId: string | null = null
  step = 1

  signer!: Signer

  amount = '100'
  transferTxHash = ''
  transferTxError = ''

  created() {
    this.signer = this.$store.state.currentUser.walletProvider.getSigner()
  }

  get walletProvider(): any {
    return (window as any).ethereum
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  async connect(): Promise<void> {
    if (!this.walletProvider || !this.walletProvider.request) {
      return
    }
    let walletAddress
    try {
      [walletAddress] = await this.walletProvider.request({ method: 'eth_requestAccounts' })
    } catch (error) {
      // Access denied
      return
    }
    let signature
    try {
      signature = await this.walletProvider.request({
        method: 'personal_sign',
        params: [LOGIN_MESSAGE, walletAddress],
      })
    } catch (error) {
      // Signature request rejected
      return
    }
    const user: User = {
      walletProvider: new Web3Provider(this.walletProvider),
      walletAddress,
      encryptionKey: sha256(signature),
      isVerified: null,
      balance: null,
      contribution: null,
    }

    getProfileImageUrl(user.walletAddress)
      .then((url) => this.profileImageUrl = url)
    this.$store.commit(SET_CURRENT_USER, user)
    await this.$store.dispatch(LOGIN_USER)
    if (this.$store.state.currentRound) {
      // Load cart & contributor data for current round
      this.$store.dispatch(LOAD_USER_INFO)
      this.$store.dispatch(LOAD_CART)
      this.$store.dispatch(LOAD_CONTRIBUTOR_DATA)
    }
  }

  // TODO: Extract into a shared function
  renderUserAddress(digitsToShow?: number): string {
    if (this.currentUser?.walletAddress) {
      const address: string = this.currentUser.walletAddress
      if (digitsToShow) {
        const beginDigits: number = Math.ceil(digitsToShow / 2)
        const endDigits: number = Math.floor(digitsToShow / 2)
        const begin: string = address.substr(0, 2 + beginDigits)
        const end: string = address.substr(address.length - endDigits, endDigits)
        return `${begin}…${end}`
      }
      return address
    }
    return ''
  }


  isRoundFinished(): boolean {
    const { status } = this.$store.state.currentRound
    return [RoundStatus.Finalized, RoundStatus.Cancelled].includes(status)
  }

  isAmountValid(): boolean {
    const { nativeTokenDecimals } = this.$store.state.currentRound
    let amount
    try {
      amount = parseFixed(this.amount, nativeTokenDecimals)
    } catch {
      return false
    }
    if (amount.lte(BigNumber.from(0))) {
      return false
    }
    return true
  }

  get tokenSymbol(): string {
    return this.$store.state.currentRound.nativeTokenSymbol
  }

  async contributeMatchingFunds() {
    this.step += 1
    const { nativeTokenAddress, nativeTokenDecimals } = this.$store.state.currentRound
    const token = new Contract(nativeTokenAddress, ERC20, this.signer)
    const amount = parseFixed(this.amount, nativeTokenDecimals)
    try {
      await waitForTransaction(
        token.transfer(factory.address, amount),
        (hash) => this.transferTxHash = hash,
      )
    } catch (error) {
      this.transferTxError = error.message
      return
    }
    this.step += 1
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.contribution-form {
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-top: $modal-space;

  input {
    margin: 0 7px;
    width: 100px;
  }
}

.btn-row {
  margin: $modal-space auto 0;

  .btn {
    margin: 0 $modal-space;
  }
}

.close-btn {
  margin-top: $modal-space;
}

</style>
