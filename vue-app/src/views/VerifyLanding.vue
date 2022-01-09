@ -0,0 +1,36 @@
<template>
  <div>
    <round-status-banner />
    <loader v-if="loading" />
    <div v-if="!loading">
      <div class="gradient">
        <img src="@/assets/moon.png" class="moon" />
        <div class="hero">
          <image-responsive title="newrings" />
        </div>
      </div>
      <div class="content">
        <breadcrumbs :links="links" />
        <div class="flex-title">
          <h1>Prove you’re only using one account</h1>
        </div>
        <div class="subtitle">
          We use BrightID to stop bots and cheaters, and make our funding more
          democratic.
        </div>
        <h2>
          What you'll need
          <img
            v-tooltip="{
              content: `If you've previously donated to a CLR round, use the same wallet to bypass some BrightID steps`,
              trigger: 'hover click',
            }"
            width="16px"
            src="@/assets/info.svg"
            class="info-icon"
          />
        </h2>
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
        <links to="/about-sybil-resistance/">Why is this important?</links>
        <div v-if="isRoundNotStarted" class="join-message">
          There's not yet an open funding round. Get prepared now so you're
          ready for when the next one begins!
        </div>
        <div v-else-if="isRoundOver" class="warning-message">
          The current round is no longer accepting new contributions. You can
          still get BrightID verified to prepare for next time.
        </div>
        <div v-else-if="isRoundFull" class="warning-message">
          Contributions closed early – you can no longer donate! Due to the
          community's generosity and some technical constraints we had to close
          the round earlier than expected. If you already contributed, you still
          have time to reallocate if you need to. If you didn't get a chance to
          contribute, you can still help by donating to the matching pool
        </div>
        <div class="btn-container mt2">
          <wallet-widget
            v-if="!currentUser"
            :isActionButton="true"
            :fullWidthMobile="true"
          />
          <links v-if="currentUser" to="/verify/connect" class="btn-primary">
            I have BrightID installed
          </links>
          <links to="/projects" class="btn-secondary">Go back</links>
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

  get isRoundNotStarted(): boolean {
    return this.$store.getters.isRoundJoinPhase
  }

  get isRoundFull(): boolean {
    return this.$store.getters.isRoundContributorLimitReached
  }

  get isRoundOver(): boolean {
    return this.$store.getters.hasContributionPhaseEnded
  }

  get links(): Array<{ link: string; url: string }> {
    const url = `${this.$route.path}`

    const links = url
      .split('/')
      .splice(1)
      .filter((link) => !link.includes('0x')) // Filter out address hash
      .map((link) => {
        return {
          link: link === 'project' ? 'projects' : link,
          url: url.split(link)[0] + (link === 'project' ? 'projects' : link), // No way back to projects, and in the case of breadcrumbs makes sense to go back to projects if on a project detail page
        }
      })

    return links
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

  @media (max-width: $breakpoint-s) {
    background: linear-gradient(
      171.34deg,
      rgba(0, 0, 0, 0.8) 63.5%,
      rgba(196, 196, 196, 0) 78.75%
    );
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

.join-message {
  border: 1px solid $clr-green;
  background: $bg-primary-color;
  border-radius: 1rem;
  padding: 1rem;
  margin: 1rem 0 0;
  color: $clr-green;
  font-size: 14px;
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

.info-icon {
  margin-left: 0.5rem;
}
</style>
