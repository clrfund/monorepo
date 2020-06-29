<template>
  <v-row>
    <v-col>
      <project
        :value="project"
        prominent
      />
    </v-col>
  </v-row>
</template>

<script>
  export default {
    components: {
      Project: () => import('@/components//Project'),
    },

    props: {
      value: {
        type: Array,
        default: () => ([]),
      },
    },

    computed: {
      project () {
        return this.value[0]
      },
    },
  }
</script>
