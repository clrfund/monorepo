<template>
  <div>
    <div class="flex"><img src="@/assets/time.svg" />Time left</div>
    <div class="flex">
      <div v-if="timeLeft.days > 0">{{ timeLeft.days }}</div>
      <div v-if="timeLeft.days > 0">days</div>
      <div>{{ timeLeft.hours }}</div>
      <div>hours</div>
      <div v-if="timeLeft.days === 0">{{ timeLeft.minutes }}</div>
      <div v-if="timeLeft.days === 0">minutes</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { TimeLeft } from '@/api/round'
import { getTimeLeft } from '@/utils/dates'

@Component
export default class CartTimeLeft extends Vue {
  get contributionTimeLeft(): TimeLeft {
    return getTimeLeft(this.$store.state.currentRound.signUpDeadline)
  }

  get reallocationTimeLeft(): TimeLeft {
    return getTimeLeft(this.$store.state.currentRound.votingDeadline)
  }

  get timeLeft(): TimeLeft {
    return this.$store.getters.canUserReallocate
      ? this.reallocationTimeLeft
      : this.contributionTimeLeft
  }
}
</script>

<style lang="scss" scoped>
.flex {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
