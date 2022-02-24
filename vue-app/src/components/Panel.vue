<template>
  <div class="panel-background">
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default class Panel extends Vue {}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.panel-background {
  background: $bg-secondary-color;
  border-radius: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}
</style>
