<template>
  <div>
    <projects />
  </div>
</template>

<script>
  export default {
    name: 'Rounds',

    components: {
      Projects: () => import('./Projects'),
    },
  }
</script>
