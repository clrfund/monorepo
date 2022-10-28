<template>
  <div id="join-landing">
    <div class="gradient">
      <div class="hero">
        <image-responsive title="core" />
      </div>
    </div>

    <round-status-banner />

    <div class="breadcrumbs">
      <breadcrumbs />
    </div>
    <div class="content" v-if="loading">
      <h1>{{ $t('joinLanding.loading') }}</h1>
      <loader />
    </div>

    <div class="content" v-else-if="$store.getters.hasContributionPhaseEnded">
      <div class="big-emoji">☹</div>
      <h1>{{ $t('joinLanding.closed.h1') }}</h1>
      <div id="subtitle" class="subtitle">
        {{ $t('joinLanding.closed.subtitle1') }}
      </div>
      <div class="subtitle mt2" id="subtitle">
        {{ $t('joinLanding.closed.subtitle2_t1') }}
        <links to="https://ethereum.org/en/community/grants/">{{
          $t('joinLanding.closed.link1')
        }}</links
        >{{ $t('joinLanding.closed.subtitle2_t2') }}
        <links to="https://twitter.com/clrfund">@clrfund</links>
      </div>
      <div class="btn-container">
        <links to="/" class="btn-primary">{{
          $t('joinLanding.closed.link2')
        }}</links>
      </div>
    </div>

    <div class="content" v-else-if="isRoundFull">
      <div class="big-emoji">☹</div>
      <h1>{{ $t('joinLanding.full.h1') }}</h1>
      <div id="subtitle" class="subtitle">
        {{ $t('joinLanding.full.subtitle1') }}
      </div>
      <div class="subtitle mt2" id="subtitle">
        {{ $t('joinLanding.full.subtitle2_t1') }}
        <links to="https://ethereum.org/en/community/grants/">{{
          $t('joinLanding.full.link1')
        }}</links
        >{{ $t('joinLanding.full.subtitle2_t2') }}
        <links to="https://twitter.com/clrfund">@clrfund</links>
      </div>
      <div class="btn-container">
        <links to="/" class="btn-primary">{{
          $t('joinLanding.full.link2')
        }}</links>
        <links to="/about" class="btn-secondary">{{
          $t('joinLanding.full.link3')
        }}</links>
      </div>
    </div>

    <div class="content" v-else-if="$store.state.currentRound">
      <h1>{{ $t('joinLanding.open.h1') }}</h1>
      <div class="subtitle">
        {{ $t('joinLanding.open.subtitle1_t1') }}
        <strong>{{ formatAmount(deposit) }} {{ depositToken }}</strong
        >{{ $t('joinLanding.open.subtitle1_t2') }}
      </div>
      <div class="subtitle mt2">
        {{ $t('joinLanding.open.subtitle2', { maxRecipients: maxRecipients }) }}
      </div>
      <div class="info-boxes">
        <div class="apply-callout">
          <div class="countdown-label caps">
            {{ $t('joinLanding.open.div1') }}
          </div>
          <div class="countdown caps">
            <time-left
              valueClass="none"
              unitClass="none"
              :date="signUpDeadline"
            />
          </div>
        </div>
        <div class="apply-callout">
          <div class="countdown-label caps">
            {{ $t('joinLanding.open.div2') }}
          </div>
          <div class="countdown caps">{{ $t('joinLanding.open.div3') }}</div>
        </div>
        <div v-if="isRoundFillingUp" class="apply-callout-warning">
          <div class="filling-up-container">
            <div class="countdown caps">
              {{
                $t('joinLanding.open.div4', {
                  spacesRemainingString: spacesRemainingString,
                })
              }}
            </div>
            <div class="dropdown">
              <img class="icon" @click="openTooltip" src="@/assets/info.svg" />
              <div id="myTooltip" class="hidden button-menu">
                {{ $t('joinLanding.open.div5') }}
                <links to="/about/maci">{{
                  $t('joinLanding.open.link1')
                }}</links>
              </div>
            </div>
          </div>
          <p class="warning-text">
            {{ $t('joinLanding.open.p1') }}
          </p>
        </div>
      </div>
      <div class="btn-container">
        <button class="btn-secondary" @click="toggleCriteria">
          {{ $t('joinLanding.open.button1') }}
        </button>
        <links to="/join/project" class="btn-primary">{{
          $t('joinLanding.open.link2')
        }}</links>
      </div>
    </div>

    <div class="content" v-else-if="$store.getters.isRoundJoinPhase">
      <h1>{{ $t('joinLanding.join.h1') }}</h1>
      <div class="subtitle">
        {{ $t('joinLanding.join.subtitle1_t1') }}
        <strong>{{ formatAmount(deposit) }} {{ depositToken }}</strong
        >{{ $t('joinLanding.join.subtitle1_t2') }}
      </div>
      <div class="subtitle mt2">
        {{ $t('joinLanding.join.subtitle2', { maxRecipients: maxRecipients }) }}
      </div>
      <div class="info-boxes">
        <div class="apply-callout">
          <div class="countdown-label caps">
            {{ $t('joinLanding.join.div1') }}
          </div>
          <div class="countdown caps">{{ $t('joinLanding.join.div2') }}</div>
        </div>
      </div>
      <div class="btn-container">
        <button class="btn-secondary" @click="toggleCriteria">
          {{ $t('joinLanding.join.button1') }}
        </button>
        <links to="/join/project" class="btn-primary">{{
          $t('joinLanding.join.link2')
        }}</links>
      </div>
    </div>

    <criteria-modal v-if="showCriteriaPanel" @close="toggleCriteria" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { DateTime } from 'luxon'
