<template>
  <div class="info">
    <span class="icon" aria-label="info icon">ℹ</span>
    {{ message }}
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component
export default class Info extends Vue {
  @Prop() message!: string
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.info {
  background-color: var(--bg-transparent);
  border: 1px solid $highlight-color;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  line-height: 150%;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  @media (max-width: $breakpoint-m) {
    flex-direction: column;
    padding-bottom: 1rem;
    align-items: flex-start;
  }
}

.icon {
  font-size: 24px;
  padding: 0.5rem;
  @media (max-width: $breakpoint-m) {
    padding: 0.5rem 0rem;
  }
}
</style>
