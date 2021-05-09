<template>
    <div id="banner" class="caps">
      <div class="marquee-content">
          <span class="label">Funding Starts: {{timeRemaining}} </span>
          <span>{{startDate}}</span>
      </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { formatDate, formatDateFromNow } from '@/utils/dates'

@Component export default class RoundStatusBanner extends Vue {
  get startDate(): string {
    const startTime = this.$store.state.currentRound?.startTime
    if (!startTime) {
      return '...'
    }
    return formatDate(startTime)
  }

  get timeRemaining(): string {
    const signUpDeadline = this.$store.state.currentRound?.signUpDeadline
    if (!signUpDeadline) {
      return  '...'
    }
    return formatDateFromNow(signUpDeadline)
  }
  
  // TODO: Pull in round information to determine which banner to show
  // 1. Pre-round - Accepting applications for projects to join funding round
  // 2. Round active - Accepting user contributions
  // 3. Submitted (still active for changes!)
  // 4. Round closed.
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
  margin-right: 1.5rem;
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