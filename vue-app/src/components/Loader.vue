<template>
  <div class="loader" />
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.loader {
  display: block;
  height: 40px;
  margin: $content-space auto;
  width: 40px;
}

.loader:after {
  content: ' ';
  display: block;
  width: 32px;
  height: 32px;
  margin: 4px;
  border-radius: 50%;
  border: 6px solid var(--loader-color);
  border-color: var(--loader-color) transparent var(--loader-color) transparent;
  animation: loader 1.2s linear infinite;
}

@keyframes loader {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
