<template>
    <div id="banner" class="caps">
      <span>Funding Starts: {{timeRemaining}}</span>
      <span>{{startDate}}</span>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { RoundInfo, getCurrentRound } from '@/api/round'

@Component export default class RoundStatusBanner extends Vue {
  startDate = '03 April' // TODO: use Date() object
  timeRemaining = '17 days' // TODO: startDate - new Date() -> parse to days/hours/minutes accordinging
  
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
  display: flex;
  height: 48px;
  justify-content: space-between;
  padding: 1rem 2rem;
  align-items: center;
  background: $bg-primary-color;
}
</style>