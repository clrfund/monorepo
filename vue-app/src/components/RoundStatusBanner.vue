<template>
  <div id="banner" class="caps">
    <div class="marquee-content">
      <div v-if="$store.getters.isJoinOnlyPhase" class="messsage">
        <span class="label">{{
          $t('roundStatusBanner.span1', { startDate: startDate })
        }}</span>
        <span v-if="$store.getters.isRecipientRegistryFull" class="label">
          {{ $t('roundStatusBanner.span2') }}</span
        >
        <span v-if="$store.getters.isRecipientRegistryFillingUp" class="label">
          {{
            $t('roundStatusBanner.span3', {
              recipientSpacesRemainingString: recipientSpacesRemainingString,
            })
          }}
        </span>
        <span v-if="!$store.getters.isRecipientRegistryFull" class="label">
          {{ $t('roundStatusBanner.span4') }}
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
          {{ $t('roundStatusBanner.span5_t1') }}
          <time-left
            unitClass="none"
            valueClass="none"
            :date="$store.state.currentRound.signUpDeadline"
          />{{ $t('roundStatusBanner.span5_t2') }}
        </span>
        <span v-else class="label"
          >{{ $t('roundStatusBanner.span6_t1') }}
          <time-left
            unitClass="none"
            valueClass="none"
            :date="$store.state.currentRound.signUpDeadline"
          />
          {{ $t('roundStatusBanner.span6_t2') }}
        </span>
      </div>
      <div v-if="$store.getters.isRoundReallocationPhase" class="messsage">
        <span class="label">
          {{ $t('roundStatusBanner.span7_t1') }}
          <time-left
            unitClass="none"
            valueClass="none"
            :date="$store.state.currentRound.votingDeadline"
          />
          {{ $t('roundStatusBanner.span7_t2') }}
        </span>
      </div>
      <div v-if="$store.getters.isRoundTallying" class="messsage">
        <span class="label">{{ $t('roundStatusBanner.span8') }} </span>
      </div>
      <div v-if="$store.getters.isRoundFinalized" class="messsage">
        <span class="label"
          >{{ $t('roundStatusBanner.span9') }}
          <links to="/projects">{{
            $t('roundStatusBanner.link1')
          }}</links></span
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
