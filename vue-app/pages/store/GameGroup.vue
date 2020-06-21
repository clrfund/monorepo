<template>
  <component
    :is="value.component"
    :value="value.group"
  />
</template>

<script>
  export default {
    components: {
      Row1: () => import('./Row1'),
      Row2: () => import('./Row2'),
      Row3: () => import('./Row3'),
      Row4: () => import('./Row4'),
    },

    props: {
      value: {
        type: Object,
        default: () => ({}),
      },
    },
  }
</script>
