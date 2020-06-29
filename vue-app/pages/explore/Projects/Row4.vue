<template>
  <v-row>
    <v-col
      v-for="(project, i) in value"
      :key="i"
      cols="12"
      md="6"
    >
      <project :value="project" />
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
  }
</script>
