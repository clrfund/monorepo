<template>
  <v-row>
    <v-col>
      <game
        :value="game"
        prominent
      />
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

    computed: {
      game () {
        return this.value[0]
      },
    },
  }
</script>
