<template>
  <div>
    <games />
  </div>
</template>

<script>
  export default {
    name: 'Library',

    components: {
      Games: () => import('./Games'),
    },
  }
</script>
