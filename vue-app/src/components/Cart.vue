<template>
  <div class="cart">
    <div v-for="item in cart" class="cart-item" :key="item.address">
      <div class="project">
        <img class="project-image" :src="item.imageUrl" :alt="item.name">
        <div class="project-name">{{ item.name }}</div>
      </div>
      <form class="contribution-form">
        <input
          :value="item.amount"
          @input="updateAmount(item, $event.target.value)"
          class="input contribution-amount"
          :class="{ invalid: !isAmountValid(item.amount) }"
          name="amount"
          placeholder="Amount"
        >
        <div class="contribution-currency">{{ tokenSymbol }}</div>
        <div class="remove-cart-item" @click="removeItem(item)">
          <img src="@/assets/remove.svg" />
        </div>
      </form>
    </div>
    <div
      v-if="canSubmit()"
      class="submit-btn-wrapper"
    >
      <div v-if="errorMessage" class="submit-error">
        {{ errorMessage }}
      </div>
      <button
        class="btn submit-btn"
        :disabled="errorMessage !== null"
        @click="submit()"
      >
        <template v-if="contribution.isZero()">
          Contribute {{ total }} {{ tokenSymbol }} to {{ cart.length }} projects
        </template>
        <template v-else>
          Reallocate funds
        </template>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber, FixedNumber } from 'ethers'
import { parseFixed } from '@ethersproject/bignumber'
import { DateTime } from 'luxon'
import { Keypair, PrivKey } from 'maci-domainobjs'

import ContributionModal from '@/components/ContributionModal.vue'
import ReallocationModal from '@/components/ReallocationModal.vue'

import { MAX_CONTRIBUTION_AMOUNT, CartItem, Contributor } from '@/api/contributions'
import { storage } from '@/api/storage'
import { User } from '@/api/user'
import { CHECK_VERIFICATION } from '@/store/action-types'
import {
  SET_CONTRIBUTOR,
  ADD_CART_ITEM,
  UPDATE_CART_ITEM,
  REMOVE_CART_ITEM,
} from '@/store/mutation-types'

const CART_STORAGE_KEY = 'cart'
const CONTRIBUTOR_INFO_STORAGE_KEY = 'contributor-info'

function loadContributorInfo(user: User): Contributor | null {
  const serializedData = storage.getItem(
    user.walletAddress,
    user.encryptionKey,
    CONTRIBUTOR_INFO_STORAGE_KEY,
  )
  if (serializedData) {
    const data = JSON.parse(serializedData)
    const keypair = new Keypair(PrivKey.unserialize(data.privateKey))
    return { keypair, stateIndex: data.stateIndex }
  } else {
    return null
  }
}

@Component({
  watch: {
    cart(items: CartItem[]) {
      // Save cart to local storage on changes
      const currentUser = this.$store.state.currentUser
      storage.setItem(
        currentUser.walletAddress,
        currentUser.encryptionKey,
        CART_STORAGE_KEY,
        JSON.stringify(items),
      )
    },
  },
})
export default class Cart extends Vue {

  mounted() {
    // Restore cart from local storage
    this.$store.watch(
      (state) => state.currentUser?.walletAddress,
      this.restoreCart,
    )
    this.restoreCart()

    // Restore contributor info from local storage
    this.$store.watch(
      (state) => state.currentUser?.walletAddress,
      this.restoreContributor,
    )
    this.restoreContributor()

    // Check verification every minute
    setInterval(async () => {
      this.$store.dispatch(CHECK_VERIFICATION)
    }, 60 * 1000)
  }

  private restoreCart() {
    const currentUser = this.$store.state.currentUser
    if (!currentUser) {
      // Restore cart only if user has logged in
      return
    }
    const serializedCart = storage.getItem(
      currentUser.walletAddress,
      currentUser.encryptionKey,
      CART_STORAGE_KEY,
    )
    if (serializedCart) {
      for (const item of JSON.parse(serializedCart)) {
        this.$store.commit(ADD_CART_ITEM, item)
      }
    }
  }

  private restoreContributor() {
    const currentUser = this.$store.state.currentUser
    if (!currentUser) {
      // Restore contributor info only if user has logged in
      return
    }
    const contributor = loadContributorInfo(currentUser)
    if (contributor) {
      this.$store.commit(SET_CONTRIBUTOR, contributor)
    }
  }

  get tokenSymbol(): string {
    const currentRound = this.$store.state.currentRound
    return currentRound ? currentRound.nativeTokenSymbol : ''
  }

  get contribution(): BigNumber {
    return this.$store.state.contribution
  }

  get cart(): CartItem[] {
    return this.$store.state.cart
  }

  isAmountValid(value: string): boolean {
    const currentRound = this.$store.state.currentRound
    if (!currentRound) {
      // Skip validation
      return true
    }
    const { nativeTokenDecimals, voiceCreditFactor } = currentRound
    let amount
    try {
      amount = parseFixed(value, nativeTokenDecimals)
    } catch {
      return false
    }
    if (amount.lt(BigNumber.from(0))) {
      return false
    }
    const normalizedValue = FixedNumber
      .fromValue(
        amount.div(voiceCreditFactor).mul(voiceCreditFactor),
        nativeTokenDecimals,
      )
      .toUnsafeFloat().toString()
    return normalizedValue === value
  }

