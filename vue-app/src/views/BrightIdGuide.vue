<template>
  <div>
    <h2 class="step-title">Get verified</h2>
    <p>
      BrightID verification helps prove that you’re a unique human. To get
      verified, you need to join a BrightId party where other members can verify
      you're "not a bot".
    </p>
    <accordion
      open="true"
      tag="🚀 Fastest"
      header="Join a BrightId party"
      content="BrightID run verification parties regularly. Join the call,
    meet other new users, and they'll verify you’re a human and not a
    bot. Quick and painless, even for you introverts out there."
      :linkButton="{
        link: 'https://meet.brightid.org/#/',
        text: 'View party schedule',
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
