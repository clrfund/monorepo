<template>
  <div class="container">
    <div class="grid">
      <div class="progress-area">
        <div class="progress-container">
          <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length" />
          <h3>
            Step {{currentStep + 1}} of {{steps.length}}
          </h3>
          <div v-if="currentStep === 0">
            <h2>About the project</h2>
          </div>
          <button-row
            :isStepValid="isStepValid"
            :steps="steps"
            :currentStep="currentStep"
            class="desktop"
          />
        </div>
      </div>
      <div class="title-area">
        <h1 class="desktop">Your project</h1>
        <div class="your-project mobile">
          Your project
        </div>
      </div>
      <div class="cancel-area desktop">
        <router-link to="/join">
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
                  }">Enter a valid name</p>
                </div>
                <div class="form-background">
                  <label for="project-tagline" class="input-label">Tagline</label>
                  <p class="input-description">Describe your project in a sentence.</p>
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
                  }">Enter a valid tagline</p>
                </div>
                <div class="form-background">
                  <label for="project-description" class="input-label">
                    Description
                    <p class="input-description">Markdown supported.</p>
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
                  }">Enter a valid description</p>
                </div>
                <div class="form-background">
                  <label for="project-category" class="input-label">Category
                    <p class="input-description">Choose the best fit</p>
                  </label>
                  <form class="radio-row">
                    <div>
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
                    </div>
                    <div>
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
                    </div>
                    <div>
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
                    </div>
                    <div>
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
                    </div>
                  </form>
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.category.$error
                  }">Select a category</p>
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
                  }">Enter a valid response</p>
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
                  }">Enter a valid Ethereum address (Ox or ENS)</p>
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
                  }">Enter a valid description of plans</p>
                </div>
              </div>
            </div>
            <div v-if="currentStep === 2">
              <h2 class="step-title">About the team (optional) </h2>
              <div class="inputs">
                <div class="form-background">
                  <label for="team-name" class="input-label">Team name</label>
                  <p class="input-description">If different to project name.</p>
                  <input
                    id="team-name"
                    placeholder="example: clr.fund"
                    v-model="$v.form.team.name.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.team.name.$error
                    }"
                  />
                </div>
                <div class="form-background">
                  <label for="team-desc" class="input-label">Description</label>
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
                </div>
              </div>
            </div>
            <div v-if="currentStep === 4">
              <h2 class="step-title">Images</h2>
              <div class="inputs">
                <div class="form-background">
                  <div class="row">
                    <form id="uploadRadio">
                      <div>
                        <input
                          id="IPFS"
                          type="radio"
                          name="image-requiresUpload"
                          value="false"
                          v-model="$v.form.image.requiresUpload.$model"
                          :class="{
                            input: true,
                            invalid: $v.form.image.requiresUpload.$error
                          }"
                        >
                        <label for="IPFS">IPFS – you have IPFS hashes for your images</label>
                      </div>
                      <div>
                        <input
                          id="upload"
                          type="radio"
                          name="image-requiresUpload"
                          value="true"
                          v-model="$v.form.image.requiresUpload.$model"
                          :class="{
                            input: true,
                            invalid: $v.form.image.requiresUpload.$error
                          }"
                        >
                        <label for="upload">Upload – you'd like to upload from your device</label>
                      </div>
                    </form>
                  </div>
                </div>
                <div class="form-background">
                  <label
                    :for="requiresUpload ? 'image-banner-upload' : 'image-banner-hash'"
                    class="input-label"
                  >Banner image
                    <p class="input-description">Recommended dimensions: 500 x 300</p>
                  </label>
                  <input
                    v-if="requiresUpload"
                    id="image-banner-upload"
                    type="file"
                    class="input"
                  />
                  <input
                    v-if="!requiresUpload"
                    id="image-banner-hash"
                    placeholder="example: ipfs://hash"
                    class="input"
                    v-model="$v.form.image.banner.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.image.banner.$error
                    }"
                  />
                </div>
                <div class="form-background">
                  <label
                    :for="requiresUpload ? 'image-thumbnail-upload' : 'image-thumbnail-hash'"
                    class="input-label"
                  >Thumbnail image
                    <p class="input-description">Recommended dimensions: 80 x 80</p>
                  </label>
                  <input
                    v-if="requiresUpload"
                    id="image-thumbnail-upload"
                    type="file"
                    class="input"
                  />
                  <input
                    v-if="!requiresUpload"
                    id="image-thumbnail-hash"
                    placeholder="example: ipfs://hash"
                    v-model="$v.form.image.thumbnail.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.image.thumbnail.$error
                    }"
                  />
                </div>
              </div>
            </div>
          </form>
          <!-- TODO show summary of information -->
          <!-- Summary -->
          <div v-if="currentStep === 5" id="summary">
            {{form}}
          </div>
        </div>
      </div>
      <div class="nav-area nav-bar mobile">
        <button-row :steps="steps" :currentStep="currentStep" />
        <!-- TODO submit button to trigger tx, pass callback to above <botton-row />?  -->
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Component, { mixins } from 'vue-class-component'
import { validationMixin } from 'vuelidate'
import { required, minLength, maxLength, url } from 'vuelidate/lib/validators'
import * as isIPFS from 'is-ipfs'
import { isAddress } from '@ethersproject/address'

