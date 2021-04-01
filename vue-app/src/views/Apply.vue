<template>
  <div class="application">
    <a class="content-heading" @click="goBackStep()">
      ⟵ Back
    </a>
    <div class="application-page">
      Application page?
      <p>
        currentStep: {{currentStep}}
      </p>
      <router-link :to="{ name: 'apply', params: { step: steps[currentStep + 1] }}">Previous step</router-link>
      <br>
      <router-link :to="{ name: 'apply', params: { step: steps[currentStep + 1] }}">Next step</router-link>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component({
  name: 'ApplyView',
  metaInfo: { title: 'Apply' },
})
export default class About extends Vue { 

  currentStep: number | null = null
  steps: string[]

  created() {
    const steps = ['one', 'two', 'three', 'four', 'five']
    const currentStep = steps.indexOf(this.$route.params.step)
    this.currentStep = currentStep
    this.steps = steps
  }
}
</script>

<style scoped lang="scss">
@import "../styles/vars";

.content-heading {
  color: $text-color;
}

</style>
