<template>
  <v-navigation-drawer
    v-model="drawer"
    app
    class="grey darken-4"
    floating
    width="200"
  >
    <v-list color="transparent">
      <v-list-item class="mb-4">
        <v-list-item-avatar tile>
          <v-img
            src="https://cdn.vuetifyjs.com/images/logos/v-alt.svg"
            contain
          />
        </v-list-item-avatar>

        <v-list-item-title>Vuetify</v-list-item-title>
      </v-list-item>

      <template v-for="(item, i) in items">
        <v-list-item
          v-if="!item.spacer"
          :key="`tile-${i}`"
          :to="item.to"
          :value="item.value"
          color="grey"
          exact
          v-on="item.click && {
            'click': item.click
          }"
        >
          <v-list-item-avatar>
            <v-icon
              style="color: inherit"
              v-text="item.icon"
            />
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-text="item.text" />
          </v-list-item-content>
        </v-list-item>

        <div
          v-else
          :key="`divider-${i}`"
          class="my-auto"
        />
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
  // Utilities
  import {
    mapMutations,
    mapState,
  } from 'vuex'

  export default {
    name: 'CoreDrawer',

    computed: {
      drawer: {
        get () {
          return this.$store.state.app.drawer
        },
        set (val) {
          this.setDrawer(val)
        },
      },
      items () {
        return [
          {
            icon: 'mdi-home-variant',
            text: 'Home',
            to: '/',
          },
          {
            icon: 'mdi-fire',
            text: 'Projects',
            to: '/explore',
          },
          {
            icon: 'mdi-view-grid',
            text: 'Past Rounds',
            to: '/rounds',
          },
          { spacer: true },
          {
            icon: 'mdi-account',
            text: 'Profile',
            //value: this.downloadDrawer,
            click: () => {
              'pass';
            },
          }
        ]
      },
    },

    methods: {
      ...mapMutations('app', ['setDrawer']),
    },
  }
</script>
