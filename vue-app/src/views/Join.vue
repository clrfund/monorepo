<template>
  <div class="container">
    <div class="grid">
      <div class="progress-area desktop">
        <div class="progress-container">
          <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length" />
          <p class="subtitle">
            Step {{currentStep + 1}} of {{steps.length}}
          </p>
          <div class="progress-steps">
            <div
              v-for="(name, step) in stepNames"
              :key="step"
              class="progress-step"
              :class="{'progress-step-checked': step <= form.furthestStep && step !== currentStep}"
              @click="handleStepNav(step)"
            >
              <template v-if="step === currentStep">
                <img src="@/assets/current-step.svg" alt="current step" />
                <p v-text="name" class="active step" />
              </template>
              <template v-else-if="step <= form.furthestStep">
                <img src="@/assets/green-tick.svg" alt="step complete" />
                <p v-text="name" class="step" />
              </template>
              <template v-else-if="step > form.furthestStep">
                <img src="@/assets/step-remaining.svg" alt="step remaining" />
                <p v-text="name" class="step" />
              </template>
            </div>
          </div>
          <button-row
            :isStepValid="isStepValid(currentStep)"
            :steps="steps"
            :currentStep="currentStep"
            :callback="saveFormData"
            class="desktop"
          />
        </div>
      </div>
      <div class="progress-area mobile">
        <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length" />
        <div class="row">
          <p>
              Step {{currentStep + 1}} of {{steps.length}}
          </p>
          <router-link class="cancel-link" to="/join">
            Cancel
          </router-link>
        </div>
      </div>
      <div class="title-area">
        <h1 class="desktop">Join the round</h1>
        <h1 class="mobile">Join the round</h1>
      </div>
      <div class="cancel-area desktop">
        <router-link class="cancel-link" to="/join">
          Cancel
        </router-link>
      </div>
      <div class="form-area">
        <div class="application">
          <form>
            <div v-if="currentStep === 0">
              <h2 class="step-title">About the project</h2>
              <div class="inputs">
                <div class="form-background">
                  <label for="project-name" class="input-label">Name</label>
                  <!-- TODO figure out onblur validation -->
                  <input
                    id="project-name"
                    type="text"
                    placeholder="example: clr.fund"
                    v-model="$v.form.project.name.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.project.name.$error
                    }"
                  >
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.name.$error
                  }">Your project needs a name</p>
                </div>
                <div class="form-background">
                  <label for="project-tagline" class="input-label">Tagline</label>
                  <p class="input-description">Describe your project in a sentence. Max characters: 140</p>
                  <textarea
                    id="project-tagline"
                    placeholder="example: A quadratic funding protocol"
                    v-model="$v.form.project.tagline.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.project.tagline.$error 
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.tagline.$error
                  }">This tagline is too long. Be brief for potential contributors</p>
                  <!-- TODO: validation for different error type -->
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.tagline.$error
                  }">Your project needs a tagline</p>
                </div>
                <div class="form-background">
                  <label for="project-description" class="input-label">
                    Description
                    <p class="input-description">Markdown supported.</p>
                    <!-- TODO: actually support markdown in input -->
                  </label>
                  <textarea
                    id="project-description"
                    placeholder="example: CLR.fund is a quadratic funding protocol that aims to make it as easy as possible to set up, manage, and participate in quadratic funding rounds..."
                    v-model="$v.form.project.description.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.project.description.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.description.$error
                  }">Your project needs a description. What are you raising money for?</p>
                </div>
                <div class="form-background">
                  <label for="project-category" class="input-label">Category
                    <p class="input-description">Choose the best fit</p>
                  </label>
                  <form class="radio-row" id="category-radio" tabindex="0">
                    <input
                      id="category-content"
                      type="radio"
                      name="project-category"
                      value="content"
                      v-model="$v.form.project.category.$model"
                      :class="{
                        input: true,
                        invalid: $v.form.project.category.$error
                      }"
                    >
                    <label for="category-content" class="radio-btn">Content</label>
                    <input
                      id="research"
                      type="radio"
                      name="project-category"
                      value="research"
                      v-model="$v.form.project.category.$model"
                      :class="{
                        input: true,
                        invalid: $v.form.project.category.$error
                      }"
                    >
                    <label for="research" class="radio-btn">Research</label>
                    <input
                      id="tooling"
                      type="radio"
                      name="project-category"
                      value="tooling"
                      v-model="$v.form.project.category.$model"
                      :class="{
                        input: true,
                        invalid: $v.form.project.category.$error
                      }"
                    >
                    <label for="tooling" class="radio-btn">Tooling</label>
                    <input
                      id="data"
                      type="radio"
                      name="project-category"
                      value="data"
                      v-model="$v.form.project.category.$model"
                      :class="{
                        input: true,
                        invalid: $v.form.project.category.$error
                      }"
                    >
                    <label for="data" class="radio-btn">Data</label>
                  </form>
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.category.$error
                  }">You need to choose a category</p>
                </div>
                <div class="form-background">
                  <label for="project-problem-space" class="input-label">Problem space</label>
                  <p class="input-description">Explain the problems you're trying to solve.</p>
                  <textarea
                    id="project-problem-space"
                    placeholder="example: there is no way to spin up a quadratic funding round. Right now, you have to collaborate with GitCoin Grants which isn’t a scalable or sustainable model."
                    v-model="$v.form.project.problemSpace.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.project.problemSpace.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.problemSpace.$error
                  }">Explain the problem your project solves</p>
                </div>
              </div>
            </div>    
            <div v-if="currentStep === 1">
              <h2 class="step-title">Donation details</h2>
              <div class="inputs">
                <div class="form-background">
                  <label for="fund-address" class="input-label">Ethereum address</label>
                  <p class="input-description">This doesn’t have to be the same address as the one you use to send your application.</p>
                  <input
                    id="fund-address"
                    placeholder="example: clr.eth, clr.crypto, 0x123..."
                    v-model="$v.form.fund.address.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.fund.address.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.fund.address.$error
                  }">Enter a valid Ethereum address (0x or ENS)</p>
                  <!-- TODO: only validate after user removes focus on input -->
                </div>
                <div class="form-background">
                  <label for="fund-plans" class="input-label">How will you spend your funding?</label>
                  <p class="input-description">Potential contributors might convert based on your specific funding plans.</p>
                  <textarea
                    id="fund-plans"
                    placeholder="example: on our roadmap..."
                    v-model="$v.form.fund.plans.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.fund.plans.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.fund.plans.$error
                  }">Let potential contributors know what plans you have for their donations.</p>
                </div>
              </div>
            </div>
            <div v-if="currentStep === 2">
              <h2 class="step-title">Team details</h2>
              <div class="inputs">
                <div class="form-background">
                  <label for="team-email" class="input-label">Contact email</label>
                  <p class="input-description">For important updates about your project and the funding round.</p>
                  <input
                    required
                    id="team-email"
                    placeholder="example: doge@goodboi.com"
                    v-model="$v.form.team.email.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.team.email.$error
                    }"
                  >
                  <p class="input-notice">We won't display this publicly or add it to the on-chain registry.</p>
                  <p :class="{
                    error: true,
                    hidden: !$v.form.team.email.$error
                  }">This doesn't look like an email.</p>
                </div>
                <div class="form-background">
                  <label for="team-name" class="input-label">Team name (optional)</label>
                  <p class="input-description">If different to project name.</p>
                  <input
                    id="team-name"
                    type="email"
                    placeholder="example: clr.fund"
                    v-model="$v.form.team.name.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.team.name.$error
                    }"
                  />
                </div>
                <div class="form-background">
                  <label for="team-desc" class="input-label">Description (optional)</label>
                  <p class="input-description">If different to project description.</p>
                  <textarea
                    id="team-desc"
                    placeholder="example: CLR.fund is a quadratic funding protocol that aims to make it as easy as possible to set up, manage, and participate in quadratic funding rounds..."
                    v-model="$v.form.team.description.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.team.description.$error
                    }"
                  />
                </div>
              </div>
            </div>
            <div v-if="currentStep === 3">
              <h2 class="step-title">Links</h2>
              <div class="inputs">
                <div class="form-background">
                  <label for="links-github" class="input-label">GitHub</label>
                  <input
                    id="links-github" 
                    type="link" 
                    placeholder="example: github.com/ethereum/clrfund" 
                    class="input"
                    v-model="$v.form.links.github.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.links.github.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.links.github.$error
                  }">This doesn't look like a valid URL</p>
                  <!-- TODO: only validate after user removes focus on input -->
                </div>
                <div class="form-background">
                  <label for="links-radicle" class="input-label">Radicle</label>
                  <input
                    id="links-radicle" 
                    type="link" 
                    placeholder="example: radicle.com/ethereum/clrfund" 
                    class="input"
                    v-model="$v.form.links.radicle.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.links.radicle.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.links.radicle.$error
                  }">This doesn't look like a valid URL</p>
                </div>
                <div class="form-background">
                  <label for="links-website" class="input-label">Website</label>
                  <input
                    id="links-website" 
                    type="link" 
                    placeholder="example: website.com/ethereum/clrfund" 
                    class="input"
                    v-model="$v.form.links.website.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.links.website.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.links.website.$error
                  }">This doesn't look like a valid URL</p>
                </div>
                <div class="form-background">
                  <label for="links-twitter" class="input-label">Twitter</label>
                  <input
                    id="links-twitter" 
                    type="link" 
                    placeholder="example: github.com/ethereum/clrfund" 
                    class="input"
                    v-model="$v.form.links.twitter.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.links.twitter.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.links.twitter.$error
                  }">This doesn't look like a valid URL</p>
                </div>
                <div class="form-background">
                  <label for="links-discord" class="input-label">Discord</label>
                  <input
                    id="links-discord" 
                    type="link" 
                    placeholder="example: github.com/ethereum/clrfund" 
                    class="input"
                    v-model="$v.form.links.discord.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.links.discord.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.links.discord.$error
                  }">This doesn't look like a valid URL</p>
                </div>
              </div>
            </div>
            <div v-if="currentStep === 4">
              <h2 class="step-title">Images</h2>
              <p>We'll upload your images to IPFS, a decentralized storage platform.</p>
              <div class="inputs">
                <div class="form-background">
                  <ipfs-form label="Banner image" description="Recommended dimensions: 500px x 300px" :onUpload="handleUpload" formProp="bannerHash"/>
                </div>
                <div class="form-background">
                  <ipfs-form label="Thumbnail image" description="Recommended dimensions: 80px x 80px" :onUpload="handleUpload" formProp="thumbnailHash"/>
                </div>
              </div>
            </div>
          </form>
          <!-- TODO show summary of information -->
          <!-- Summary -->
          <div v-if="currentStep === 5" id="summary">
            <project-component :data="projectInterface" :previewMode="true" />
            <!--TODO: this will be an on-chain transaction so double check all info and links are correct as it will cost you you to change it -->
          </div>
        </div>
      </div>
      <div class="nav-area nav-bar mobile">
        <button-row :steps="steps" :currentStep="currentStep" :callBack="saveFormData" />
        <!-- TODO submit button to trigger tx, pass callback to above <botton-row />?  -->
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Component, { mixins } from 'vue-class-component'
import { validationMixin } from 'vuelidate'
import { required, maxLength, url, email } from 'vuelidate/lib/validators'
import * as isIPFS from 'is-ipfs'
import { isAddress } from '@ethersproject/address'

