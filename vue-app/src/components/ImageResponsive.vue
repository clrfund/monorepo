<template>
  <img
    sizes="(max-width: 710px) 360px,
     (max-width: 810px) 360px,
     (max-width: 1080px) 720px,
     (max-width: 1440px) 1080px,
     (max-width: 2160px) 2160px, 1440px"
    :src="src"
    :srcset="srcset"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getAssetsUrl } from '@/utils/url'

const BREAKPOINTS = [360, 720, 1080, 1440, 2160, 2880]

interface Props {
  title: string
  height?: string
}

const props = defineProps<Props>()

const src = computed(() => {
  return requirePath(props.title, 1080)
})

const srcset = computed(() => {
  const paths = BREAKPOINTS.map(breakpoint => {
    const path = requirePath(props.title, breakpoint)
    return `${path} ${breakpoint}w`
  })

  return paths.join(', ')
})

function requirePath(name: string, breakpoint: number) {
  return getAssetsUrl(`${name}/${name}_w${breakpoint}.png`)
}
</script>
