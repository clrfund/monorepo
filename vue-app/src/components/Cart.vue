<template>
  <div class="wrapper">
    <div class="modal-background" @click="toggleCart" />
    <div class="container">
      <div class="flex-row" style="justify-content: flex-end;">
        <div class="close-btn" @click="toggleCart()">
          <p class="no-margin">Close</p>
          <img src="@/assets/close.svg" />
        </div>
      </div>
      <div class="cart">
        <div v-if="isEmptyCart" class="empty-cart">
          <div style="font-size: 64px;">🌚</div>
          <h3>Your cart is empty</h3>
          <div>Choose some projects that you want to contribute to</div>
        </div>
        <div v-for="item in filteredCart" class="cart-item" :key="item.id">
          <div class="project">
            <img class="project-image" :src="item.imageUrl" :alt="item.name">
            <router-link
              class="project-name"
              :to="{ name: 'project', params: { id: item.id }}"
            >
              {{ item.name }}
            </router-link>
          </div>
          <form class="contribution-form">
            <input
              :value="item.amount"
              @input="updateAmount(item, $event.target.value)"
              class="input contribution-amount"
              :class="{ invalid: !isAmountValid(item.amount) }"
              :disabled="!canUpdateAmount()"
              name="amount"
              placeholder="Amount"
            >
            <div class="contribution-currency">{{ tokenSymbol }}</div>
            <div
              v-if="canRemoveItem()"
              class="remove-cart-item"
              @click="removeItem(item)"
            >
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
          <div v-if="hasUnallocatedFunds()" class="submit-suggestion">
            Unallocated funds will be used as matching funding
          </div>
          <div v-if="canRegisterWithBrightId()" class="submit-suggestion">
            <a @click="registerWithBrightId()">Click here to verify your account using BrightID</a>
          </div>
          <div v-if="canBuyWxdai()" class="submit-suggestion">
            <a href="https://wrapeth.com/" target="_blank" rel="noopener">
              Click here to wrap XDAI
            </a>
          </div>
          <button
            v-if="canWithdrawContribution()"
            class="btn submit-btn"
            @click="withdrawContribution()"
          >
            Withdraw {{ formatAmount(contribution) }} {{ tokenSymbol }}
          </button>
          <button
            v-else
            class="btn submit-btn"
            :disabled="errorMessage !== null"
            @click="submit()"
          >
            <template v-if="contribution.isZero()">
              Contribute {{ formatAmount(getTotal()) }} {{ tokenSymbol }} to {{ cart.length }} projects
            </template>
            <template v-else-if="hasUnallocatedFunds()">
              Reallocate {{ formatAmount(getTotal()) }} of {{ formatAmount(contribution) }} {{ tokenSymbol }}
            </template>
            <template v-else>
              Reallocate {{ formatAmount(getTotal()) }} {{ tokenSymbol }}
            </template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber, FixedNumber } from 'ethers'
import { parseFixed } from '@ethersproject/bignumber'
import { DateTime } from 'luxon'

import BrightIdModal from '@/components/BrightIdModal.vue'
import ContributionModal from '@/components/ContributionModal.vue'
import ReallocationModal from '@/components/ReallocationModal.vue'
import WithdrawalModal from '@/components/WithdrawalModal.vue'

import {
  MAX_CONTRIBUTION_AMOUNT,
  MAX_CART_SIZE,
  CartItem,
} from '@/api/contributions'
import { userRegistryType } from '@/api/core'
import { RoundStatus } from '@/api/round'
import { SAVE_CART } from '@/store/action-types'
import { UPDATE_CART_ITEM, REMOVE_CART_ITEM } from '@/store/mutation-types'
import { formatAmount } from '@/utils/amounts'
import { Prop } from 'vue-property-decorator'

@Component
export default class Cart extends Vue {
  
  @Prop() toggleCart

  private get cart(): CartItem[] {
    return this.$store.state.cart
  }

  get tokenSymbol(): string {
    const currentRound = this.$store.state.currentRound
    return currentRound ? currentRound.nativeTokenSymbol : ''
  }

  get contribution(): BigNumber {
    return this.$store.state.contribution || BigNumber.from(0)
  }

  get filteredCart(): CartItem[] {
    // Hide cleared items
    return this.cart.filter((item) => !item.isCleared)
  }

  get isEmptyCart(): boolean {
    return this.$store.state.currentUser && this.filteredCart.length === 0
  }

