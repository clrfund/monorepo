<template>
  <div class="layout-steps">
    <slot/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class LayoutSteps extends Vue {

}
</script>

<style scoped lang="scss">
  .layout-steps {
    margin: 3rem 6rem;
  }
</style>
