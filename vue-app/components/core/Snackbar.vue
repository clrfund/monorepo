<template>
  <v-snackbar
    v-model="snack"
    :color="snackbar.color"
    :style="{
      marginBottom: $vuetify.breakpoint.smOnly ? '40px' : null
    }"
    :timeout="snackbar.timeout"
    bottom
  >
    <v-row
      align="center"
      class="mx-0"
    >
      <v-icon
        v-if="computedIcon"
        class="mr-3"
        dark
      >
        {{ computedIcon }}
      </v-icon>

      <div v-text="snackbar.msg" />

      <v-spacer />

      <v-btn
        :color="computedColor"
        :text="snackbar.color !== 'store'"
        :ripple="false"
        v-bind="bind"
        dark
        depressed
        @click="setValue(false)"
      >
        {{ snackbar.text }}
      </v-btn>

      <v-btn
        v-if="snackbar.close"
        :ripple="false"
        class="ml-3"
        icon
      >
        <v-icon>clear</v-icon>
      </v-btn>
    </v-row>
  </v-snackbar>
</template>

<script>
  import {
    mapMutations,
    mapState,
  } from 'vuex'

  export default {
    name: 'CoreSnackbar',

    computed: {
      ...mapState('snackbar', ['snackbar', 'value']),
      bind () {
        if (this.snackbar.to) return { to: this.snackbar.to }
        if (this.snackbar.href) {
          return {
            href: this.snackbar.href,
            target: '_blank',
            rel: 'noopener',
          }
        }

        return {}
      },
      computedColor () {
        if (this.snackbar.color !== 'store') {
          return !this.computedIcon ? 'primary lighten-3' : null
        }

        return 'green'
      },
      computedIcon () {
        switch (this.snackbar.color) {
          case 'store': return 'mdi-cart'
          case 'success': return 'mdi-check'
          case 'info': return 'mdi-info'
          case 'warning': return 'mdi-warning'
          case 'error': return 'mdi-error'
          default: return false
        }
      },
      snack: {
        get () {
          return this.value
        },
        set (val) {
          this.setValue(val)
        },
      },
    },

    methods: {
      ...mapMutations('snackbar', ['setValue']),
    },
  }
</script>

<style>
  .snack-markdown p {
    margin-bottom: 0 !important;
  }
</style>
