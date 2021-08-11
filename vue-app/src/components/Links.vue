<template>
  <a
    v-if="isExternal && hideArrow"
    :class="className"
    :href="to"
    :aria-label="ariaLabel"
    target="_blank"
    rel="noopener"
  >
    <slot />
  </a>
  <a
    v-else-if="isExternal"
    :class="`external-link ${className}`"
    :href="to"
    :aria-label="ariaLabel"
    target="_blank"
    rel="noopener"
  >
    <slot />
  </a>
  <router-link v-else :class="className" :href="to" :aria-label="ariaLabel">
    <slot />
  </router-link>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component
export default class extends Vue {
  @Prop() to!: string
  @Prop() href!: string
  @Prop() hideArrow!: boolean
  @Prop() className!: string
  @Prop() ariaLabel!: string

  isExternal = false

  mounted() {
    if (this.href) {
      this.to = this.href
    }
    this.isExternal = this.to.includes('http' || 'mailto:')
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.external-link {
  &:after {
    margin-left: 0.125em;
    margin-right: 0.3em;
    display: inline;
    content: '↗';
    transition: all 0.1s ease-in-out;
    font-style: normal;
  }
  &:hover {
    &:after {
      transform: translate(0.1em, -0.1em);
    }
  }
}
</style>
