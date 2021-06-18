<template>
  <div v-if="!isVerified" class="get-prepared">
    <bright-id-widget v-if="prepStarted" v-bind:projectCard="true" />
    <span v-else aria-label="rocket" class="emoji">🚀</span>
    <div>
    <h2 class="prep-title">Get prepared</h2>
    <p class="prep-text">You’ll need to set up a few things before you contribute. You can do this any time before or during the funding round.</p>
    </div>
    <router-link v-if="!prepStarted" to="/verify" class="btn-action">Start prep</router-link>
    <router-link v-else to="/verify" class="btn-action">Continue setup</router-link>
  </div> 
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import BrightIdWidget from '@/components/BrightIdWidget.vue'

@Component({
  components: {
    BrightIdWidget,
  },
})
export default class CallToActionCard extends Vue {
  prepStarted = true // TODO configure logic - this is true if 1st step of get-verified is complete, which is linking ETH address & BrightID profile
  isVerified = true // TODO currentUser.isVerified
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.get-prepared {
  background: $bg-secondary-color;
  border: 1px solid #000000;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  justify-content: space-between;
}

.prep-title {
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 2rem;
    font-weight: 700;
  }

  .prep-title-continue {
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
  }

.prep-text {
  font-family: Inter;
  font-size: 16px;
  line-height: 150%;
}

.emoji {
  font-size: 32px;
}
</style>
