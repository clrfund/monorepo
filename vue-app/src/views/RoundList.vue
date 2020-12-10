<template>
  <div class="rounds">
    <h1 class="content-heading">Rounds</h1>
    <div
      class="round"
      v-for="round in rounds"
      :key="round.index"
    >
      <router-link
        v-if="round.address"
        class="round-name"
        :to="{ name: 'round', params: { address: round.address }}"
      >
        Round {{ round.index }}
      </router-link>
      <a v-else :href="round.url">
        Round {{ round.index }}
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Round, getRounds } from '@/api/rounds'

@Component({
  name: 'round-list',
  metaInfo: { title: 'Rounds' },
})
export default class RoundList extends Vue {

  rounds: Round[] = []

  async created() {
    this.rounds = await getRounds()
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
