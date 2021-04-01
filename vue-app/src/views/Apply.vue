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
      <v-form v-model="isFormValid">
        <div class="your-project">Your project</div>
        <div v-if="currentStep === 0">
          <h2 class="step-title">About the project</h2>
          <div class="inputs">
            <div class="form-background">
              <label for="name" class="input-label">Name</label>
              <input required placeholder="example: clr.fund" id="name" class="input" />
            </div>
            <div class="form-background">
              <label for="tagline" class="input-label">Tagline</label>
              <p class="input-description">Describe your project in a sentence.</p>
              <input required placeholder="example: A quadratic funding protocol" id="tagline" class="input" />
            </div>
            <div class="form-background">
              <label for="description" class="input-label">Description</label>
              <p class="input-description">Markdown supported.</p>
              <textarea required id="description" placeholder="example: CLR.fund is a quadratic funding protocol that aims to make it as easy as possible to set up, manage, and participate in quadratic funding rounds..." class="input" />
            </div>
            <div class="form-background">
              <label for="category" class="input-label">Category</label>
              <select required placeholder ="Choose the best fit" id="category" class="input">
                  <option selected disabled label="Choose the best fit" />
                  <option value="content">Content</option>
                  <option value="researcg">Research</option>
                  <option value="tooling">Tooling</option>
                  <option value="data">Data</option>
              </select>
            </div>
            <div class="form-background">
              <label for="problem-space" class="input-label">Problem space</label>
              <p class="input-description">Explain the problems you're trying to solve.</p>
              <textarea required id="problem-space" placeholder="example: there is no way to spin up a quadratic funding round. Right now, you have to collaborate with GitCoin Grants which isn’t a scalable or sustainable model." class="input" />
            </div>
          </div>
        </div>    
        <div v-if="currentStep === 1">
          <h2 class="step-title">Donation details</h2>
          <div class="inputs">
            <div class="form-background">
              <label for="eth-address" class="input-label">Ethereum address</label>
              <p class="input-description">This doesn’t have to be the same address as the one you use to send your application.</p>
              <input placeholder="example: clr.eth, clr.crypto, 0x123..." id="eth-address" class="input" />
            </div>
            <div class="form-background">
              <label for="funding" class="input-label">How will you spend your funding?</label>
              <p class="input-description">Potential contributors might convert based on your specific funding plans.</p>
              <textarea placeholder="example: on our roadmap..." id="funding" class="input" />
            </div>
          </div>
        </div>
        <div v-if="currentStep === 2">
          <h2 class="step-title">About the team  </h2>
          <div class="inputs">
            <div class="form-background">
              <label for="team-name" class="input-label">Team name</label>
              <p class="input-description">If different to project name.</p>
              <input placeholder="example: clr.fund" id="team-name" class="input" />
            </div>
            <div class="form-background">
              <label for="team-desc" class="input-label">Description</label>
              <p class="input-description">If different to project description.</p>
              <textarea id="team-desc" placeholder="example: CLR.fund is a quadratic funding protocol that aims to make it as easy as possible to set up, manage, and participate in quadratic funding rounds..." class="input" />
            </div>
          </div>
        </div>
        <div v-if="currentStep === 3">
          <h2 class="step-title">Links</h2>
          <div class="inputs">
            <div class="form-background">
              <label for="github" class="input-label">GitHub</label>
              <input type="link" placeholder="example: github.com/ethereum/clrfund" id="github" class="input" />
            </div>
            <div class="form-background">
              <label for="radicle" class="input-label">Radicle</label>
              <input type="link" placeholder="example: github.com/ethereum/clrfund" id="radicle" class="input" />
            </div>
            <div class="form-background">
              <label for="website" class="input-label">Website</label>
              <input type="link" placeholder="example: github.com/ethereum/clrfund" id="website" class="input" />
            </div>
            <div class="form-background">
              <label for="twitter" class="input-label">Twitter</label>
              <input type="link" placeholder="example: github.com/ethereum/clrfund" id="twitter" class="input" />
            </div>
            <div class="form-background">
              <label for="discord" class="input-label">Discord</label>
              <input type="link" placeholder="example: github.com/ethereum/clrfund" id="discord" class="input" />
            </div>
          </div>
        </div>
        <div v-if="currentStep === 4">
          <h2 class="step-title">Images</h2>
          <div class="inputs">
            <div class="form-background">
              <div class="row">
                <form>
                  <div>
                    <input type="radio" id="IPFS" name="IPFS" value="IPFS">
                    <label for="IPFS">IPFS – you have IPFS hashes for your images</label>
                  </div>
                  <div>
                    <input type="radio" id="upload" name="Upload" value="Upload">
                    <label for="Upload">Upload – you'd like to upload from your device</label>
                  </div>
                </form>
              </div>
            </div>
            <div class="form-background">
              <label for="github" class="input-label">Banner image</label>
              <p class="input-description">Recommended dimensions: 500 x 300</p>
              <input type="file" placeholder="example: github.com/ethereum/clrfund" id="github" class="input" />
            </div>
            <div class="form-background">
              <label for="github" class="input-label">Banner image</label>
              <p class="input-description">Recommended dimensions: 80 x 80</p>
              <input type="file" placeholder="example: github.com/ethereum/clrfund" id="github" class="input" />
            </div>
          </div>
        </div>
        <div v-if="currentStep === 5">
          <h2 class="step-title">Review</h2>
        </div>
        <div class="btn-row">
          <router-link v-if="currentStep > 0" :to="{ name: 'apply', params: { step: steps[currentStep - 1] }}"><button class="btn btn-secondary">Previous step</button></router-link>
          <router-link :disabled="!isFormValid" v-if="currentStep < 5" :to="{ name: 'apply', params: { step: steps[currentStep + 1] }}"><v-btn :disabled="!isFormValid" class="btn btn-primary">Next step</v-btn></router-link>
          <router-link v-if="currentStep == 5" :to="{ name: 'apply', params: { step: steps[currentStep + 1] }}"><button class="btn btn-primary">Finish</button></router-link>
        </div>
      </v-form>
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
  
  data: () => ({
    isFormValid: false;
  })
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
    &:disabled { background: $clr-green;
  }
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
  border-radius: 16px;
  border: 2px solid $button-color;
  background-color: $bg-secondary-color;
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0em;
  &:valid { border: 2px solid $clr-green;
  }
}



.input-description {
  margin-top: 0.25rem;
  font-size: 14px;
  font-family: Inter;
  margin-bottom: 0.5rem;
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

.dropdown-default {
  opacity: 0.4;
}

</style>
