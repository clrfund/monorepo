<template>
<div>
  <router-link to="/projects" class="back desktop">Back to projects</router-link>
  <round-information class="padding" />
</div>
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
.back {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 1rem 1rem 0;
}

.padding {
  padding: 0 1rem;
}
</style>