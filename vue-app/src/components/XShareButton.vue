<template>
  <div class="button-container">
    <links :to="postUrl" :hideArrow="true" class="btn-info" data-show-count="false">
      <i18n-t tag="div" scope="global" keypath="xShareButton.label" class="button-label">
        <template #x><img :src="xLogo" /></template>
      </i18n-t>
    </links>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { getAssetsUrl } from '@/utils/url'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()

const encodedText = computed(() => encodeURIComponent(t('dynamic.socialMedia.x.text', { appUrl: route.url })))
const postUrl = computed(() => `https://twitter.com/share?text=${encodedText.value}`)

const xLogo = computed(() => {
  return getAssetsUrl('x-logo.svg')
})
</script>

<style scoped lang="scss">
.button-container {
  margin: 20px 0;
}
.button-label {
  display: flex;
  align-items: center;
  justify-content: center;
  column-gap: 5px;

  img {
    width: 15px;
    height: 15px;
    filter: var(--img-filter, invert(1));
    vertical-align: center;
  }
}
</style>
