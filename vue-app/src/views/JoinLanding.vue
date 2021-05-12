@ -0,0 +1,36 @@
<template>
  <div>
    <div class="gradient">
      <div class="hero">
        <img src="@/assets/core.png" width="100%" />
      </div>
    </div>  
    <round-status-banner />

    <!-- TODO Add content about going via traditional ESP round for funding -->
    <div class="content" v-if="isRoundClosed">
      <div style="font-size: 64px;">☹</div>
      <h1>Sorry, it's too late to join</h1>
      <div id="subtitle" class="subtitle">
        The round is about to start. It's now too late to get on board.
      </div> 
      <div class="subtitle" id="subtitle" style="margin-top: 2rem;">
        Check out these <a href="https://ethereum.org/en/community/grants/">other ways to source funding</a>. Or follow us on Twitter for updates about future rounds: <a href="https://twitter.com/ethdotorg">@ethdotorg</a>
      </div>
      <div class="btn-container" style="margin-top: 2.5rem;">
        <router-link to="/" class="btn-primary">Home</router-link>
      </div> 
    </div>

    <!-- TODO Add content about going via traditional ESP round for funding -->
    <div class="content" v-else-if="isRoundFull">
      <div style="font-size: 64px;">☹</div>
      <h1>Sorry, the round is full</h1>
      <div id="subtitle" class="subtitle">
        The tech we use to protect you from bribery and collusion, MACI, limits the number of projects right now. Unfortunately we've hit the cap and there's no more room on board.
      </div> 
      <div class="subtitle" id="subtitle" style="margin-top: 2rem;">
        Check out these <a href="https://ethereum.org/en/community/grants/">other ways to source funding</a>. Or follow us on Twitter for updates about future rounds: <a href="https://twitter.com/ethdotorg">@ethdotorg</a>
      </div>
      <div class="btn-container" style="margin-top: 2.5rem;">
        <router-link to="/" class="btn-primary">Home</router-link>
        <router-link to="/about" class="btn-secondary">More on MACI</router-link>
      </div> 
    </div>

    <div class="content" v-else>
      <h1>Join the next funding round</h1>
      <div id="subtitle" class="subtitle">To get on board this round, we’ll need some information about your project and a <strong>0.1 ETH</strong> security deposit.</div>
      <div id="info-boxes">
        <div id="apply-callout">
          <div id="countdown-label" class="caps">Time left to join</div>
          <div id="countdown" class="caps">{{ timeRemaining }}</div>
        </div> 
        <div id="apply-callout">
          <div id="countdown-label" class="caps">Time to complete</div>
          <div id="countdown" class="caps">15 minutes (ish)</div>
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

import CriteriaModal from '@/components/CriteriaModal.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import { formatDateFromNow, hasDateElapsed } from '@/utils/dates'

@Component({
  components: { RoundStatusBanner, CriteriaModal },
})
export default class JoinLanding extends Vue {
  showCriteriaPanel = false

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

  // TODO fetch `maxRecipients` from registry & compare to current registry size
  get isRoundFull(): boolean {
    return false
  }

  toggleCriteria(): void {
    this.showCriteriaPanel = !this.showCriteriaPanel
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

img.core {
  width: 100%;
  overflow: hidden;
}

.gradient {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  background: $clr-pink-dark-gradient;
}

.hero {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  display: flex;
  background: linear-gradient(286.78deg, rgba(173, 131, 218, 0) -32.78%, #191623 78.66%);
  @media (max-width: ($breakpoint-m)) {
    width: 100%;
    padding-bottom: 0rem;
  }
}

.hero img {
  position: absolute;
  bottom: 0;
  right: -128px;
  mix-blend-mode: exclusion;
  width: 88%;
  @media (max-width: ($breakpoint-m)) {
    right: 0;
    width: 100%;
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
  @media (max-width: ($breakpoint-m)) {
    width: 100%;
    margin: 0;
    padding-bottom: 10rem;
  }
}

#countdown {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 32px;
  letter-spacing: -0.015em;
}

#countdown-label {
  font-family: Glacial Indifference;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 21px;
  letter-spacing: 6px;
  text-align: left;
  margin-bottom: 0.5rem;
}


#subtitle {
  font-size: 20px;
}

#apply-callout {
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

#info-boxes {
  margin-bottom: 2rem; 
}

</style>