  updateAmount(item: CartItem, amount: string) {
    this.$store.commit(UPDATE_CART_ITEM, { ...item, amount })
  }

  removeItem(item: CartItem) {
    this.$store.commit(REMOVE_CART_ITEM, item)
  }

  canSubmit(): boolean {
    return this.$store.state.currentRound && this.cart.length > 0
  }

  private isFormValid(): boolean {
    const invalidCount = this.cart.filter((item) => {
      return this.isAmountValid(item.amount) === false
    }).length
    return invalidCount === 0
  }

  private getTotal(): BigNumber {
    const { nativeTokenDecimals, voiceCreditFactor } = this.$store.state.currentRound
    return this.cart.reduce((total: BigNumber, item: CartItem) => {
      let amount
      try {
        amount = parseFixed(item.amount, nativeTokenDecimals)
      } catch {
        return total
      }
      return total.add(amount.div(voiceCreditFactor).mul(voiceCreditFactor))
    }, BigNumber.from(0))
  }

  private isGreaterThanMax(): boolean {
    const decimals = this.$store.state.currentRound.nativeTokenDecimals
    const maxContributionAmount = BigNumber.from(10)
      .pow(BigNumber.from(decimals))
      .mul(MAX_CONTRIBUTION_AMOUNT)
    return this.getTotal().gt(maxContributionAmount)
  }

  private isGreaterThanInitialContribution(): boolean {
    return this.getTotal().gt(this.contribution)
  }

  get errorMessage(): string | null {
    const currentUser = this.$store.state.currentUser
    const currentRound = this.$store.state.currentRound
    if (!currentUser) {
      return 'Please connect your wallet'
    } else if (currentUser.isVerified === null) {
      return '' // No error: waiting for verification check
    } else if (!currentUser.isVerified) {
      return 'Your account is not verified'
    } else if (!this.isFormValid()) {
      return 'Please enter correct amounts'
    } else {
      if (this.contribution.isZero()) {
        // Contributing
        if (DateTime.local() >= currentRound.signUpDeadline) {
          return 'The contribution period has ended'
        } else if (this.isGreaterThanMax()) {
          return 'Contribution amount is too large'
        } else {
          return null
        }
      } else {
        // Reallocating funds
        if (DateTime.local() >= currentRound.votingDeadline) {
          return 'The funding round has ended'
        } else if (!this.$store.state.contributor) {
          return 'Contributor key is not found'
        } else if (this.isGreaterThanInitialContribution()) {
          return 'The total can not exceed the initial contribution'
        } else {
          return null
        }
      }
    }
  }

  get total(): number {
    const decimals = this.$store.state.currentRound.nativeTokenDecimals
    return FixedNumber.fromValue(this.getTotal(), decimals).toUnsafeFloat()
  }

  submit() {
    const { nativeTokenDecimals, voiceCreditFactor } = this.$store.state.currentRound
    const votes = this.cart.map((item: CartItem) => {
      const amount = parseFixed(item.amount, nativeTokenDecimals)
      const voiceCredits = amount.div(voiceCreditFactor)
      return [item.index, voiceCredits]
    })
    this.$modal.show(
      this.contribution.isZero() ? ContributionModal : ReallocationModal,
      { votes },
      {
        clickToClose: false,
        height: 'auto',
        width: 450,
      },
    )
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.cart {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 110px);
}

.cart-item {
  border-bottom: $border;
  padding: $content-space;
}

$project-image-size: 50px;

.project {
  display: flex;
  flex-direction: row;

  .project-image {
    border-radius: 10px;
    box-sizing: border-box;
    display: block;
    height: $project-image-size;
    margin-right: 15px;
    min-width: $project-image-size;
    object-fit: cover;
    width: $project-image-size;
  }

  .project-name {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    flex-grow: 1;
    height: $project-image-size;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.contribution-form {
  align-items: center;
  display: flex;
  flex-direction: row;
  font-size: 12px;
  margin-top: 15px;
  padding-left: $project-image-size + 15px;

  .contribution-amount {
    font-size: 12px;
    width: 60%;
  }

  .contribution-currency {
    flex-grow: 1;
    margin-left: 7px;
  }

  .remove-cart-item {
    cursor: pointer;
    margin-left: 7px;
    min-width: 20px;
    width: 20px;

    &:hover {
      filter: saturate(0%);
    }
  }
}

.submit-btn-wrapper {
  align-self: flex-end;
  box-sizing: border-box;
  margin-top: auto;
  padding: $content-space;
  width: 100%;

  .submit-error {
    padding: 15px 0;
    text-align: center;
  }

  .submit-btn {
    width: 100%;
  }
}
</style>