import LayoutSteps from '@/components/LayoutSteps.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import ButtonRow from '@/components/ButtonRow.vue'
import IpfsForm from '@/components/IpfsForm.vue'
import ProjectComponent from '@/components/ProjectComponent.vue'

import { SET_RECIPIENT_DATA } from '@/store/mutation-types'
import { RecipientApplicationData, formToProjectInterface } from '@/api/recipient-registry-optimistic'
import { Project } from '@/api/projects'

@Component({
  components: {
    LayoutSteps,
    ProgressBar,
    ButtonRow,
    IpfsForm,
    ProjectComponent,
  },
  validations: {
    form: {
      project: {
        name: {
          required,
        },
        tagline: {
          required,
          maxLength: maxLength(140),
        },
        description: { required },
        category: { required },
        problemSpace: { required },
      },
      fund: {
        address: {
          required,
          validEthAddress: isAddress,
        },
        plans: { required },
      },
      team: {
        name: {},
        description: {},
        email: { 
          email, 
          required,
        },
      },
      links: {
        github: { url },
        radicle: { url },
        website: { url },
        twitter: { url },
        discord: { url },
      },
      image: {
        bannerHash: {
          required,
          validIpfsHash: isIPFS.cid,
        },
        thumbnailHash: {
          required,
          validIpfsHash: isIPFS.cid,
        },
      },
    },
  },
})
export default class JoinView extends mixins(validationMixin) {
  form: RecipientApplicationData = {
    project: {
      name: '',
      tagline: '',
      description: '',
      category: '',
      problemSpace: '',
    },
    fund: {
      address: '',
      plans: '',
    },
    team: {
      name: '',
      description: '',
      email: '',
    },
    links: {
      github: '',
      radicle: '',
      website: '',
      twitter: '',
      discord: '',
    },
    image: {
      bannerHash: '',
      thumbnailHash: '',
    },
    furthestStep: 0,
  }
  currentStep: number | null = null
  steps: string[] = []
  stepNames: string[] = []