  formatAmount(value: BigNumber): string {
    const decimals = this.$store.state.currentRound.nativeTokenDecimals
    return formatAmount(value, decimals)
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

  canUpdateAmount(): boolean {
    const currentRound = this.$store.state.currentRound
    return currentRound && DateTime.local() < currentRound.votingDeadline
  }

  updateAmount(item: CartItem, amount: string) {
    this.$store.commit(UPDATE_CART_ITEM, { ...item, amount })
    this.$store.dispatch(SAVE_CART)
  }

  canRemoveItem(): boolean {
    const currentRound = this.$store.state.currentRound
    return currentRound && DateTime.local() < currentRound.votingDeadline
  }

  removeItem(item: CartItem) {
    this.$store.commit(REMOVE_CART_ITEM, item)
    this.$store.dispatch(SAVE_CART)
  }

  canSubmit(): boolean {
    return this.$store.state.currentRound && this.cart.length > 0 || this.canWithdrawContribution()
  }

  private isFormValid(): boolean {
    const invalidCount = this.cart.filter((item) => {
      return this.isAmountValid(item.amount) === false
    }).length
    return invalidCount === 0
  }

  getTotal(): BigNumber {
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
    } else if (this.cart.length > MAX_CART_SIZE) {
      return `Cart can not contain more than ${MAX_CART_SIZE} items`
    } else if (currentRound.status === RoundStatus.Cancelled) {
      return 'Funding round has been cancelled'
    } else if (DateTime.local() >= currentRound.votingDeadline) {
      return 'The funding round has ended'
    } else if (currentRound.messages + this.cart.length >= currentRound.maxMessages) {
      return 'The limit on the number of votes has been reached'
    } else {
      const total = this.getTotal()
      if (this.contribution.isZero()) {
        // Contributing
        if (DateTime.local() >= currentRound.signUpDeadline) {
          return 'The contribution period has ended'
        } else if (currentRound.contributors >= currentRound.maxContributors) {
          return 'The limit on the number of contributors has been reached'
        } else if (total.eq(BigNumber.from(0))) {
          return 'Contribution amount must be greater then zero'
        } else if (currentUser.balance === null) {
          return '' // No error: waiting for balance
        } else if (total.gt(currentUser.balance)) {
          const balanceDisplay = formatAmount(
            currentUser.balance,
            currentRound.nativeTokenDecimals,
          )
          return `Your balance is ${balanceDisplay} ${currentRound.nativeTokenSymbol}`
        } else if (this.isGreaterThanMax()) {
          return 'Contribution amount is too large'
        } else {
          return null
        }
      } else {
        // Reallocating funds
        if (!this.$store.state.contributor) {
          return 'Contributor key is not found'
        } else if (this.isGreaterThanInitialContribution()) {
          return 'The total can not exceed the initial contribution'
        } else {
          return null
        }
      }
    }
  }

  hasUnallocatedFunds(): boolean {
    return (
      this.errorMessage === null &&
      this.contribution !== null &&
      !this.contribution.isZero() &&
      this.getTotal().lt(this.contribution)
    )
  }

  canRegisterWithBrightId(): boolean {
    return userRegistryType === 'brightid' && this.$store.state.currentUser?.isVerified === false
  }

  canBuyWxdai(): boolean {
    return (
      this.$store.state.currentRound?.nativeTokenSymbol === 'WXDAI' &&
      this.errorMessage !== null &&
      this.errorMessage.startsWith('Your balance is')
    )
  }

  registerWithBrightId(): void {
    this.$modal.show(
      BrightIdModal,
      { },
      { width: 500 },
    )
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
      { width: 500 },
    )
  }

  canWithdrawContribution(): boolean {
    return (
      this.$store.state.currentRound?.status === RoundStatus.Cancelled &&
      !this.contribution.isZero()
    )
  }

  withdrawContribution(): void {
    this.$modal.show(
      WithdrawalModal,
    )
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;

  .modal-background {
    background: rgba(0,0,0,0.7);
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

.container {
    position: absolute;
    right: 0;
    z-index: 2;
    background: $bg-secondary-color;
    height: 100%;
    width: clamp(200px, 25%, 500px);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    z-index: 2;
}

.flex-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - #{$profile-image-size + 2 * $content-space});
  width: 100%;
  background: $bg-secondary-color;
  z-index: 3;
}

.empty-cart {
  font-size: 16px;
  font-weight: 400;
  margin: 1rem;
  width: 100%;
  z-index: 3;
  background: $bg-secondary-color;

  img {
    height: 70px;
  }

  h3 {
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 25px;
    font-weight: 700;
  }

  div {
    color: #d5d4d7;
  }
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
    align-self: center;
    color: $text-color;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    flex-grow: 1;
    max-height: $project-image-size;
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

.close-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  &:hover {
    transform: scale(1.01);
  }
}

.submit-btn-wrapper {
  align-self: flex-end;
  box-sizing: border-box;
  margin-top: auto;
  padding: $content-space;
  text-align: center;
  width: 100%;

  .submit-error {
    padding: 15px 0 0;
  }

  .submit-suggestion {
    padding-top: 5px;
  }

  .submit-btn {
    margin-top: 15px;
    width: 100%;
  }
}}
</style>