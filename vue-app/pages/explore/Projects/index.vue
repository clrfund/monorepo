<template>
  <v-container class="pt-0">
    <project-group
      v-for="(group, i) in groups"
      :key="i"
      :value="group"
    />
  </v-container>
</template>

<script>
  // Utilities
  import {
    mapGetters,
    mapActions,
  } from 'vuex'

  export default {
    components: {
      ProjectGroup: () => import('./ProjectGroup.vue'),
    },

    data: () => ({
      order: [
        { component: 'row1', count: 1 },
        { component: 'row2', count: 3 },
        { component: 'row3', count: 3 },
        { component: 'row2', count: 3 },
        { component: 'row3', count: 3 },
        { component: 'row4', count: 4 },
      ],
    }),

    computed: {
      ...mapGetters('projects', ['parsedProjects']),

      groups () {
        const projects = this.parsedProjects.slice(3)
        const groups = []

        for (const order of this.order) {
          if (
            groups.length === projects.length ||
            !projects.length
          ) {
            break
          }

          const group = projects.splice(0, order.count)

          groups.push({
            ...order,
            group,
          })
        }

        return groups
      },
    },
    async fetch () {
      await this.$store.dispatch('projects/getProjects');
    }
  }
</script>