  created() {
    const steps = Object.keys(this.form)
    steps[steps.length - 1] = 'summary'
    const currentStep = steps.indexOf(this.$route.params.step)
    const stepNames = [
      'About the project',
      'Donation details',
      'Team details',
      'Links',
      'Images',
      'Review',
    ]
    this.steps = steps
    this.currentStep = currentStep
    this.stepNames = stepNames
    this.form = this.$store.state.recipient || this.form

    // redirect to /join/ if step doesn't exist
    if (this.currentStep < 0) {
      this.$router.push({ name: 'join' })
    }
  }
  
  isStepValid(step: number): boolean {
    const stepName: string = this.steps[step]
    return !this.$v.form[stepName]?.$invalid
  }

  isStepUnlocked(step: number): boolean {
    return this.isStepValid(step) && step <= this.form.furthestStep
  }

  saveFormData(): void {
    if (typeof this.currentStep !== 'number') { return }
    this.$store.commit(SET_RECIPIENT_DATA, {
      updatedData: this.form,
      step: this.steps[this.currentStep],
      stepNumber: this.currentStep,
    })
  }

  // Callback from IpfsForm component
  handleUpload(key, value) {
    this.form.image[key] = value
  }

  handleStepNav(step) {
    this.saveFormData()
    if (this.isStepUnlocked(step)) {
      this.$router.push({
        name: 'joinStep',
        params: {
          step: this.steps[step],
        },
      })
    }
  }

