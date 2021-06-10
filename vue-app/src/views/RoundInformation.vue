<template>
  <round-information />
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import RoundInformation from '@/components/RoundInformation.vue'

@Component({
  name: 'round-info',
  components: { RoundInformation },
})
export default class RoundInformationVue extends Vue {}
</script>

<style lang="scss" scoped>
</style>