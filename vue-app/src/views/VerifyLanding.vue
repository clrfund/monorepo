@ -0,0 +1,36 @@
<template>
  <div>
    <loader v-if="loading" />
    <div v-if="!loading">
      <div class="gradient">
        <div class="hero">
          <image-responsive title="robot" />
        </div>
      </div>
      <div class="content">
        <div class="flex-title">
          <h1>Prove you’re only using one account</h1>
          <h4 class="content-subtitle">
            We use BrightID to stop bots and cheaters, and make our funding more
            democratic.
          </h4>
        </div>
        <h4>What you'll need</h4>
        <ul class="text-base list">
          <li>
            BrightID – available on
            <a
              href="https://apps.apple.com/us/app/brightid/id1428946820"
              target="_blank"
            >
              iOS</a
            >
            or
            <a
              href="https://play.google.com/store/apps/details?id=org.brightid"
              target="_blank"
              >Android</a
            >
          </li>
          <li>An Ethereum wallet, with enough gas for two transactions</li>
          <li>Access to Zoom or Google Meet</li>
        </ul>
        <links to="/about/sybil-resistance">
          <h4>Why is this important?</h4>
        </links>
        <div v-if="!hasRoundStarted" class="warning-container text-base">
          There's not yet an open funding round. Get prepared now so you're
          ready for when the next one begins!
        </div>
        <div v-else-if="isRoundOver" class="warning-container text-base">
          The current round is no longer accepting new contributions. You can
          still get BrightID verified to prepare for next time.
        </div>
        <div v-else-if="isRoundFull" class="warning-container text-base">
          Contributions closed early – you can no longer donate! Due to the
          community's generosity and some technical constraints we had to close
          the round earlier than expected. If you already contributed, you still
          have time to reallocate if you need to. If you didn't get a chance to
          contribute, you can still help by donating to the matching pool
        </div>
        <div class="button-spacing">
          <wallet-widget
            v-if="!currentUser"
            :isActionButton="true"
            :fullWidthMobile="true"
          />
          <links v-if="currentUser" to="/verify/connect" class="btn-action">
            Connect
          </links>
          <links to="/projects" class="btn-link">Go back</links>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import * as humanizeDuration from 'humanize-duration'
import { commify, formatUnits } from '@ethersproject/units'

import { getCurrentRound } from '@/api/round'
import { User } from '@/api/user'

import Breadcrumbs from '@/components/Breadcrumbs.vue'
import Links from '@/components/Links.vue'
import Loader from '@/components/Loader.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import WalletWidget from '@/components/WalletWidget.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'

@Component({
  components: {
    Breadcrumbs,
    Links,
    Loader,
    ProgressBar,
    RoundStatusBanner,
    WalletWidget,
    ImageResponsive,
  },
})
export default class VerifyLanding extends Vue {
  loading = true
  currentRound: string | null = null

  async created() {
    this.currentRound = await getCurrentRound()
    this.loading = false
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get balance(): string | null {
    const balance = this.currentUser?.balance
    if (balance === null || typeof balance === 'undefined') {
      return null
    }
    return commify(formatUnits(balance, 18))
  }

  get hasRoundStarted(): boolean {
    return !!this.currentRound
  }

  get isRoundFull(): boolean {
    return this.$store.getters.isRoundContributorLimitReached
  }

  get isRoundOver(): boolean {
    return this.$store.getters.hasContributionPhaseEnded
  }

  formatDuration(value: number): string {
    return humanizeDuration(value * 1000, { largest: 1 })
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

h1 {
  margin-top: 1.5rem;
}

.gradient {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  background: $clr-green;

  .hero {
    position: fixed;
    bottom: -4rem;
    right: -12rem;
    height: 100%;
    width: 100%;
    mix-blend-mode: luminosity;

    @media (max-width: $breakpoint-m) {
      width: 100%;
      padding-bottom: 0rem;
    }

    img {
      position: absolute;
      bottom: 0;
      right: calc(-700px + 50vw);
      mix-blend-mode: luminosity;
      max-width: 88%;
      max-height: 100%;

      @media (max-width: $breakpoint-m) {
        right: 1rem;
        width: 100%;
      }
    }
  }
}

.content {
  position: relative;
  z-index: 1;
  padding: $content-space;
  width: min(100%, 578px);
  margin-left: 2rem;
  margin-top: 6rem;
  color: $clr-white;

  @media (max-width: $breakpoint-m) {
    width: 100%;
    margin: 0;
  }

  .flex-title {
    display: flex;
    gap: 0.5rem;
    align-items: left;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    flex-direction: column;

    img {
      width: 1rem;
      height: 1rem;
      position: relative;
      right: 0;
    }

    h4 {
      font-weight: 400;
    }
  }
}

.list {
  a {
    color: $clr-white;
  }
}

a {
  color: $clr-white;
}

.icon {
  width: 1rem;
  height: 1rem;
  position: relative;
}

.button-spacing {
  margin-top: 3rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;

  a {
    width: 100%;
  }
}

.warning-container {
  margin-top: 1rem;
  background: transparent;
  color: $clr-error;
  border: 2px solid $clr-error;
  border-radius: 20px;
  padding: 1.5rem 2rem;
}
</style>
