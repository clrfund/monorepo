<template>
  <div>
    <div class="gradient">
      <div class="hero">
        <image-responsive title="robot" />
      </div>
    </div>
    <div class="sucess-content">
      <span class="emoji">🎉</span>
      <div class="flex-title">
        <h1>Project submitted!</h1>
        <transaction-receipt :hash="$route.params.hash" />
      </div>
      <h4>You’re almost on board this funding round.</h4>
      <ul class="text-base list">
        <li>
          Your project just needs to go through some final checks. If everything
          is ok, your project will go live within 5 minutes.
        </li>
        <li>
          If your project fails any checks, we'll let you know by email and
          return your deposit.
        </li>
      </ul>
      <div class="button-spacing">
        <links to="/projects" class="btn-action">View projects</links>
        <links to="/" class="btn-link">Go home</links>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import * as humanizeDuration from 'humanize-duration'

import ProgressBar from '@/components/ProgressBar.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import TransactionReceipt from '@/components/TransactionReceipt.vue'
import Warning from '@/components/Warning.vue'
import Links from '@/components/Links.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'

import { RegistryInfo } from '@/api/recipient-registry-optimistic'
import { chain } from '@/api/core'

@Component({
  components: {
    ProgressBar,
    RoundStatusBanner,
    TransactionReceipt,
    Warning,
    Links,
    ImageResponsive,
  },
})
export default class ProjectAdded extends Vue {
  challengePeriodDuration: number | null = null

  async created() {
    this.challengePeriodDuration = this.registryInfo.challengePeriodDuration
  }

  get registryInfo(): RegistryInfo {
    return this.$store.state.recipientRegistryInfo
  }

  get blockExplorerUrl(): string {
    return `${chain.explorer}/tx/${this.$route.params.txHash}`
  }

  formatDuration(seconds: number): string {
    return humanizeDuration(seconds * 1000, { largest: 1 })
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.emoji {
  font-size: 7rem;
}

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
    bottom: -4em;
    right: -12rem;
    height: 100%;
    width: 100%;
    mix-blend-mode: luminosity;

    @media (max-width: $breakpoint-m) {
      visibility: hidden;
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

.sucess-content {
  position: relative;
  z-index: 1;
  padding: $content-space;
  width: min(100%, 512px);
  color: $clr-white;
  max-width: 100%;
  display: flex;
  flex-direction: column;

  @media (max-width: $breakpoint-m) {
    max-width: 100%;
    margin: 0;
    width: 90%;
    justify-content: center;
    padding: $content-space - 1rem;
  }

  .flex-title {
    display: flex;
    gap: 0.5rem;
    align-items: left;
    margin-bottom: 3rem;
    flex-wrap: wrap;
    flex-direction: column;

    img {
      width: 1rem;
      height: 1rem;
      position: relative;
      right: 0;
    }
  }

  .list {
    font-size: 18px;
    line-height: 140%;
  }
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
  @media (max-width: $breakpoint-m) {
    flex-direction: column;
  }
}
</style>
