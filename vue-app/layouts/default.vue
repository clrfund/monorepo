<template>
  <v-app :style="{ background: $vuetify.theme.themes.dark.background }">
    <core-app-bar />

    <core-drawer />

    <v-content>
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