  get projectInterface(): Project {
    return formToProjectInterface(this.form)
  }
} 
</script>

<style lang="scss">
@import "../styles/vars";
@import "../styles/theme";

.container {
  width: clamp(calc(800px - 4rem), calc(100% - 4rem), 1440px);
  margin: 0 auto;
  @media (max-width: $breakpoint-m) {
    width: 100%;
    background: $bg-secondary-color;
  }
}

.grid {
  display: grid;
  grid-template-columns: 1fr clamp(250px, 25%, 360px);
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "title cancel"
    "form progress";
  height: calc(100vh - var($nav-header-height));
  gap: 0 2rem;
  @media (max-width: $breakpoint-m) {
    grid-template-rows: auto auto 1fr auto;
    grid-template-columns: 1fr;
    grid-template-areas:
      "progress"
      "title"
      "form"
      "navi";
    gap: 0;
  }
}

.progress-area.desktop {
  grid-area: progress;
  position: relative;

  .progress-container {
    position: sticky;
    top: 5rem;
    align-self: start;
    padding: 1.5rem 1rem; 
    background: $bg-primary-color; 
    border-radius: 16px; 
    /* width: 320px; */
    box-shadow: $box-shadow;

    .progress-steps {
      margin-bottom: 1rem;
    }

    .progress-step {
      display: flex;

      img {
        margin-right: 1rem;
      }
      p {
        margin: 0.5rem 0;
      }
      .step {
        color: #FFF9
      }
      .active {
        color: white;
        font-weight: 600;
        font-size: 1rem;
      }
    }

    .progress-step-checked {
      cursor: pointer;
      &:hover {
        transform: scale(1.02);
      }
    }

    .subtitle {
      font-weight: 500;
      opacity: 0.8;
    }
  }
}

.progress-area.mobile {
  grid-area: progress;
  margin: 2rem 1rem;
  margin-bottom: 0;

  .row {
    margin-top: 1.5rem;

    p {
      margin: 0;
      font-weight: 500;
    }

    .cancel-link {
      font-weight: 500;
    }
  }
}

