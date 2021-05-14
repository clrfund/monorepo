<template>
    <div id="banner" class="caps">
      <div class="marquee-content">
        <div v-if="contributionPhase" class="messsage">
          <span v-if="!isContributionClosing" class="label">🎉 The round is open! {{contributionTimeRemaining}} left to contribute to your favourite projects </span>
          <span v-if="isContributionClosing" class="label">⌛️ The round will close in {{contributionTimeRemaining}}. Get your contributions in now! </span>
        </div>
        <div v-if="reallocationPhase" class="messsage">
          <span class="label">The round is closed! If you contributed, you have {{reallocationTimeRemaining}} left to change your mind</span>        
        </div>
        <div v-if="userActionsOver" class="messsage">
          <span class="label">The round is closed! Thanks everyone, watch out for a summary blog post soon</span>        
        </div>
        <div v-else class="messsage">
          <span class="label" v-if="joinPhase">Funding starts: {{contributionStart}} </span>
          <span class="date" v-if="joinPhase">🗓 {{startDate}}</span>
          <span class="label" v-if="joinPhase">Time left to add a project: {{timeRemaining}}</span>
          <span v-if="isRoundFillingUp && !isRoundFull && joinPhase">Hurry, only {{ spacesRemaining }} project spaces left</span>
<!--           <span v-if="isRoundFull || joinPhase" class="label" >Project applications are closed</span>
 -->          <!-- TODO: signup deadline will have to be before the funding round starts or we'll run into complications -->
        </div>
      </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { formatDate, formatDateFromNow, hasDateElapsed } from '@/utils/dates'
import { BigNumber } from 'ethers'
import { DateTime } from 'luxon'
import { RegistryInfo, getRegistryInfo } from '@/api/recipient-registry-optimistic'

@Component export default class RoundStatusBanner extends Vue {
  isLoading = true
  recipientCount: number | null = null
  spacesRemaining: number | null = null
  contributionStart = '3 days'
  joinPhase = false
  // This will probably be challenge period length...
  contributionPhase = false
  contributionTimeRemaining = '25 days'
  isContributionClosing = false
  reallocationPhase = false
  reallocationTimeRemaining = '3 days'
  userActionsOver = true

  // TODO fix on page refresh - `recipientRegistryAddress` is `null`
  // Refactor to computed properties, so we can react to having `recipientRegistryAddress`?
  async created() {
    const registryInfo: RegistryInfo = await getRegistryInfo(this.$store.state.recipientRegistryAddress)
    const maxRecipients = this.$store.state.currentRound.maxRecipients
    this.recipientCount = registryInfo.recipientCount
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

  get startDate(): string {
    const startTime = this.$store.state.currentRound?.startTime
    if (!startTime) {
      return '...'
    }
    return formatDate(startTime)
  }
  
  
  // TODO: Pull in round information to determine which banner to show
  // 1. Pre-round - Accepting applications for projects to join funding round 
  //    – "Time left to add your project: signUpDeadline" 
  //    - "Only 20 spaces left"
  // 2. Round active - Accepting user contributions 
  //    – "The round is now open! {{ timeLeft }} to contribute."
  // 3. Submitted (still active for changes!) 
  //    – "Round is closed for contributions, only editing your choices allowed."
  // 4. Round closed 
  //    – "Round is over. Thanks!"

  // Join close, funding starting
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

#banner {
  position: relative;
  z-index: 1;
  width: 100%;
  background: $bg-primary-color;
  overflow: hidden;
  white-space: nowrap;
}

.marquee-content {
  display: inline-block;
  animation: marquee 20s linear infinite;
  padding-left: 100%;
  margin: 1rem 0;

  @media (max-width: $breakpoint-m) {
    animation: marquee 10s linear infinite;
  }
}

.marquee-content:hover {
  animation-play-state: paused
}

.label {
  font-family: "Glacial Indifference", sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  text-align: left;
  margin-right: 1rem;
}

.date {
  margin-right: 2rem;
  padding-right: 1rem;
  text-transform: none;
  line-height: 0;
}

.date {
  margin-right: 2rem;
  padding-right: 1rem;
  text-transform: none;
  line-height: 0;
}

.messsage {
  display: flex;
  align-items: center;
}

/* Transition */

@keyframes marquee {
  0% {
    transform: translateX(0)
  }
  100% {
    transform: translateX(-100%)
  }
}
</style>