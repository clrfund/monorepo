<template>
  <div class="search-container">
    <img src="@/assets/search.svg" />
    <input
      :value="value"
      :placeholder="placeholder"
      autocomplete="on"
      class="input"
      type="text"
      @input="$emit('input', $event.target.value)"
    />
    <img
      v-if="value.length > 0"
      @click="clearSearch"
      src="@/assets/close.svg"
      height="20"
      class="pointer"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component
export default class SearchInput extends Vue {
  @Prop({ default: '' }) placeholder!: string
  @Prop({ default: '' }) value!: string

  clearSearch(): void {
    this.$emit('input', '')
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.search-container {
  background-color: var(--bg-secondary-color);
  padding: 0.5rem 1rem;
  border: 2px solid $button-color;
  border-radius: 16px;
  display: flex;
  font-size: 16px;
  font-family: Inter;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0em;
  @media (max-width: $breakpoint-m) {
    margin-top: 0.5rem;
  }
  width: auto;
  img {
    margin-right: 10px;
  }

  input {
    background-color: transparent;
    border: none;
    font-size: 14px;
    padding: 0;
    width: 100%;

    &::placeholder {
      opacity: 1;
    }
  }
}
</style>
