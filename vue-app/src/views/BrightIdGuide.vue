<template>
  <div>
    <h2 class="step-title">{{ $t('brightIDGuide.heading.h2') }}</h2>
    <p>
      {{ $t('brightIDGuide.heading.p') }}
    </p>
    <accordion
      :tag="$t('brightIDGuide.accordion.fastest.tag')"
      :header="$t('brightIDGuide.accordion.fastest.header')"
      :content="$t('brightIDGuide.accordion.fastest.content')"
      :linkButton="{
        link: 'https://meet.brightid.org/#/',
        text: $t('brightIDGuide.accordion.fastest.linkButton'),
      }"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Accordion from '@/components/Accordion.vue'

@Component({
  components: {
    Accordion,
  },
})
export default class BrightIdGuide extends Vue {
  sponsorTxHash = ''
  sponsorTxError = ''
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';
</style>
