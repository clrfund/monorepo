<template>
  <div class="rounds">
    <h1 class="content-heading">Rounds</h1>
    <div class="round" v-for="round in rounds" :key="round.index">
      <links
        v-if="round.address"
        class="round-name"
        :to="{ name: 'round', params: { address: round.address } }"
      >
        Round {{ round.index }}
      </links>
      <links v-else :to="round.url"> Round {{ round.index }} </links>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Round, getRounds } from '@/api/rounds'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class RoundList extends Vue {
  rounds: Round[] = []

  async created() {
    this.rounds = (await getRounds()).reverse()
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.content-heading {
  border-bottom: $border;
}

.round {
  background-color: $bg-secondary-color;
  border: $border;
  border-radius: 20px;
  box-sizing: border-box;
  margin-top: $content-space;
  padding: $content-space;

  a {
    color: $text-color;
    font-size: 16px;
  }
}
</style>
