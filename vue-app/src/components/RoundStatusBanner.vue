<template>
  <div id="banner" class="caps">
    <div class="marquee-content">
      <div v-if="$store.getters.isJoinOnlyPhase" class="messsage">
        <span class="label">Funding starts 🗓 {{ startDate }}.</span>
        <span v-if="$store.getters.isRecipientRegistryFull" class="label">
          Project applications are closed.</span
        >
        <span v-if="$store.getters.isRecipientRegistryFillingUp" class="label">
          Hurry, only {{ recipientSpacesRemainingString }} left!
        </span>
        <span v-if="!$store.getters.isRecipientRegistryFull" class="label">
          Time left to add a project:
          <time-left
            unitClass="none"
            valueClass="none"
            :date="$store.getters.recipientJoinDeadline"
          />
        </span>
      </div>
      <div v-if="$store.getters.isRoundContributionPhase" class="messsage">
        <span
          v-if="$store.getters.isRoundContributionPhaseEnding"
          class="label"
        >
          ⌛️ The round will close in
          <time-left
            unitClass="none"
            valueClass="none"
            :date="$store.state.currentRound.signUpDeadline"
          />. Get your contributions in now!
        </span>
        <span v-else class="label"
          >🎉 The round is open!
          <time-left
            unitClass="none"
            valueClass="none"
            :date="$store.state.currentRound.signUpDeadline"
          />
          left to contribute to your favorite projects
        </span>
      </div>
      <div v-if="$store.getters.isRoundReallocationPhase" class="messsage">
        <span class="label">
          Funding is closed! If you contributed, you have
          <time-left
            unitClass="none"
            valueClass="none"
            :date="$store.state.currentRound.votingDeadline"
          />
          left to change your mind
        </span>
      </div>
      <div v-if="$store.getters.isRoundTallying" class="messsage">
        <span class="label"
          >🎉 Funding is closed! Our smart contracts are busy tallying
          contributions...
        </span>
      </div>
      <div v-if="$store.getters.isRoundFinalized" class="messsage">
        <span class="label"
          >Funding is closed! Contributions are ready to claim. Head to your
          project page to claim your funds.
          <links to="/projects">View projects</links></span
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { formatDate } from '@/utils/dates'
import TimeLeft from '@/components/TimeLeft.vue'
import Links from '@/components/Links.vue'

@Component({ components: { TimeLeft, Links } })
export default class RoundStatusBanner extends Vue {
  get startDate(): string {
    return formatDate(this.$store.state.currentRound?.startTime)
  }

  get recipientSpacesRemainingString(): string {
    const spaces: number = this.$store.getters.recipientSpacesRemaining
    return `${spaces} project space${spaces !== 1 && 's'}`
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

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
  animation-play-state: paused;
}

.label {
  font-family: 'Glacial Indifference', sans-serif;
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
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}
</style>
