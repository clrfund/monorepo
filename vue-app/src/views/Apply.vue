<template>
  <div class="application-page">
    <div class="application">
      <div>
      <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length"/>
      <div class="row">
        <h3>
          Step {{currentStep + 1}} of {{steps.length}}
        </h3>
        <a class="link" @click="goBackStep()">
              Cancel
        </a>
      </div>
      <form>
        <div class="your-project">Your project</div>
        <div v-if="currentStep === 0">
          <h2 class="step-title">About the project</h2>
        </div>
        <div class="inputs">
          <div class="form-background">
            <label for="name" class="input-label">Name</label>
            <input placeholder="example: clr.fund" id="name" class="input" />
          </div>
          <div class="form-background">
            <label for="tagline" class="input-label">Tagline</label>
            <input id="tagline" class="input" />
          </div>
          <div class="form-background">
            <label for="description" class="input-label">Description</label>
            <input id="description" class="input" />
          </div>
          <div class="form-background">
            <label for="category" class="input-label">Category</label>
            <input id="category" class="input" />
          </div>
          <div class="form-background">
            <label for="problem-space" class="input-label">Problem space</label>
            <input id="problem-space" class="input" />
          </div>
        </div>
        <div v-if="currentStep === 1">
          <h2 class="step-title">Donation details</h2>
        </div>
        <div v-if="currentStep === 2">
          <h2 class="step-title">About the team  </h2>
        </div>
        <div v-if="currentStep === 3">
          <h2 class="step-title">Links</h2>
        </div>
        <div v-if="currentStep === 4">
          <h2 class="step-title">Images</h2>
        </div>
        <div v-if="currentStep === 5">
          <h2 class="step-title">Review</h2>
        </div>
      </form>
      </div>

      <div class="btn-row">
        <router-link v-if="currentStep > 0" :to="{ name: 'apply', params: { step: steps[currentStep - 1] }}"><button class="btn btn-secondary">Previous step</button></router-link>
        <router-link v-if="currentStep < 5" :to="{ name: 'apply', params: { step: steps[currentStep + 1] }}"><button class="btn btn-primary">Next step</button></router-link>
        <router-link v-if="currentStep == 5" :to="{ name: 'apply', params: { step: steps[currentStep + 1] }}"><button class="btn btn-primary">Finish</button></router-link>
      </div>
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
    const steps = ['one', 'two', 'three', 'four', 'five', 'six']
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

.your-project {
  margin-top: 2rem;
  padding-bottom: 0;
  display: block;
  font-family: 'Glacial Indifference', sans-serif;
  font-size: 14px;
  font-weight: normal;
  letter-spacing: 6px;
  margin-top: 2rem;;
  text-transform: uppercase;
}

.step-title {
  font-size: 2rem;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  bottom: 0;
}

.application {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.application-page {
  display: flex;

  height: 100%;
  flex-direction: column;
  justify-content: space-between;
}

.link {
  font-family: Inter;
  font-size: 16px;
  text-decoration: underline;
}

.btn {
  padding: 0.5rem 1.5rem;
  /* margin: 0 auto; */
  border-radius: 2rem;
  color: white;
  font-family: Inter;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 150%;
  text-align: center;
  background: none;
  border: none;
}

.btn-primary {
  background: $clr-green;
}

.btn-secondary {
  border: 2px solid $clr-green;
  color: $clr-green;
}

.inputs {
  margin: 1.5rem 0;
}

.form-background {
  border-radius: 0.5rem;
  padding: 1rem;
  background: $bg-light-color;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  &:last-of-type {
    margin-bottom: 2rem;
  }
}

.input {
  border-radius: 32px;
  border: 2px solid $button-color;
  background-color: $bg-secondary-color;
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0em;
}

.input-label {
  font-family: Inter;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0em;
  text-align: left;
  margin: 0;
}

</style>
