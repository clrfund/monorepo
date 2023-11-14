<template>
  <div class="rounds">
    <h1 class="content-heading">{{ $t('roundList.h1') }}</h1>
    <div class="round" v-for="round in rounds" :key="round.index">
      <links
        v-if="round.hasLeaderboard"
        class="round-name"
        :to="{
          name: 'leaderboard',
          params: { address: round.address, network: round.network },
        }"
      >
        {{ $t('roundList.link1', { index: round.index }) }}
        <date-period
          class="period"
          :start-date="DateTime.fromSeconds(round.startTime)"
          :end-date="DateTime.fromSeconds(round.votingDeadline)"
        >
        </date-period>
      </links>
      <links
        v-else
        class="round-name"
        :to="{
          name: 'round',
          params: { address: round.address },
        }"
      >
        {{ $t('roundList.link1', { index: round.index }) }}
        <date-period
          class="period"
          :start-date="DateTime.fromSeconds(round.startTime)"
          :end-date="DateTime.fromSeconds(round.votingDeadline)"
        >
        </date-period>
      </links>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { type Round, getRounds } from '@/api/rounds'
import Links from '@/components/Links.vue'
import DatePeriod from '@/components/DatePeriod.vue'
import { DateTime } from 'luxon'

const rounds = ref<Round[]>([])

onMounted(async () => {
  rounds.value = (await getRounds()).reverse()
})
</script>

<style scoped lang="scss">
@import '../styles/vars';

.content-heading {
  border-bottom: 2px solid var(--border-color);
}

.round {
  background-color: var(--bg-secondary-color);
  border: 2px solid var(--bg-secondary-color);
  border-radius: 20px;
  box-sizing: border-box;
  margin-top: $content-space;
  padding: $content-space;

  a {
    color: var(--text-body);
    font-size: 16px;
  }

  .period {
    padding-top: 10px;
    font-size: 14px;
    opacity: 0.6;
  }
}
</style>
