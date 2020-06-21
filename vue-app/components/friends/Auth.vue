<template>
  <component :is="`logged-${loggedIn ? 'in' : 'out'}`" />
</template>

<script>
  // Utilities
  import {
    mapState,
  } from 'vuex'

  export default {
    name: 'FriendsAuth',

    components: {
      LoggedIn: () => import('./LoggedIn'),
      LoggedOut: () => import('./LoggedOut'),
    },

    computed: {
      ...mapState('auth', ['loggedIn']),
    },
  }
</script>
