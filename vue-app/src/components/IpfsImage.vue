<template>
  <template v-if="imageType === ImageType.NoImage" />
  <img v-else @error="handleBrokenImage" :src="imageSrc" :alt="alt" :class="class" />
</template>

<script setup lang="ts">
import { getIpfsUrl, getStaticUrlByIpfsHash } from '@/utils/url'

interface Props {
  class?: string
  src?: string
  alt: string
}

enum ImageType {
  Ipfs,
  Static,
  NoImage,
}

const props = defineProps<Props>()

const imageType = ref(ImageType.Ipfs)
const imageSrc = ref(getIpfsUrl(props.src) || '')

function handleBrokenImage() {
  switch (imageType.value) {
    case ImageType.Ipfs:
      imageType.value = ImageType.Static
      imageSrc.value = getStaticUrlByIpfsHash(props.src) || ''
      break
    default:
      imageType.value = ImageType.NoImage
      imageSrc.value = ''
  }
}
</script>
