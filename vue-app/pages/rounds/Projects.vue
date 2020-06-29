<template>
  <v-container>
    <v-row>
      <v-col
        v-for="project in projects"
        :key="project.id"
        cols="12"
        sm="6"
        md="4"
      >
        <project
          :value="project"
          :understate="false"
          dense
          static
          show-action
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
    name: 'RoundsProjects',

    components: {
      Project: () => import('@/components/Project'),
    },

    computed: {
      ...mapGetters('rounds', ['projects']),
    },
  }
</script>

<style scoped>
.v-sheet {
  cursor: pointer;
}
</style>
