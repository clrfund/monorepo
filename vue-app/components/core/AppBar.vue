<template>
  <v-app-bar
    v-if="$vuetify.breakpoint.mdAndDown"
    app
    color="transparent"
    flat
  >
    <v-app-bar-nav-icon @click="toggleDrawer" />
  </v-app-bar>
</template>

<script>
  // Utilities
  import {
    mapMutations,
  } from 'vuex'

  export default {
    name: 'CoreAppBar',

    methods: {
      ...mapMutations('app', ['toggleDrawer']),
    },
  }
</script>
