<template>
  <div>
    <div class="gradient">
      <div class="hero">
        <img src="@/assets/core.png" />
      </div>
    </div>

    <round-status-banner />
    <back-link
      :alsoShowOnMobile="true"
      to="/projects"
      text="← Back to projects"
    />

    <div class="content" v-if="!$store.state.currentRound">
      <h1>Fetching round data...</h1>
      <loader />
    </div>

    <div class="content" v-else-if="$store.getters.hasContributionPhaseEnded">
      <div class="big-emoji">☹</div>
      <h1>Sorry, it's too late to join</h1>
      <div id="subtitle" class="subtitle">
        The round is closed for new projects. It's now too late to get on board.
      </div>
      <div class="subtitle mt2" id="subtitle">
        Check out these
        <links to="https://ethereum.org/en/community/grants/"
          >other ways to source funding</links
        >. Or follow us on Twitter for updates about future rounds:
        <links to="https://twitter.com/ethdotorg">@ethdotorg</links>
      </div>
      <div class="btn-container">
        <links to="/" class="btn-primary">Home</links>
      </div>
    </div>

    <div class="content" v-else-if="isRoundFull">
      <div class="big-emoji">☹</div>
      <h1>Sorry, the round is full</h1>
      <div id="subtitle" class="subtitle">
        The tech we use to protect you from bribery and collusion, MACI, limits
        the number of projects right now. Unfortunately we've hit the cap and
        there's no more room on board.
      </div>
      <div class="subtitle mt2" id="subtitle">
        Check out these
        <links to="https://ethereum.org/en/community/grants/"
          >other ways to source funding</links
        >. Or follow us on Twitter for updates about future rounds:
        <links to="https://twitter.com/ethdotorg">@ethdotorg</links>
      </div>
      <div class="btn-container">
        <links to="/" class="btn-primary">Home</links>
        <links to="/about" class="btn-secondary">More on MACI</links>
      </div>
    </div>

    <div class="content" v-else>
      <h1>Join the funding round</h1>
      <div class="subtitle">
        We’ll need some information about your project and a
        <strong>{{ formatAmount(deposit) }} {{ depositToken }}</strong> security
        deposit.
      </div>
      <div class="info-boxes">
        <div class="apply-callout">
          <div class="countdown-label caps">Time left to join</div>
          <div class="countdown caps">
            <time-left
              valueClass="none"
              unitClass="none"
              :date="signUpDeadline"
            />
          </div>
        </div>
        <div class="apply-callout">
          <div class="countdown-label caps">Time to complete</div>
          <div class="countdown caps">15 minutes (ish)</div>
        </div>
        <div v-if="isRoundFillingUp" class="apply-callout-warning">
          <div class="filling-up-container">
            <div class="countdown caps">
              {{ spacesRemainingString }} left, hurry!
            </div>
            <div class="dropdown">
              <img class="icon" @click="openTooltip" src="@/assets/info.svg" />
              <div id="myTooltip" class="hidden button-menu">
                MACI, our anti-bribery tech, currently limits the amount of
                projects allowed per round.
                <links to="/about/maci">More on MACI</links>
              </div>
            </div>
          </div>
          <p class="warning-text">
            You will get your deposit back if you don’t make it into the round
            this time.
          </p>
        </div>
      </div>
      <div class="btn-container">
        <button class="btn-secondary" @click="toggleCriteria">
          See round criteria
        </button>
        <links to="/join/project" class="btn-primary">Add project</links>
      </div>
    </div>

    <criteria-modal v-if="showCriteriaPanel" :toggleCriteria="toggleCriteria" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { DateTime } from 'luxon'
import { BigNumber } from 'ethers'

import { RegistryInfo } from '@/api/recipient-registry-optimistic'
import { formatAmount } from '@/utils/amounts'
import Loader from '@/components/Loader.vue'
import CriteriaModal from '@/components/CriteriaModal.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import BackLink from '@/components/BackLink.vue'
import Links from '@/components/Links.vue'
import TimeLeft from '@/components/TimeLeft.vue'

@Component({
  components: {
    RoundStatusBanner,
    CriteriaModal,
    Loader,
    BackLink,
    Links,
    TimeLeft,
  },
})
export default class JoinLanding extends Vue {
  showCriteriaPanel = false

  get registryInfo(): RegistryInfo {
    return this.$store.state.recipientRegistryInfo
  }

  get deposit(): BigNumber | null {
    return this.registryInfo.deposit
  }

  get depositToken(): string | null {
    return this.registryInfo.depositToken
  }

  get recipientCount(): number | null {
    return this.registryInfo.recipientCount
  }

  private get signUpDeadline(): DateTime {
    return this.$store.state.currentRound?.signUpDeadline
  }

  get spacesRemaining(): number | null {
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
  background: $clr-pink-dark-gradient;

  .hero {
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
  background: $bg-transparent;
  border: 2px solid #9789c4;
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
}

.apply-callout-warning {
  background: $warning-color-bg;
  border: 2px solid $warning-color;
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
}

.info-boxes {
  margin-bottom: 2rem;
}

.icon-btn {
  padding: 0.5rem;
  &:hover {
    background: $bg-secondary-color;
  }
}

.button-menu {
  flex-direction: column;
  position: absolute;
  top: 2rem;
  right: 0.5rem;
  background: $bg-secondary-color;
  border: 1px solid rgba(115, 117, 166, 0.3);
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
