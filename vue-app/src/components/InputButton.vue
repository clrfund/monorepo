<template>
  <form action="#" class="input-button">
    <img
      v-if="input"
      class="token-icon"
      height="24px"
      :src="require(`@/assets/${tokenLogo}`)"
    />
    <input
      v-if="input"
      class="text-body input"
      type="number"
      :class="input.class"
      :value="value"
      :required="input.required"
      :placeholder="input.placeholder"
      :disabled="input.disabled"
      @input="$emit('input', $event.target.value)"
      @blur="$emit('blur', $event.target.value)"
    />
    <input
      v-if="button"
      class="button"
      type="submit"
      :value="button.text"
      :class="{ wide: button.wide }"
      :disabled="button.disabled"
      @click.prevent="$emit('click')"
    />
  </form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { getTokenLogo } from '@/utils/tokens'

type buttonType = {
  text: string
  disabled?: boolean
  wide?: boolean
}

type inputType = {
  placeholder?: string
  required?: boolean
  class?: string
  disabled?: boolean
}

@Component
export default class InputButton extends Vue {
  @Prop() button!: buttonType
  @Prop() input!: inputType
  @Prop() value!: number

  get tokenLogo(): string {
    const { nativeTokenSymbol } = this.$store.state.currentRound
    return getTokenLogo(nativeTokenSymbol)
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.token-icon {
  margin-left: 0.25rem;
}

.input-button {
  background: var(--bg-cart-input);
  border-radius: 2rem;
  border: 1px solid $clr-dark;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.125rem;
  width: 100%;
  box-sizing: border-box;
}

.input {
  background: none;
  border: none;
  color: $clr-dark;
  width: 100%;
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
input[type='number'] {
  -moz-appearance: textfield;
}

.button {
  @include button(white, $clr-dark, none);
  height: 2rem;
  font-size: 14px;
  line-height: 16.42px;
  font-weight: 700;
  text-transform: uppercase;
  margin: 0 0.25rem;

  &[disabled],
  &[disabled]:hover {
    cursor: not-allowed;
  }
}

.wide {
  background: transparent !important;
  color: $clr-dark !important;
  width: 100%;
  z-index: 1;
  &:hover {
    background: var(--bg-light-highlight);
  }
}
</style>
