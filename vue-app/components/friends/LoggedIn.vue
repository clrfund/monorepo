<template>
  <v-list-item>
    <v-list-item-avatar>
      <v-img src="https://cdn.vuetifyjs.com/images/john.png" />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title>John Leider</v-list-item-title>

      <v-list-item-subtitle>zeroskillz</v-list-item-subtitle>
    </v-list-item-content>

    <v-list-item-action>
      <v-btn
        icon
        @click="logout"
      >
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-list-item-action>
  </v-list-item>
</template>

<script>
  // Utilities
  import {
    mapActions,
  } from 'vuex'

  export default {
    name: 'FriendsLoggedIn',

    methods: {
      ...mapActions('auth', ['logout']),
    },
  }
</script>