import LayoutSteps from '@/components/LayoutSteps.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import ButtonRow from '@/components/ButtonRow.vue'


interface FormData {
  project: {
    name: string;
    tagline: string;
    description: string;
    category: string;
    problemSpace: string;
  };
  fund: {
    address: string;
    plans: string;
  };
  team: {
    name: string;
    description: string;
  };
  links: {
    github: string;
    radicle: string;
    website: string;
    twitter: string;
    discord: string;
  };
  image: {
    requiresUpload: '' | 'true' | 'false';
    banner: string;
    thumbnail: string;
  };
}

@Component({
  components: {
    LayoutSteps,
    ProgressBar,
    ButtonRow,
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
      },
      links: {
        github: { url },
        radicle: { url },
        website: { url },
        twitter: {},
        discord: { url },
      },
      image: {
        requiresUpload: {},
        banner: {
          required,
          validIpfsHash: isIPFS.cid,
        },
        thumbnail: {
          required,
          validIpfsHash: isIPFS.cid,
        },
      },
    },
  },
})
export default class JoinView extends mixins(validationMixin) {
  form: FormData = {
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
    },
    links: {
      github: '',
      radicle: '',
      website: '',
      twitter: '',
      discord: '',
    },
    image: {
      requiresUpload: 'false',
      banner: '',
      thumbnail: '',
    },
  }
  currentStep: number | null = null
  steps: string[] = []

  created() {
    // const steps = ['one', 'two', 'three', 'four', 'five', 'six']
    const steps = [...Object.keys(this.form), 'summary']
    const currentStep = steps.indexOf(this.$route.params.step)
    this.steps = steps
    this.currentStep = currentStep
    // TODO redirect to /join/one if step doesn't exist
    // How about back to Join landing?
    if (this.currentStep < 0) {
      console.log('NO STEP')
      this.$router.push({ name: 'join' })
    }
  }

  get requiresUpload(): boolean {
    return this.form.image.requiresUpload === 'true'
  }
  get isStepValid(): boolean {
    return !this.form[this.steps[this.currentStep]].$invalid
  }
} 
</script>

<style scoped lang="scss">
@import "../styles/vars";
@import "../styles/theme";

/* .content-heading {
  color: $text-color;
} */

.container {
  width: clamp(calc(800px - 4rem), calc(100% - 4rem), 1440px);
  margin: 0 auto;
  @media (max-width: $breakpoint-m) {
    width: 100%;
  }
}

.grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "title cancel"
    "form progress";
  height: calc(100vh - $nav-header-height);
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

.progress-area {
  grid-area: progress;
  position: relative;
}

.progress-container {
  position: sticky;
  top: 5rem;
  /* left: 0; */
  align-self: start;
  padding: 1rem; 
  background: $bg-secondary-color; 
  border-radius: 8px; 
  @media (max-width: $breakpoint-m) {
    border-radius: 0;
  }
}

.title-area {
  grid-area: title;
  padding: 1rem; 
  /* width: 100%; */
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* margin-top: 4rem; */
}

.cancel-area {
  grid-area: cancel;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.form-area {
  grid-area: form;
  overflow: scroll;
  display: flex;
  flex-direction: column;
  /* justify-content: space-between; */
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
  padding: 1rem;
  background: $bg-primary-color;
}
/* .desktop-title {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4rem;

  @media (max-width: $breakpoint-m) {
      display: none;
    }
} */

.layout-steps {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  /* margin: 0rem 16rem;
  margin-bottom: 8rem; */

  @media (max-width: $breakpoint-m) {
    display: block;
    margin: 0;
  }
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
  /* @media (min-width: $breakpoint-m) {
      display: none;
    } */
}

/* .title {
  margin-left: 16rem;
  padding: 0;
} */

.step-title {
  font-size: 2rem;
  @media (min-width: $breakpoint-m) {
      display: none;
    }
}

.progress {
  @media (min-width: $breakpoint-m) {
      display: none;
    }
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* .btn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  bottom: 0;
}
 */
.application {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
   @media (min-width: $breakpoint-m) {
      background: $bg-secondary-color;
      padding: 1.5rem;
      border-radius: 1rem;
    }


}
/* 
.application-page {
  display: flex;
  padding: 1rem;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  @media (min-width: $breakpoint-m) {
    padding: 0;
    width: 100%;
  }
} */

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
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  height: 3rem;
  input {
    display: none;
  }
  input[type="radio"]:checked+label {
    border: 2px solid $clr-green;
  }

}

.radio-btn {
  box-sizing: border-box;
  border: 2px solid $button-color;
  color: white;
  border-radius: 0.5rem;
  font-size: 16px;
  align-items: center;
  padding: 0.25rem 1.25rem;
  &:hover {
    opacity: 0.8;
    transform: scale(1.01);
    cursor: pointer;
  }
  
}

#uploadRadio {
  input {
    margin-right: 0.5rem;
  }
}

.error {
  color: $error-color;
  margin-bottom: 0;
}
</style>