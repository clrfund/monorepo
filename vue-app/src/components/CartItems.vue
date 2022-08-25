<template>
  <div :class="cartList.length && 'cart-item-container'">
    <div
      v-for="item in cartList"
      class="cart-item"
      :class="{
        'new-cart-item':
          isNewOrUpdated(item) && $store.getters.hasUserContributed,
      }"
      :key="item.id"
    >
      <div class="project">
        <links :to="{ name: 'project', params: { id: item.id } }">
          <img
            class="project-image"
            :src="item.thumbnailImageUrl"
            :alt="item.name"
          />
        </links>
        <links
          class="project-name"
          :to="{ name: 'project', params: { id: item.id } }"
        >
          <h4>{{ item.name }}</h4>
        </links>
        <div
          class="contribution-form"
          v-if="$store.getters.hasUserContributed && !isEditMode"
        >
          {{ item.amount }} {{ tokenSymbol }}
        </div>
        <div v-if="isEditMode" class="contribution-form">
          <input-button
            :value="item.amount"
            :input="{
              placeholder: 'Amount',
              class: { invalid: !isAmountValid(item.amount) },
              disabled: !canUpdateAmount(),
            }"
            @input="(newAmount) => updateAmount(item, newAmount)"
            class="contribution-amount"
          />
        </div>
        <div class="remove-cart-item" @click="removeItem(item)">
          <div v-if="isEditMode" class="remove-icon-background">
            <img
              class="remove-icon"
              src="@/assets/remove.svg"
              aria-label="Remove project"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { DateTime } from 'luxon'

import { CartItem, MAX_CONTRIBUTION_AMOUNT } from '@/api/contributions'
import { getTokenLogo } from '@/utils/tokens'
import { UPDATE_CART_ITEM, REMOVE_CART_ITEM } from '@/store/mutation-types'
import { SAVE_CART } from '@/store/action-types'
import Links from '@/components/Links.vue'
import InputButton from '@/components/InputButton.vue'

@Component({ components: { Links, InputButton } })
export default class extends Vue {
  @Prop() cartList!: CartItem[]
  @Prop() isEditMode!: boolean
  @Prop() isAmountValid!: (value: string) => boolean

  canUpdateAmount(): boolean {
    const currentRound = this.$store.state.currentRound
    return currentRound && DateTime.local() < currentRound.votingDeadline
  }

  private sanitizeAmount(amount: string): string {
    const MAX_DECIMAL_PLACES = 5
    // Extract only numbers or decimal points from amount string
    const cleanAmount: string = amount.replace(/[^0-9.]/g, '')
    // Find decimal point (if it exists)
    const decimalIndex: number = cleanAmount.indexOf('.')
    let newAmount: string
    if (decimalIndex === -1 || decimalIndex === cleanAmount.length - 1) {
      // If first decimal is either absent or last, return clean amount
      newAmount = cleanAmount
    } else {
      // Split up left and right of decimal point
      const leftOfDecimal: string = cleanAmount.substr(0, decimalIndex)
      const decimalString: string = cleanAmount.substr(decimalIndex)
      // Remove any remaining decimal points
      const decimalStringClean: string = decimalString.replace(/[.]/g, '')
      // Truncate decimal string to {MAX_DECIMAL_PLACES} digits
      const decimalStringToUse: string =
        decimalStringClean.length > MAX_DECIMAL_PLACES
          ? decimalStringClean.substr(0, MAX_DECIMAL_PLACES)
          : decimalStringClean
      newAmount = `${leftOfDecimal}.${decimalStringToUse}`
    }
    if (parseFloat(newAmount) > MAX_CONTRIBUTION_AMOUNT) {
      return MAX_CONTRIBUTION_AMOUNT.toString()
    }
    return newAmount
  }

  updateAmount(item: CartItem, amount: string): void {
    const sanitizedAmount: string = this.sanitizeAmount(amount)
    this.$store.commit(UPDATE_CART_ITEM, { ...item, amount: sanitizedAmount })
    this.$store.dispatch(SAVE_CART)
  }

  removeItem(item: CartItem): void {
    this.$store.commit(REMOVE_CART_ITEM, item)
    this.$store.dispatch(SAVE_CART)
  }

  isNewOrUpdated(item: CartItem): boolean {
    const itemIndex = this.$store.state.committedCart.findIndex((i) => {
      return i.id === item.id && i.amount === item.amount
    })

    return itemIndex === -1
  }

  get tokenSymbol(): string {
    const { nativeTokenSymbol } = this.$store.state.currentRound
    return nativeTokenSymbol
  }

  get tokenLogo(): string {
    return getTokenLogo(this.tokenSymbol)
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.cart-item-container {
  border-bottom: 1px solid $clr-violet;
  padding-bottom: 2rem;
}

.cart-item {
  padding: 1rem 3.5rem;
  border-bottom: 1px solid #000;
  &:last-of-type {
    border-bottom: none;
  }
}

.new-cart-item {
  padding: 1rem;
  background: rgba($clr-green, 0.2);
  border-bottom: 1px solid #000;
  &:last-of-type {
    border-bottom: none;
  }
}

.project {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;

  .project-image {
    border-radius: 50%;
    box-sizing: border-box;
    display: block;
    height: 4.25rem;
    width: 4.25rem;
    object-fit: cover;
    border: 1px solid $clr-dark-white;

    &:hover {
      opacity: 0.8;
      transform: scale(1.01);
    }
  }

  .project-name {
    align-self: center;
    color: var(--text-color);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    flex-grow: 1;
    max-height: 2.5rem;
    max-width: fit-content;
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    &:hover {
      opacity: 0.8;
      transform: scale(1.01);
    }
  }
}

.contribution-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 16px;
  gap: 0.5rem;
  flex-shrink: 0;
}

.contribution-amount {
  display: grid;
  grid-template-columns: 2rem 2rem;
}

.remove-cart-item {
  cursor: pointer;
  height: 1.25rem;
  width: 1.25rem;

  &:hover {
    opacity: 0.8;
    transform: scale(1.01);
  }

  .remove-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .remove-icon-background {
    &:hover {
      background: var(--bg-secondary-color);
      border-radius: 0.5rem;
    }
    cursor: pointer;
  }
}
</style>
