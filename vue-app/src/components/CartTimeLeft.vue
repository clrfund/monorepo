<template>
  <div>
    <div class="flex"><img src="@/assets/time.svg" />Time left</div>
    <div v-if="$store.getters.canUserReallocate" class="flex">
      <div v-if="reallocationTimeLeft.days > 0">{{ reallocationTimeLeft.days }}</div>
      <div v-if="reallocationTimeLeft.days > 0">days</div>
      <div>{{ reallocationTimeLeft.hours }}</div>
      <div>hours</div>
      <div v-if="reallocationTimeLeft.days === 0">{{ reallocationTimeLeft.minutes }}</div>
      <div v-if="reallocationTimeLeft.days === 0">minutes</div>
    </div>
    <div v-else class="flex">
      <div v-if="contributionTimeLeft.days > 0">{{ contributionTimeLeft.days }}</div>
      <div v-if="contributionTimeLeft.days > 0">days</div>
      <div>{{ contributionTimeLeft.hours }}</div>
      <div>hours</div>
      <div v-if="contributionTimeLeft.days === 0">{{ contributionTimeLeft.minutes }}</div>
      <div v-if="contributionTimeLeft.days === 0">minutes</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

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
}
</script>

<style lang="scss" scoped>
.flex {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>