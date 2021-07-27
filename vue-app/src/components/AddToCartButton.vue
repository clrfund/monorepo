<template>
  <div>
    <form action="#" v-if="!inCart && canContribute()">
      <div class="input-button">
        <img style="margin-left: 0.5rem" height="24px" src="@/assets/dai.svg" />
        <input
          class="input"
          name="amount"
          autocomplete="on"
          onfocus="this.value=''"
          :placeholder="defaultAmount"
          v-model="amount"
        />
        <input
          type="submit"
          class="donate-btn"
          value="Add to cart"
          :disabled="!canContribute()"
          @click.prevent="handleSubmit"
        />
      </div>
    </form>
    <div class="input-button" v-if="inCart && canContribute()">
      <button class="donate-btn-full" @click="toggleCartPanel()">
        <span>In cart 🎉</span>
      </button>
    </div>
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
import { DEFAULT_CONTRIBUTION_AMOUNT } from '@/api/contributions'
import { User } from '@/api/user'
import { Project } from '@/api/projects'
import { RoundStatus } from '@/api/round'
import { CartItem } from '@/api/contributions'
import ConnectionModal from '@/components/ConnectionModal.vue'

@Component({
  components: {
    ConnectionModal,
  },
})
export default class AddToCartButton extends Vue {
  amount = DEFAULT_CONTRIBUTION_AMOUNT

  @Prop()
  project!: Project

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

  handleSubmit(): void {
    if (this.hasContributeBtn() && this.currentUser) {
      this.contribute()
      return
    }

    this.promptConnection()
  }

  promptConnection(): void {
    return this.$modal.show(
      ConnectionModal,
      {},
      {},
      {
        closed: this.handleConnectionModalClose,
      }
    )
  }

  handleConnectionModalClose(): void {
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

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.input-button {
  background: #f7f7f7;
  border-radius: 2rem;
  border: 2px solid $bg-primary-color;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: black;
  padding: 0.125rem;
  margin-bottom: 1rem;
  z-index: 100;
}

.input {
  background: none;
  border: none;
  color: $bg-primary-color;
  width: 100%;
}

.donate-btn {
  padding: 0.5rem 1rem;
  background: $bg-primary-color;
  color: white;
  border-radius: 32px;
  font-size: 16px;
  font-family: Inter;
  border: none;
  cursor: pointer;
  box-shadow: 0px 4px 4px 0px 0, 0, 0, 0.25;
}

.donate-btn-full {
  background: $bg-primary-color;
  color: white;
  border-radius: 32px;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  line-height: 150%;
  border: none;
  width: 100%;
  text-align: center;
  box-shadow: 0px 4px 4px 0px 0, 0, 0, 0.25;
  z-index: 1;
  cursor: pointer;
  &:hover {
    background: $bg-light-color;
  }
}
</style>
