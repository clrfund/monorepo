<template>
  <img
    :srcset="srcset"
    sizes="(max-width: 710px) 360px,
     (max-width: 810px) 360px, 
     (max-width: 1080px) 720px, 
     (max-width: 1440px) 1080px, 
     (max-width: 2160px) 2160px, 1440px"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

const BREAKPOINTS = [360, 720, 1080, 1440, 2160, 2880]

@Component
export default class ImageResponsive extends Vue {
  @Prop() title!: string

  get src() {
    return this.requirePath(this.title, 1080)
  }

  get srcset() {
    const paths = BREAKPOINTS.map((breakpoint) => {
      const path = this.requirePath(this.title, breakpoint)
      return `${path} ${breakpoint}w`
    })

    return paths.join(', ')
  }

  requirePath(name: string, breakpoint: number) {
    return require(`../assets/${name}/${name}_w${breakpoint}.png`)
  }
}
</script>
