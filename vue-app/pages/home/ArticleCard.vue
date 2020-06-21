<template>
  <v-card elevation="6">
    <v-card-title>
      <div>
        <h2
          class="title font-weight-regular"
          v-text="value.title"
        />

        <v-row
          align="center"
          class="grey--text text--lighten-1 mx-0 py-3"
        >
          <v-avatar
            class="mr-2"
            color="grey darken-1"
            size="22"
          >
            <v-icon
              small
              color="grey lighten-1"
              @click="() => {}"
            >
              mdi-pencil
            </v-icon>
          </v-avatar>

          <span
            class="v-card--article__author"
            v-text="value.author"
          />

          &nbsp;•&nbsp;

          <span v-text="value.ago" />
        </v-row>
      </div>
    </v-card-title>

    <nuxt-link :to="`/article/${value.slug}`">
      <v-img
        :src="require(`@/assets/${value.img}`)"
        height="400"
      />
    </nuxt-link>
  </v-card>
</template>

<script>
  export default {
    name: 'HomeArticleCard',

    props: {
      value: {
        type: Object,
        default: () => ({}),
      },
    },
  }
</script>
