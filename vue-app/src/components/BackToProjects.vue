<template>
  <router-link to="/projects" :class="{
    back: true,
    desktop: !alsoShowOnMobile,
  }">Back to projects</router-link>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component
export default class extends Vue {
  @Prop() alsoShowOnMobile!: boolean
}
</script>

<style lang="scss" scoped>
.back {
  position: relative;
  display: flex;
  flex: 1 0 auto;
  justify-content: flex-end;
  align-items: center;
  padding: 1rem;
  text-decoration: underline;
}
</style>