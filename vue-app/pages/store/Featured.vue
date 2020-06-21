<template>
  <v-container>
    <v-row>
      <v-col
        v-for="(feature, i) in featured"
        :key="i"
        cols="12"
        md="4"
      >
        <game
          :value="feature"
          dense
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
    components: {
      Game: () => import('@/components//Game'),
    },

    computed: {
      ...mapGetters('games', ['featured']),
    },
  }
</script>
