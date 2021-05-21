<template>
    <div id="banner" class="caps">
      <div class="marquee-content">
        <div class="messsage">
          <span class="label">{{ message }}</span>
        </div>
      </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { formatDate, formatDateFromNow } from '@/utils/dates'

@Component
export default class RoundStatusBanner extends Vue {
  get message(): string {
    if (this.$store.getters.isRoundJoinPhase) {
      let message = `Funding starts: 🗓 ${this.startDate}. `
      if (this.$store.getters.isRecipientRegistryFull) {
        message += 'Project applications are closed.'
      } else if (this.$store.getters.isRecipientRegistryFillingUp){
        message += `Hurry, only ${this.recipientSpacesRemainingString} left! `
      }
      message += `Time left to add a project: ${this.joinTimeRemaining}.`
      return message
    }
    if (this.$store.getters.isRoundContributionPhase) {
      return this.$store.getters.isRoundContributionPhaseEnding ?
        `⌛️ The round will close in ${this.contributionTimeRemaining}. Get your contributions in now!` :
        `🎉 The round is open! ${this.contributionTimeRemaining} left to contribute to your favourite projects`
    }
    if (this.$store.getters.isRoundReallocationPhase) {
      return `The round is closed! If you contributed, you have ${this.reallocationTimeRemaining} left to change your mind`
    }
    return 'The round is closed! Thanks everyone, watch out for a summary blog post soon'
  }
  get startDate(): string {
    return formatDate(this.$store.state.currentRound?.startTime)
  }

  get joinTimeRemaining(): string {
    return formatDateFromNow(this.$store.getters.recipientJoinDeadline)
  }

  get contributionTimeRemaining(): string {
    return formatDateFromNow(this.$store.state.currentRound?.signUpDeadline)
  }

  get reallocationTimeRemaining(): string {
    return formatDateFromNow(this.$store.state.currentRound?.votingDeadline)
  }

  get recipientSpacesRemainingString(): string {
    return this.$store.getters.recipientSpacesRemaining === 1 ?
      `${this.$store.getters.recipientSpacesRemaining} project space` :
      `${this.$store.getters.recipientSpacesRemaining} project spaces`
  }
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