import { BigNumber } from 'ethers'

import { RegistryInfo } from '@/api/recipient-registry-optimistic'
import Loader from '@/components/Loader.vue'
import CriteriaModal from '@/components/CriteriaModal.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import Links from '@/components/Links.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'

import { getCurrentRound } from '@/api/round'
import { formatAmount } from '@/utils/amounts'

@Component({
  components: {
    RoundStatusBanner,
    CriteriaModal,
    Loader,
    Links,
    TimeLeft,
    ImageResponsive,
    Breadcrumbs,
  },
})
export default class JoinLanding extends Vue {
  currentRound: string | null = null
  loading = true
  showCriteriaPanel = false

  get links(): Array<{ link: string; url: string }> {
    return [{ link: 'join', url: '/join' }]
  }

  async created() {
    this.currentRound = await getCurrentRound()
    this.loading = false
  }

  get registryInfo(): RegistryInfo {
    return this.$store.state.recipientRegistryInfo
  }

  get deposit(): BigNumber | null {
    return this.registryInfo?.deposit
  }

  get depositToken(): string | null {
    return this.registryInfo?.depositToken
  }

  get recipientCount(): number | null {
    return this.registryInfo?.recipientCount
  }

  private get signUpDeadline(): DateTime {
    return this.$store.state.currentRound?.signUpDeadline
  }

  get maxRecipients(): number | undefined {
    return this.$store.getters.maxRecipients
  }

  get spacesRemaining(): number | null {
    if (!this.$store.state.currentRound || !this.registryInfo) {
      return null
    }
    return (
      this.$store.state.currentRound.maxRecipients -
      this.registryInfo.recipientCount
    )
  }

  get isRoundFull(): boolean {
    if (this.spacesRemaining === null) {
      return false
    }
    return (
      this.spacesRemaining === 0 || this.$store.getters.isMessageLimitReached
    )
  }

  get isRoundFillingUp(): boolean {
    if (this.spacesRemaining === null) {
      return false
    }
    return this.spacesRemaining < 20
  }

  get spacesRemainingString(): string {
    return this.spacesRemaining === 1
      ? '1 space'
      : `${this.spacesRemaining} spaces`
  }

  openTooltip(): void {
    document.getElementById('myTooltip')?.classList.toggle('hidden')
  }

  toggleCriteria(): void {
    this.showCriteriaPanel = !this.showCriteriaPanel
  }

  formatAmount(value: BigNumber): string {
    if (!value) return ''
    return formatAmount(value, 18)
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

h1 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 40px;
  line-height: 120%;
}

.gradient {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  background: var(--bg-gradient);

  .hero {
    position: fixed;
    top: 0;
    right: 0;
    height: 100%;
    width: 100%;
    background: var(--bg-gradient-hero);
    @media (max-width: $breakpoint-m) {
      width: 100%;
      padding-bottom: 0rem;
    }

    img {
      position: absolute;
      bottom: 0;
      right: calc(-700px + 50vw);
      mix-blend-mode: exclusion;
      max-width: 88%;
      max-height: 100%;

      @media (max-width: $breakpoint-m) {
        right: 1rem;
        width: 100%;
      }
    }
  }
}

.breadcrumbs {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  padding-left: $content-space;
  margin-left: 2rem;
  width: min(100%, 512px);
}

.content {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  padding: $content-space;
  margin-left: 2rem;
  width: min(100%, 512px);
  @media (max-width: $breakpoint-m) {
    width: 100%;
    margin: 0;
    padding-bottom: 35vw;
  }
}

.countdown {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 24px;
  letter-spacing: -0.015em;
}

.countdown-label {
  font-family: Glacial Indifference;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 21px;
  letter-spacing: 6px;
  text-align: left;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 20px;
}

.apply-callout {
  background: var(--bg-transparent);
  border: 2px solid var(--border-highlight);
  box-sizing: border-box;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  &:first-of-type {
    margin-top: 2rem;
  }
}

.icon {
  width: 16px;
  height: 16px;
  filter: var(--img-filter, invert(0.7));
}

.apply-callout-warning {
  background: var(--warning-background);
  border: 2px solid var(--warning-border);
  box-sizing: border-box;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.filling-up-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.warning-text {
  margin-bottom: 0;
  color: var(--warning-color);
}

.info-boxes {
  margin-bottom: 2rem;
}

.button-menu {
  flex-direction: column;
  position: absolute;
  top: 2rem;
  right: 0.5rem;
  background: var(--bg-secondary-color);
  border: 1px solid rgba($border-light, 0.3);
  border-radius: 0.5rem;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 1;
  cursor: pointer;
  padding: 1rem 0.25rem;
  text-align: center;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.show {
  display: flex;
}

.btn-container {
  margin-top: 2.5rem;
}
</style>
