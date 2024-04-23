<template>
  <form action="#" class="input-button">
    <img v-if="input" class="token-icon" height="24" :src="appStore.tokenLogoUrl" />
    <input
      v-if="input"
      class="input"
      type="number"
      :value="modelValue"
      :class="input.class"
      :required="input.required"
      :placeholder="input.placeholder"
      :disabled="input.disabled"
      @input="handleInputChange"
    />
    <input
      v-if="button"
      class="button"
      type="submit"
      :value="button.text"
      :class="{ wide: button.wide }"
      :disabled="button.disabled"
      @click.prevent="emit('click')"
    />
  </form>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores'

const appStore = useAppStore()

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

interface Props {
  button?: buttonType
  input?: inputType
  modelValue?: string
}

defineProps<Props>()

const emit = defineEmits(['update:modelValue', 'click'])

function handleInputChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
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
  box-shadow:
    0px 4px 4px 0px 0,
    0,
    0,
    0.25;
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
