<template>
  <div class="warning">
    <span class="icon" aria-label="warning icon">⚠️</span>
    {{ message }}
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component
export default class Warning extends Vue {
  @Prop() message!: string
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.warning {
  background: $warning-color-bg;
  border: 1px solid $warning-color;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  color: $warning-color;
  font-size: 14px;
  font-family: Inter;
  line-height: 150%;
  text-transform: uppercase;
  font-weight: 500;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  @media (max-width: $breakpoint-m) {
    flex-direction: column;
    padding-bottom: 1rem;
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
