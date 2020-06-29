<template>
  <v-container class="py-0">
    <v-img
      :src="require(`@/assets/${project.bg}`)"
      min-height="50vh"
    >
      <nuxt-link to="/store">
        <v-subheader>
          Back to Explore Page
        </v-subheader>
      </nuxt-link>
      <v-row
        class="fill-height"
        justify="center"
        align="center"
      >
        <v-col class="text-center">
          <v-img
            :src="require(`@/assets/${project.logo}`)"
            contain
            class="mx-auto mb-5"
            width="200"
          />

          <v-btn
            :color="project.buyColor || 'blue'"
            style="min-width: 225px; height: 52px;"
          >
            Fund/Add
          </v-btn>
        </v-col>
      </v-row>
    </v-img>
    <v-sheet
      class="py-5 px-3"
      color="grey lighten-2"
      light
    >
      <h1
        class="display-3 font-weight-bold mb-4"
        v-text="project.name"
      />
      <v-row
        align="center"
      >
        <v-col
          class="grey--text text--darken-2"
          cols="12"
          md="6"
        >
          <p>
            Nunc nec neque. Vestibulum fringilla pede sit amet augue. Curabitur at lacus ac velit ornare lobortis. Pellentesque commodo eros a enim. Donec orci lectus, aliquam ut, faucibus non, euismod id, nulla.

            Vivamus in erat ut urna cursus vestibulum. Quisque ut nisi. Curabitur nisi. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Donec vitae sapien ut libero venenatis faucibus.

            Maecenas nec odio et ante tincidunt tempus. Pellentesque commodo eros a enim. Suspendisse feugiat. Nulla facilisi. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus.
          </p>
          <p>
            Nunc nec neque. Vestibulum fringilla pede sit amet augue. Curabitur at lacus ac velit ornare lobortis. Pellentesque commodo eros a enim. Donec orci lectus, aliquam ut, faucibus non, euismod id, nulla.

            Vivamus in erat ut urna cursus vestibulum. Quisque ut nisi. Curabitur nisi. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Donec vitae sapien ut libero venenatis faucibus.
          </p>
          <p>
            Nunc nec neque. Vestibulum fringilla pede sit amet augue. Curabitur at lacus ac velit ornare lobortis. Pellentesque commodo eros a enim. Donec orci lectus, aliquam ut, faucibus non, euismod id, nulla.

            Vivamus in erat ut urna cursus vestibulum. Quisque ut nisi. Curabitur nisi. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Donec vitae sapien ut libero venenatis faucibus.

            Maecenas nec odio et ante tincidunt tempus. Pellentesque commodo eros a enim. Suspendisse feugiat. Nulla facilisi. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus.
          </p>
        </v-col>
        <v-col
          cols="12"
          md="6"
        >
          <v-card
            class="mx-auto"
            elevation="24"
            max-width="400"
          >
            <v-img
              max-height="250"
              :src="require(`@/assets/${project.bg2}`)"
            />
          </v-card>
        </v-col>

        <v-col
          class="text-center my-5"
          cols="12"
        >
          <iframe
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            frameborder="0"
            height="315"
            src="https://www.youtube.com/embed/7X8II6J-6mU"
            width="100%"
          />
        </v-col>
      </v-row>
    </v-sheet>
    <v-sheet
      height="400"
      color="grey darken-2"
      tile
    />
    <v-sheet
      height="200"
      color="grey darken-3"
      tile
    />
  </v-container>
</template>

<script>
  // Utilities
  import {
    mapGetters,
    mapState,
  } from 'vuex'

  export default {
    name: 'ExplorePage',

    computed: {
      ...mapGetters('projects', ['parsedProjects']),
      // ...mapState('route', ['params']),
      project () {        
        return this.parsedProjects.find(project => Number(project.id) === Number(this.$route.params.id))
      },
    },
  }
</script>
