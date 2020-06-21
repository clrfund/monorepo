<template>
  <v-sheet
    :color="'secondary'"
    class="transition-swing"
    height="64"
    tile
  >
    <v-row
      align="center"
      justify="center"
      class="fill-height flex-nowrap"
    >
      <v-col
        cols="auto"
        class="pa-0 text-center overline"
      >
        Verifying {{ status }}%
      </v-col>

      <v-col
        cols="6"
        class="px-3"
      >
        <v-progress-linear
          :value="status"
        />
      </v-col>

      <v-icon @click="resetVerify">
        mdi-close
      </v-icon>

      <v-divider
        class="mx-2"
        inset
        vertical
      />

      <v-icon
        v-if="!paused"
        @click="pauseVerify"
      >
        mdi-pause
      </v-icon>
      <v-icon
        v-else
        @click="startVerify"
      >
        mdi-play
      </v-icon>
    </v-row>
  </v-sheet>
</template>

<script>
  // Utilities
  import {
    mapActions,
    mapMutations,
    mapState,
  } from 'vuex'

  export default {
    name: 'LibraryVerifyAction',

    props: {
      value: {
        type: Object,
        default: () => ({}),
      },
    },

    data: () => ({
      resolve: undefined,
    }),

    computed: {
      ...mapState('verify', [
        'paused',
        'status',
        'verifying',
      ]),
    },

    methods: {
      ...mapActions('verify', ['reset']),
      ...mapMutations('verify', [
        'setCancelled',
        'setPaused',
      ]),
      async pauseVerify () {
        const pause = new Promise(resolve => {
          this.resolve = resolve
        })

        this.setPaused(pause)
      },
      resetVerify () {
        this.setCancelled(true)

        setTimeout(this.reset, 300)
      },
      startVerify () {
        this.resolve && this.resolve()
        this.setPaused(false)
      },
    },
  }
</script>
