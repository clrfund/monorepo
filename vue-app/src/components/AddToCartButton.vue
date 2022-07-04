<template>
  <div>
    <input-button
      v-if="!inCart && canContribute()"
      v-model="amount"
      :input="{
        placeholder: defaultAmount,
        class: { invalid: !isAmountValid },
      }"
      :button="{
        text: 'Add to cart',
        disabled: !isAmountValid,
      }"
      @click="handleSubmit"
    />
    <input-button
      v-if="inCart && canContribute()"
      :button="{
        wide: true,
        text: 'In cart 🎉',
      }"
      @click="toggleCartPanel()"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import { DateTime } from 'luxon'

import { SAVE_CART } from '@/store/action-types'
import {
  ADD_CART_ITEM,
  TOGGLE_SHOW_CART_PANEL,
  TOGGLE_EDIT_SELECTION,
} from '@/store/mutation-types'
import {
  DEFAULT_CONTRIBUTION_AMOUNT,
  isContributionAmountValid,
} from '@/api/contributions'
import { User } from '@/api/user'
import { Project } from '@/api/projects'
import { RoundStatus } from '@/api/round'
import { CartItem } from '@/api/contributions'
import WalletModal from '@/components/WalletModal.vue'
import InputButton from '@/components/InputButton.vue'

@Component({
  components: {
    WalletModal,
    InputButton,
  },
})
export default class AddToCartButton extends Vue {
  amount = DEFAULT_CONTRIBUTION_AMOUNT

  @Prop() project!: Project

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get inCart(): boolean {
    const index = this.$store.state.cart.findIndex((item: CartItem) => {
      // Ignore cleared items
      return item.id === this.project.id && !item.isCleared
    })
    return index !== -1
  }

  get defaultAmount() {
    return DEFAULT_CONTRIBUTION_AMOUNT
  }

  hasContributeBtn(): boolean {
    return (
      this.$store.state.currentRound &&
      this.project !== null &&
      this.project.index !== 0
    )
  }

  canContribute(): boolean {
    const { currentRound } = this.$store.state

    return (
      this.hasContributeBtn() &&
      currentRound &&
      DateTime.local() < currentRound.votingDeadline &&
      currentRound.status !== RoundStatus.Cancelled &&
      this.project.isHidden === false &&
      this.project.isLocked === false
    )
  }

  contribute() {
    this.$store.commit(ADD_CART_ITEM, {
      ...this.project,
      amount: this.amount.toString(),
      isCleared: false,
    })
    this.$store.dispatch(SAVE_CART)
    this.$store.commit(TOGGLE_EDIT_SELECTION, true)
  }

  get isAmountValid(): boolean {
    const currentRound = this.$store.state.currentRound
    return isContributionAmountValid(this.amount.toString(), currentRound)
  }

  handleSubmit(): void {
    if (this.hasContributeBtn() && this.currentUser) {
      this.contribute()
      return
    }

    this.promptConnection()
  }

  promptConnection(): void {
    return this.$modal.show(
      WalletModal,
      {},
      { width: 400, top: 20 },
      {
        closed: this.handleWalletModalClose,
      }
    )
  }

  handleWalletModalClose(): void {
    // The modal can be closed by clicking in Cancel or when the user is
    // connected successfully. Hence, this checks if we are in the latter case
    if (this.currentUser) {
      this.contribute()
    }
  }

  toggleCartPanel() {
    this.$store.commit(TOGGLE_SHOW_CART_PANEL, true)
  }
}
</script>
