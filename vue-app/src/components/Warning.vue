<template>
  <div class="warning">
    <span class="icon" aria-label="warning icon">⚠️</span>
    {{ message }}
  </div>
</template>

<script setup lang="ts">
interface Props {
  message: string
}

defineProps<Props>()
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.warning {
  background: var(--warning-background);
  border: 1px solid var(--warning-border);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  color: var(--warning-color);
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
