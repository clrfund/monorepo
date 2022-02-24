<template>
  <div class="outer-box">
    <div class="inner-box">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component({})
export default class Box extends Vue {}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.outer-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.inner-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: $bg-secondary-color;
  padding-top: 20px;
  width: 400px;
  margin: 20px 0;
  border-radius: 20px;

  @media (max-width: $breakpoint-m) {
    width: 100%;
  }
}
</style>
