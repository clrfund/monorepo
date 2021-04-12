<template>
  <round-information/>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import RoundInformation from '@/components/RoundInformation.vue'


@Component({
  name: 'round-info',
  metaInfo: { title: 'Round' },
  components: {
    RoundInformation,
  },
})
export default class RoundInformationVue extends Vue {
}
</script>