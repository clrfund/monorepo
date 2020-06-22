<template>
  <news />
</template>

<script>
  export default {
    name: 'Home',

    components: {
      News: () => import('./News'),
    },
  }
</script>
