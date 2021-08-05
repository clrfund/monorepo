@ -0,0 +1,36 @@
<template>
  <div>
    <round-status-banner />
    <div class="gradient">
      <img src="@/assets/moon.png" class="moon" />
      <div class="hero">
        <img src="@/assets/newrings.png" />
      </div>
    </div>
    <div class="content">
      <div class="flex-title">
        <h1>Prove you’re only using one account</h1>
      </div>
      <div class="subtitle">
        We use BrightID to stop bots and cheaters, and make our funding more
        democratic.
      </div>
      <h2>What you'll need</h2>
      <ul>
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
      <router-link to="/sybil-resistance/">Why is this important?</router-link>
      <div v-if="isRoundFullOrOver" class="warning-message">
        The current round is no longer accepting new contributions. You can
        still get BrightID verified to prepare for next time.
      </div>
      <div class="btn-container">
        <wallet-widget v-if="!currentUser" :isActionButton="true" />
        <router-link v-if="currentUser" to="/verify/connect" class="btn-primary"
          >I have BrightID installed</router-link
        >
        <router-link to="/projects" class="btn-secondary">Go back</router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import * as humanizeDuration from 'humanize-duration'
import { User } from '@/api/user'
import ProgressBar from '@/components/ProgressBar.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import { commify, formatUnits } from '@ethersproject/units'
import WalletWidget from '@/components/WalletWidget.vue'

@Component({
  components: { ProgressBar, RoundStatusBanner, WalletWidget },
})
export default class VerifyLanding extends Vue {
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

  get isRoundFullOrOver(): boolean {
    return (
      this.$store.getters.isMessageLimitReached ||
      this.$store.getters.hasContributionPhaseEnded
    )
  }

  formatDuration(value: number): string {
    return humanizeDuration(value * 1000, { largest: 1 })
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.emoji {
  font-size: 40px;
}

h1 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 40px;
  line-height: 120%;
}

h2 {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 24px;
  letter-spacing: -0.015em;
}

p {
  font-size: 16px;
  line-height: 30px;
}

li {
  font-size: 16px;
  line-height: 30px;
}

ul {
  padding-left: 1.5rem;
}

.gradient {
  background: $clr-pink-dark-gradient;
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;

  .moon {
    position: absolute;
    top: 1rem;
    right: 1rem;
    mix-blend-mode: exclusion;
  }
  .hero {
    display: flex;
    position: fixed;
    top: 0;
    right: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(
      286.78deg,
      rgba(173, 131, 218, 0) -32.78%,
      #191623 78.66%
    );
    @media (max-width: $breakpoint-m) {
      padding: 2rem 0rem;
      padding-bottom: 0rem;
    }

    img {
      position: absolute;
      bottom: 0;
      right: 0;
      mix-blend-mode: exclusion;
      width: 66%;
      @media (max-width: $breakpoint-m) {
        right: 0;
        width: 100%;
      }
    }
  }
}
.content {
  position: relative;
  z-index: 1;
  padding: $content-space;
  width: min(100%, 512px);
  margin: 2rem;
  box-sizing: border-box;
  @media (max-width: $breakpoint-m) {
    width: 100%;
    margin: 0;
    padding-bottom: 35vw;
  }

  .flex-title {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;

    img {
      width: 1rem;
      height: 1rem;
      position: relative;
      right: 0;
    }
  }

  .btn-container {
    margin-top: 2rem;
  }
}

.subtitle {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.icon {
  width: 1rem;
  height: 1rem;
  position: relative;
}

.warning-message {
  border: 1px solid $error-color;
  background: $bg-primary-color;
  border-radius: 1rem;
  padding: 1rem;
  margin: 1rem 0 0;
  color: $error-color;
  font-size: 14px;
}
</style>
