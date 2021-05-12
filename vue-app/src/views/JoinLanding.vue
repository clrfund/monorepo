<template>
  <div>
    <div class="gradient">
      <div class="hero">
        <img src="@/assets/core.png" />
      </div>  
    </div>  
  
    <round-status-banner />

    <div class="content" v-if="isLoading">
      <h1>Fetching round data...</h1>
    </div>

    <div class="content" v-else-if="isRoundClosed">
      <div style="font-size: 64px;">☹</div>
      <h1>Sorry, it's too late to join</h1>
      <div id="subtitle" class="subtitle">
        The round is about to start. It's now too late to get on board.
      </div> 
      <div class="subtitle" id="subtitle" style="margin-top: 2rem;">
        Check out these <a href="https://ethereum.org/en/community/grants/">other ways to source funding</a>. Or follow us on Twitter for updates about future rounds: <a href="https://twitter.com/ethdotorg">@ethdotorg</a>
      </div>
      <div class="btn-container">
        <router-link to="/" class="btn-primary">Home</router-link>
      </div> 
    </div>

    <div class="content" v-else-if="isRoundFull">
      <div style="font-size: 64px;">☹</div>
      <h1>Sorry, the round is full</h1>
      <div id="subtitle" class="subtitle">
        The tech we use to protect you from bribery and collusion, MACI, limits the number of projects right now. Unfortunately we've hit the cap and there's no more room on board.
      </div> 
      <div class="subtitle" id="subtitle" style="margin-top: 2rem;">
        Check out these <a href="https://ethereum.org/en/community/grants/">other ways to source funding</a>. Or follow us on Twitter for updates about future rounds: <a href="https://twitter.com/ethdotorg">@ethdotorg</a>
      </div>
      <div class="btn-container">
        <router-link to="/" class="btn-primary">Home</router-link>
        <router-link to="/about" class="btn-secondary">More on MACI</router-link>
      </div> 
    </div>

    <div class="content" v-else>
      <h1>Join the next funding round</h1>
      <div class="subtitle">To get on board this round, we’ll need some information about your project and a <strong>{{ formatAmount(deposit) }} {{ depositToken }}</strong> security deposit.</div>
      <div class="info-boxes">
        <div class="apply-callout">
          <div class="countdown-label caps">Time left to join</div>
          <div class="countdown caps">{{ timeRemaining }}</div>
        </div> 
        <div class="apply-callout">
          <div class="countdown-label caps">Time to complete</div>
          <div class="countdown caps">15 minutes (ish)</div>
        </div> 
        <div v-if="isRoundFillingUp" class="apply-callout-warning">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;f">
            <div class="countdown caps">{{ spacesRemainingString }} left, hurry!</div>
              <div class="dropdown">
              <img class="icon" @click="openTooltip" src="@/assets/info.svg" />
              <div id="myTooltip" class="hidden button-menu">
                MACI, our anti-bribery tech, currently limits the amount of projects allowed per round. <router-link to="/about-maci">More on MACI</router-link>
              </div>
            </div>
          </div>
          <p class="warning-text" style="margin-bottom: 0;">You will get your deposit back if you don’t make it into the round this time.</p>
        </div> 
      </div>
      <div class="btn-container">
        <button class="btn-secondary" @click="toggleCriteria">See round criteria</button>
        <router-link to="/join/project" class="btn-primary">Add project</router-link>
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

import { RegistryInfo, getRegistryInfo } from '@/api/recipient-registry-optimistic'

import CriteriaModal from '@/components/CriteriaModal.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import { formatDateFromNow, hasDateElapsed } from '@/utils/dates'
import { formatAmount } from '@/utils/amounts'

@Component({
  components: { RoundStatusBanner, CriteriaModal },
})
export default class JoinLanding extends Vue {
  isLoading = true
  showCriteriaPanel = false
  recipientCount: number | null = null
  spacesRemaining: number | null = null
  deposit: BigNumber | null = null
  depositToken: string | null = null

  // TODO fix on page refresh - `recipientRegistryAddress` is `null`
  // Refactor to computed properties, so we can react to having `recipientRegistryAddress`?
  async created() {
    const registryInfo: RegistryInfo = await getRegistryInfo(this.$store.state.recipientRegistryAddress)
    const maxRecipients = this.$store.state.currentRound.maxRecipients
    this.recipientCount = registryInfo.recipientCount
    this.deposit = registryInfo.deposit
    this.depositToken = registryInfo.depositToken
    this.spacesRemaining = maxRecipients - registryInfo.recipientCount
    this.isLoading = false
  }

  private get signUpDeadline(): DateTime {
    return this.$store.state.currentRound?.signUpDeadline
  }

  get timeRemaining(): string {
    if (!this.signUpDeadline) {
      return  '...'
    }
    return formatDateFromNow(this.signUpDeadline)
  }

  get isRoundClosed(): boolean {
    if (!this.signUpDeadline) {
      return  false
    }
    return hasDateElapsed(this.signUpDeadline)
  }

  get isRoundFull(): boolean {
    if (this.spacesRemaining === null) {
      return false
    }
    return this.spacesRemaining === 0
  }

  get isRoundFillingUp(): boolean {
    if (this.spacesRemaining === null) {
      return false
    }
    return this.spacesRemaining < 20
  }

  get spacesRemainingString(): string {
    return this.spacesRemaining === 1 ? '1 space' : `${this.spacesRemaining} spaces`
  }

  openTooltip(): void {
    document.getElementById('myTooltip')?.classList.toggle('hidden')
  }

  toggleCriteria(): void {
    this.showCriteriaPanel = !this.showCriteriaPanel
  }

  formatAmount(value: BigNumber): string {
    if (!value) {
      return ''
    }
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
    background: linear-gradient(286.78deg, rgba(173, 131, 218, 0) -32.78%, #191623 78.66%);
    @media (max-width: ($breakpoint-m)) {
      width: 100%;
      padding-bottom: 0rem;
    }

    img {
      position: absolute;
      bottom: 0;
      right: -128px;
      mix-blend-mode: exclusion;
      width: 88%;
      @media (max-width: ($breakpoint-m)) {
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
  width: min(100%, 512px);
  margin-left: 2rem;
  margin-top: 4rem;
  width: min(100%, 512px);
  @media (max-width: ($breakpoint-m)) {
    width: 100%;
    margin: 0;
    padding-bottom: 10rem;
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
  border: 2px solid #9789C4;
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
  border: 1px solid rgba(115,117,166,0.3);
  border-radius: 0.5rem;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
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