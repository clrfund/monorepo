<template>
  <div>
    <featured />

    <games />
  </div>
</template>

<script>
  export default {
    components: {
      Featured: () => import('./Featured'),
      Games: () => import('./Games'),
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
