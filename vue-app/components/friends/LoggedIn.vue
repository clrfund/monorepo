<template>
  <v-list-item>
    <v-list-item-avatar>
      <v-img src="https://cdn.vuetifyjs.com/images/john.png" />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title>John Leider</v-list-item-title>

      <v-list-item-subtitle>{{user.account}}</v-list-item-subtitle>
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
    mapState,
  } from 'vuex'

  export default {
    name: 'Web3LoggedIn',
    computed: {
      ...mapState('auth', ['user']),
    },
    methods: {
      ...mapActions('auth', ['logout']),
    },
  }
</script>
