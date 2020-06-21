<template>
  <v-container>
    <v-row>
      <v-col
        v-for="game in games"
        :key="game.id"
        cols="12"
        sm="6"
        md="4"
      >
        <game
          :value="game"
          :understate="!game.installed"
          dense
          static
          show-action
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  // Utilities
  import {
    mapGetters,
  } from 'vuex'

  export default {
    name: 'LibraryGames',

    components: {
      Game: () => import('@/components/Game'),
    },

    computed: {
      ...mapGetters('library', ['games']),
    },
  }
</script>

<style scoped>
.v-sheet {
  cursor: pointer;
}
</style>
