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
      class="input"
      type="number"
      name="amount"
      id="amount"
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

.input-button {
  background: var(--text-body);
  border-radius: 2rem;
  border: 2px solid var(--bg-primary-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.125rem;
  z-index: 100;
  width: 100%;
  box-sizing: border-box;
}

.input {
  background: none;
  border: none;
  color: var(--bg-primary-color);
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
  padding: 0.5rem 1rem;
  background: var(--bg-primary-color);
  color: var(--text-color);
  border-radius: 32px;
  font-size: 16px;
  font-family: Inter;
  text-align: center;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0px 4px 4px 0px 0, 0, 0, 0.25;

  &[disabled],
  &[disabled]:hover {
    cursor: not-allowed;
  }
}

.wide {
  line-height: 150%;
  width: 100%;
  z-index: 1;
  &:hover {
    background: var(--bg-light-highlight);
  }
}
</style>
