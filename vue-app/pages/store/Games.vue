<template>
  <v-container class="pt-0">
    <game-group
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
  } from 'vuex'

  export default {
    components: {
      GameGroup: () => import('./GameGroup.vue'),
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
      ...mapGetters('games', ['parsedGames']),
      groups () {
        const games = this.parsedGames.slice(3)
        const groups = []

        for (const order of this.order) {
          if (
            groups.length === games.length ||
            !games.length
          ) {
            break
          }

          const group = games.splice(0, order.count)

          groups.push({
            ...order,
            group,
          })
        }

        return groups
      },
    },
  }
</script>
