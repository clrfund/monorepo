<template>
  <v-btn
    bottom
    color="secondary"
    fab
    fixed
    right
    style="z-index: 9"
    @click="toggleDrawer"
  >
    <v-icon>mdi-account-multiple</v-icon>
  </v-btn>
</template>

<script>
  // Utilities
  import {
    mapMutations,
  } from 'vuex'

  export default {
    name: 'CoreFab',

    methods: {
      ...mapMutations('friends', ['toggleDrawer']),
    },
  }
</script>
