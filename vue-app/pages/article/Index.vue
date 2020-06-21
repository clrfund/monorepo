<template>
  <v-container
    v-if="article"
    class="article pt-0 px-0"
  >
    <v-img
      :src="require(`@/assets/${article.img}`)"
      gradient="to bottom, rgba(0,0,0,.4), rgba(0,0,0,0)"
      height="50vh"
    >
      <nuxt-link to="/">
        <v-subheader>
          Back to Home
        </v-subheader>
      </nuxt-link>
    </v-img>

    <v-sheet
      class="py-5 px-3"
      color="grey lighten-2"
      light
    >
      <h1
        class="display-3 font-weight-bold mb-4"
        v-text="article.title"
      />

      <v-row>
        <v-col
          cols="12"
          md="6"
          class="grey--text text--darken-2 title font-weight-light"
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

          <v-row
            align="center"
            justify="space-between"
            class="pt-4 white mx-0"
            tag="p"
          >
            <span class="pl-3 subheading">
              Share this on social media
            </span>

            <div class="d-flex">
              <v-btn icon>
                <v-icon>mdi-discord</v-icon>
              </v-btn>

              <v-btn icon>
                <v-icon>mdi-reddit</v-icon>
              </v-btn>

              <v-btn icon>
                <v-icon>mdi-twitter</v-icon>
              </v-btn>

              <v-btn icon>
                <v-icon>mdi-facebook</v-icon>
              </v-btn>
            </div>
          </v-row>
        </v-col>

        <v-col
          cols="12"
          md="6"
          class="mt-5"
        >
          <v-card
            class="mx-auto"
            elevation="24"
            max-width="400"
          >
            <v-img :src="require(`@/assets/${article.altImg}`)" />
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>
  </v-container>
</template>

<script>
  // Utilities
  import {
    mapState,
  } from 'vuex'

  export default {
    name: 'Article',

    computed: {
      ...mapState('home', ['articles']),
      ...mapState('route', ['params']),
      article () {
        return this.articles.find(article => article.slug === this.params.slug)
      },
    },
  }
</script>

<style lang="scss">
.article {
  p {
    line-height: 2;
    padding: 0 12px 20px;
  }
}
</style>
