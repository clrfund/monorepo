<template>
  <div class="application">
    <a class="content-heading" @click="goBackStep()">
      ⟵ Back
    </a>
    <div class="application-page">
      <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length"/>
      <router-link v-if="currentStep > 0" :to="{ name: 'apply', params: { step: steps[currentStep - 1] }}">Previous step</router-link>
      <h3>
        Step {{currentStep + 1}} of {{steps.length}}
      </h3>

      <form>

        <div v-if="currentStep === 0">
          <h2>Checking BrightID verification...</h2>
        </div>
        <div v-if="currentStep === 1">
          <h2>Doing something new...</h2>
        </div>
        <div v-if="currentStep === 2">
          <h2>Doing something dumb...</h2>
        </div>
        <div v-if="currentStep === 3">
          <h2>Doing something fun...</h2>
        </div>
        <div v-if="currentStep === 4">
          <h2>Yay almost done...</h2>
        </div>

      </form>

      <router-link v-if="currentStep < 4" :to="{ name: 'apply', params: { step: steps[currentStep + 1] }}">Next step</router-link>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import ProgressBar from '@/components/ProgressBar.vue'

@Component({
  name: 'ApplyView',
  metaInfo: { title: 'Apply' },
  components: {
    ProgressBar,
  },
})
export default class About extends Vue { 

  currentStep: number | null = null
  steps: string[]

  created() {
    const steps = ['one', 'two', 'three', 'four', 'five']
    const currentStep = steps.indexOf(this.$route.params.step)
    this.steps = steps
    this.currentStep = currentStep
    // TODO redirect to /apply/one if step doesn't exist
    // if (currentStep < 0) {
    //   console.log('NO STEP')
    //   this.$router.push({ name: 'apply', params: 'one' })
    //   return
    // }
  }
}
</script>

<style scoped lang="scss">
@import "../styles/vars";

.content-heading {
  color: $text-color;
}

</style>
