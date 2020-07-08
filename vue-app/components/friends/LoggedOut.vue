<template>
  <v-btn @click="login" color="accent" style="width: 100%; height: 52px;">
    Sign On
  </v-btn>
</template>

<script>
// Utilities
import { mapActions } from "vuex";

export default {
  name: "Web3LoggedOut",

  data: () => ({
    user: null
  }),

  methods: {
    ...mapActions("auth", ["login"])
  }
};
</script>
