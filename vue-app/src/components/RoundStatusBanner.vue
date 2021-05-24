<template>
    <div id="banner" class="caps">
      <div class="marquee-content">
        <div v-if="$store.getters.isJoinOnlyPhase" class="messsage">
          <span class="label">Funding starts 🗓 {{startDate}}.</span>
          <span v-if="$store.getters.isRecipientRegistryFull" class="label"> Project applications are closed.</span>
          <span v-if="$store.getters.isRecipientRegistryFillingUp" class="label"> Hurry, only {{recipientSpacesRemainingString}} left! </span>
          <span v-if="!$store.getters.isRecipientRegistryFull" class="label"> Time left to add a project: {{joinTimeRemaining}}.</span>
        </div>
        <div v-if="$store.getters.isRoundContributionPhase" class="messsage">
          <span v-if="$store.getters.isRoundContributionPhaseEnding" class="label">⌛️ The round will close in {{contributionTimeRemaining}}. Get your contributions in now! </span>
          <span v-else class="label">🎉 The round is open! {{contributionTimeRemaining}} left to contribute to your favourite projects </span>
        </div>
        <div v-if="$store.getters.isRoundReallocationPhase" class="messsage">
          <span class="label">Funding is closed! If you contributed, you have {{reallocationTimeRemaining}} left to change your mind</span>
        </div>
        <div v-if="$store.getters.isRoundTallying" class="messsage">
          <span class="label">🎉 Funding is closed! Our smart contracts are busy tallying final amounts... </span>
        </div>
        <div v-if="$store.getters.isRoundFinalized" class="messsage">
          <span class="label">Funding is closed! Contributions are ready to claim. Head to your project page to claim your funds. <router-link to="/projects">View projects</router-link></span>
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