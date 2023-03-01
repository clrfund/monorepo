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
        text: $t('addToCartButton.input1'),
        disabled: !isAmountValid,
      }"
      @click="handleSubmit"
    />
    <input-button
      v-if="inCart && canContribute()"
      :button="{
        wide: true,
        text: $t('addToCartButton.input2'),
      }"
      @click="toggleCartPanel()"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import { DateTime } from 'luxon'

import {
  SAVE_CART,
  LOAD_OR_CREATE_ENCRYPTION_KEY,
  CREATE_ENCRYPTION_KEY_FROM_EXISTING,
} from '@/store/action-types'
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
import {
  hasContributorEverVoted,
  hasContributorVoted,
} from '@/api/contributions'
import { CartItem } from '@/api/contributions'
import WalletModal from '@/components/WalletModal.vue'
import InputButton from '@/components/InputButton.vue'
import ErrorModal from '@/components/ErrorModal.vue'
import PasskeyModal from '@/components/PasskeyModal.vue'
import { hasUncommittedCart } from '@/api/cart'
import { resolve } from 'path'

@Component({
  components: {
    WalletModal,
    InputButton,
    ErrorModal,
    PasskeyModal,
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

  async showPasskeyModal(): Promise<boolean> {
    const { currentRoundAddress } = this.$store.state
    const walletAddress = this.currentUser?.walletAddress

    if (!walletAddress || !currentRoundAddress) {
      return false
    }

    // contributor has never voted in any round
    const votedBefore = await hasContributorEverVoted(walletAddress)

    const votedThisRound = await hasContributorVoted(
      currentRoundAddress,
      walletAddress
    )

    const hasUncommitted = hasUncommittedCart(
      currentRoundAddress,
      walletAddress
    )

    return votedBefore && !votedThisRound && !hasUncommitted
  }

  async loadOrCreateEncryptionKey(): Promise<void> {
    let action = 'LOAD_OR_CREATE_ENCRYPTION_KEY'

    if (await this.showPasskeyModal()) {
      action = await new Promise((resolve) => {
        this.$modal.show(
          PasskeyModal,
          { handleSelection: (selectedAction) => resolve(selectedAction) },
          {}
        )
      })
    }

    try {
      await this.$store.dispatch(action)
    } catch (error) {
      this.$modal.show(ErrorModal, { error }, { width: 400, top: 20 })
    }
  }

  async contribute() {
    if (!this.currentUser?.encryptionKey) {
      await this.loadOrCreateEncryptionKey()
    }

    if (this.currentUser?.encryptionKey) {
      this.$store.commit(ADD_CART_ITEM, {
        ...this.project,
        amount: this.amount.toString(),
        isCleared: false,
      })
      this.$store.dispatch(SAVE_CART)
      this.$store.commit(TOGGLE_EDIT_SELECTION, true)
    }
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
