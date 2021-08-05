<template>
  <!-- Get prepared CTA -->
  <div class="get-prepared" v-if="showUserVerification">
    <bright-id-widget v-if="hasStartedVerification" :isProjectCard="true" />
    <span v-else aria-label="rocket" class="emoji">🚀</span>
    <div>
      <h2 class="prep-title">Get prepared</h2>
      <p class="prep-text">
        You’ll need to set up a few things before you contribute. You can do
        this any time before or during the funding round.
      </p>
    </div>
    <router-link v-if="!hasStartedVerification" to="/verify" class="btn-action"
      >Start prep</router-link
    >
    <router-link v-else to="/verify" class="btn-action"
      >Continue setup</router-link
    >
  </div>
  <!-- Reallocate CTA -->
  <div class="get-prepared" v-else-if="$store.getters.canUserReallocate">
    <span aria-label="thinking face" class="emoji">🤔</span>
    <div>
      <h2 class="prep-title">Changed your mind?</h2>
      <p class="prep-text">
        You still have time to reallocate your contributions.
      </p>
      <div class="btn-action" @click="toggleCartPanel()">Open cart</div>
    </div>
  </div>
  <!-- Round is over notification -->
  <div
    class="get-prepared"
    v-else-if="$store.getters.hasContributionPhaseEnded"
  >
    <span aria-label="hand" class="emoji">🤚</span>
    <div>
      <h2 class="prep-title">Round over for contributions</h2>
      <p class="prep-text">
        You can no longer make any contributions this round.
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import BrightIdWidget from '@/components/BrightIdWidget.vue'

import { TOGGLE_SHOW_CART_PANEL } from '@/store/mutation-types'
import { userRegistryType, UserRegistryType } from '@/api/core'

@Component({
  components: {
    BrightIdWidget,
  },
})
export default class CallToActionCard extends Vue {
  get hasStartedVerification(): boolean {
    return (
      this.$store.state.currentUser &&
      this.$store.state.currentUser.brightId.isLinked
    )
  }

  get isUserVerified(): boolean {
    return (
      this.$store.state.currentUser &&
      this.$store.state.currentUser.brightId.isVerified
    )
  }

  get showUserVerification(): boolean {
    return (
      userRegistryType === UserRegistryType.BRIGHT_ID && !this.isUserVerified
    )
  }

  toggleCartPanel() {
    this.$store.commit(TOGGLE_SHOW_CART_PANEL, true)
  }
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
