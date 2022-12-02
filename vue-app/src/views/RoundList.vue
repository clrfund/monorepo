<template>
  <div class="rounds">
    <h1 class="content-heading">{{ $t('roundList.h1') }}</h1>
    <div class="round" v-for="round in rounds" :key="round.index">
      <links
        v-if="round.isFinalized"
        class="round-name"
        :to="{
          name: 'leaderboard',
          params: { address: round.address },
        }"
      >
        {{ $t('roundList.link1', { index: round.index }) }}
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
      </links>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Round } from '@/api/rounds'
import Links from '@/components/Links.vue'
import { LOAD_ROUNDS } from '@/store/action-types'

@Component({ components: { Links } })
export default class RoundList extends Vue {
  rounds: Round[] = []

  async created() {
    if (!this.$store.state.rounds) {
      await this.$store.dispatch(LOAD_ROUNDS)
    }
    this.rounds = this.$store.state.rounds.list().reverse()
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.content-heading {
  border-bottom: 2px solid var(--border-color);
}

.round {
  background-color: var(--bg-secondary-color);
  border: 2px solid var(--border-color);
  border-radius: 20px;
  box-sizing: border-box;
  margin-top: $content-space;
  padding: $content-space;

  a {
    color: var(--text-color);
    font-size: 16px;
  }
}
</style>
