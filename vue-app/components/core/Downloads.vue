<template>
  <v-navigation-drawer
    v-model="model"
    :style="styles"
    class="grey darken-3"
    disable-resize-watcher
    fixed
    touchless
    width="400"
  >
    <template v-if="model">
      <v-row
        align="center"
        class="pa-3 mx-0"
      >
        Queue
        <v-spacer />

        <v-btn
          class="ma-0"
          icon
          @click="setDrawer(false)"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-row>

      <v-divider class="mx-3" />

      <v-list v-if="downloads.length">
        <v-list-item
          v-for="(download, i) in downloads"
          :key="i"
        >
          <v-list-item-avatar>
            <v-img :src="require(`@/assets/games/astras/avatar.png`)" />
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-text="download.name" />
            <v-list-item-subtitle>Downloading</v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-progress-circular
              indeterminate
              width="2"
              size="48"
            >
              <span>27%</span>
            </v-progress-circular>
          </v-list-item-action>
        </v-list-item>
      </v-list>

      <div
        v-else
        class="pa-3"
      >
        There is nothing here
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script>
  // Utilities
  import {
    mapGetters,
    mapMutations,
    mapState,
  } from 'vuex'

  export default {
    name: 'CoreDownloads',

    computed: {
      ...mapGetters('games', ['parsedGames']),
      ...mapState('downloads', [
        'drawer',
        'downloading',
      ]),
      downloads () {
        return this.downloading.map(download => {
          return this.parsedGames.find(game => game.id === download)
        })
      },
      model: {
        get () {
          return this.drawer
        },
        set (val) {
          this.setDrawer(val)
        },
      },
      styles () {
        const styles = {}

        if (this.$vuetify.breakpoint.lgAndUp) {
          styles.left = '200px'
        } else {
          styles.left = 0
        }

        return styles
      },
    },

    methods: {
      ...mapMutations('downloads', ['setDrawer']),
    },
  }
</script>
