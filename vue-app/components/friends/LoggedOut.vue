<template>
  <v-form autocomplete="off">
    <v-window
      v-model="model"
      class=""
    >
      <v-window-item class="px-3">
        <v-text-field
          class="py-2"
          label="Email"
          hide-details
          name="email"
          outlined
          single-line
          append-icon="mdi-chevron-right"
          @keydown.enter="model++"
          @click:append="model++"
        />
      </v-window-item>

      <v-window-item class="px-3">
        <v-text-field
          ref="password"
          class="py-2"
          hide-details
          label="Password"
          name="password"
          type="password"
          append-icon="mdi-login"
          outlined
          single-line
          @click:append="login"
          @keydown.enter="login"
        />
      </v-window-item>
    </v-window>
  </v-form>
</template>

<script>
  // Utilities
  import {
    mapActions,
  } from 'vuex'

  export default {
    name: 'FriendsLoggedOut',

    data: () => ({
      model: 0,
    }),

    watch: {
      async model (val) {
        if (val !== 1) return

        setTimeout(() => {
          this.$refs.password.focus()
        }, 300)
      },
    },

    methods: {
      ...mapActions('auth', ['login']),
    },
  }
</script>
