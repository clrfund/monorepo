<template>
  <v-container>
    <v-row>
      <v-col
        v-for="(feature, i) in featured"
        :key="i"
        cols="12"
        md="4"
      >
        <project
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
      Project: () => import('@/components//Project'),
    },

    computed: {
      ...mapGetters('projects', ['featured']),
    },
  }
</script>
