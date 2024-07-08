<template>
  <img v-if="isStaticImageBroken" :src="imageSrc" :alt="alt" :class="class" />
  <img v-else :src="staticImageSrc" :alt="alt" @error="handleBrokenStaticImage" :class="class" />
</template>

<script setup lang="ts">
import { getIpfsUrl, getStaticUrlByIpfsHash } from '@/utils/url'

interface Props {
  class?: string
  src?: string
  alt: string
}

const isStaticImageBroken = ref(false)

const props = defineProps<Props>()

const staticImageSrc = computed(() => getStaticUrlByIpfsHash(props.src) || '')
const imageSrc = computed(() => getIpfsUrl(props.src) || '')

function handleBrokenStaticImage() {
  isStaticImageBroken.value = true
}
</script>
