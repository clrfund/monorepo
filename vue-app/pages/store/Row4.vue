<template>
  <v-row>
    <v-col
      v-for="(game, i) in value"
      :key="i"
      cols="12"
      md="6"
    >
      <game :value="game" />
    </v-col>
  </v-row>
</template>

<script>
  export default {
    components: {
      Game: () => import('@/components//Game'),
    },

    props: {
      value: {
        type: Array,
        default: () => ([]),
      },
    },
  }
</script>