.title-area {
  grid-area: title;
  display: flex;
  padding: 1rem;
  justify-content: space-between;
  align-items: center;
  .desktop {
    padding-left: 0rem; 
    font-family: 'Glacial Indifference', sans-serif;
    font-weight: 00;
  }
  .mobile {
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
}

.cancel-area {
  grid-area: cancel;
  display: flex;
  justify-content: flex-end;
  align-items: center;

  .cancel-link {
    font-weight: 500;
  }
}

.form-area {
  grid-area: form;
  overflow: scroll;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  height: 100%;
  @media (min-width: $breakpoint-m) {
    padding: 0;
    width: 100%;
  }
}

.nav-area {
  grid-area: navi;
}

.nav-bar {
  display: inherit;
  position: sticky;
  bottom: 0;
  right: 0;
  left: 0;
  padding: 1.5rem;
  background: $bg-primary-color;
  border-radius: 32px 32px  0 0;
  box-shadow: $box-shadow;
}

.layout-steps {
  display: flex;
  justify-content: center;
  align-items: flex-start;

  @media (max-width: $breakpoint-m) {
    display: block;
    margin: 0;
  }
}

.step-title {
  font-size: 1.5rem;
  margin-top: 1rem;
  font-weight: 600;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.application {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 2rem;
  @media (min-width: $breakpoint-m) {
    background: $bg-secondary-color;
    padding: 1.5rem;
    border-radius: 1rem;
    margin-bottom: 4rem;
  }
}

.link {
  font-family: Inter;
  font-size: 16px;
  text-decoration: underline;
}

.cancel-link {
  position: sticky;
  top: 0px;
  color: $error-color;
  text-decoration: underline;
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
  @media (max-width: $breakpoint-m) {
  &:first-of-type {
    margin-top: 0;
  }
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
  &:valid { 
    border: 2px solid $clr-green;
  }
  &:hover { 
    background: $bg-primary-color; 
    border: 2px solid $highlight-color;
    box-shadow: 0px 4px 16px 0px 25,22,35,0.4;
  }
  &:optional {
    border: 2px solid $button-color;
    background-color: $bg-secondary-color;
  }
}

.input.invalid {
  border: 2px solid $error-color; 
}

.input-description {
  margin-top: 0.25rem;
  font-size: 14px;
  font-family: Inter;
  margin-bottom: 0.5rem;
  line-height: 150%;
}

.input-notice {
  margin-top: 0.25rem;
  font-size: 12px;
  font-family: Inter;
  margin-bottom: 0.5rem;
  line-height: 150%;
  color: $warning-color;
  text-transform: uppercase;  
  font-weight: 500;
}

.input-label {
  font-family: Inter;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0em;
  text-align: left;
  margin: 0;
}

.radio-row {
  display: flex;
  flex-wrap: wrap;
  margin-top: 1rem;
  flex-wrap: wrap;
  align-items: center;
  border-radius: 0;
  gap: -1px;
  input {
    display: none;
  }
  input[type="radio"]:checked+label {
    background: $clr-pink;
    font-weight: 600;
  }

}

.radio-btn {
  box-sizing: border-box;
  border: 2px solid $button-color;
  color: white;
  font-size: 16px;
  line-height: 24px;
  align-items: center;
  padding: 0.5rem 1rem;
  margin-left: -1px;
  &:first-of-type {
    border-radius: 16px 0 0 16px;
    margin-left: 0;
  }
  &:last-of-type {
    border-radius: 0 16px 16px 0;
  }
  &:hover {
    opacity: 0.8;
    background: $bg-secondary-color;
    transform: scale(1.04);
    cursor: pointer;
  }
  &:active {
    background: $bg-secondary-color;
  }
}

.loader {
  display: block;
  height: 40px;
  margin: $content-space auto;
  width: 40px;
}

.loader:after {
  content: " ";
  display: block;
  width: 32px;
  height: 32px;
  margin: 4px;
  border-radius: 50%;
  border: 6px solid #fff;
  border-color: #fff transparent #fff transparent;
  animation: loader 1.2s linear infinite;
}

.loader {
    margin: $modal-space auto;
  }

@keyframes loader {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}


.error {
  color: $error-color;
  margin-bottom: 0;
  margin-top: 0.5rem;
  font-size: 14px;
  &:before {
    content: "⚠️ "
  }
}
</style>