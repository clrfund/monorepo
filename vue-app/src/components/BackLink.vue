<template>
  <links
    :to="to"
    :class="{
      back: true,
      desktop: !alsoShowOnMobile,
    }"
    >{{ text }}</links
  >
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class extends Vue {
  @Prop() alsoShowOnMobile!: boolean
  @Prop() to!: string
  @Prop() text!: string
}
</script>

<style lang="scss" scoped>
.back {
  position: relative;
  display: flex;
  flex: 1 0 auto;
  justify-content: flex-start;
  align-items: center;
  padding: 1rem;
  color: var(--text-color);
  &:hover {
    opacity: 0.8;
  }
}
</style>
