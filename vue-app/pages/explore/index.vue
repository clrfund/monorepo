<template>
  <div>
    <featured />

    <projects />
  </div>
</template>

<script>
  export default {
    components: {
      Featured: () => import('./Featured'),
      Projects: () => import('./Projects'),
    },

    metaInfo () {
      return {
        title: this.$i18n.t('Home.title'),
      }
    },

    data: () => ({

    }),
  }
</script>
