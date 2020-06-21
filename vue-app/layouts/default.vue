<template>
  <v-app class="grey darken-4">
    <core-app-bar />

    <core-downloads />

    <core-drawer />

    <v-content>
      <nuxt-link to="/library">CLR</nuxt-link>
      <nuxt />
    </v-content>

    <core-friends />

    <core-snackbar />
  </v-app>
</template>

<script>
export default {
  components: {
    CoreAppBar: () => import("@/components/core/AppBar"),
    CoreDownloads: () => import("@/components/core/Downloads"),
    CoreDrawer: () => import("@/components/core/Drawer"),
    CoreFriends: () => import("@/components/core/Friends"),
    CoreSnackbar: () => import("@/components/core/Snackbar")
  }
};
</script>

<style>
.v-card {
  border-radius: 6px;
}
a {
  text-decoration: none;
}
</style>
