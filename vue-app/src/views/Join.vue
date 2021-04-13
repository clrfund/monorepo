<template>
<div>
  <div class="desktop-title">
    <h1 class="title" style="padding: 0;">Your project</h1>
    <router-link to="/join">
      <a class="desktop-link">Cancel</a>
    </router-link>
  </div>
  <layout-steps>
  <div class="application-page">
    <div class="application">
      <div class="progress">
      <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length"/>
      <div class="row">
        <h3>
          Step {{currentStep + 1}} of {{steps.length}}
        </h3>
        <router-link to="/join">
          <a class="link">Cancel</a>
        </router-link>
      </div>
      </div>
      <form>
        <div class="your-project">Your project</div>
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
                invisible: !$v.form.project.name.$error
              }">Enter a valid name</p>
            </div>
            <div class="form-background">
              <label for="project-tagline" class="input-label">Tagline</label>
              <p class="input-description">Describe your project in a sentence.</p>
              <input
                id="project-tagline"
                type="text"
                placeholder="example: A quadratic funding protocol"
                v-model="$v.form.project.tagline.$model"
                :class="{
                  input: true,
                  invalid: $v.form.project.tagline.$error
                }"
              />
              <p :class="{
                error: true,
                invisible: !$v.form.project.tagline.$error
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
                invisible: !$v.form.project.description.$error
              }">Enter a valid description</p>
            </div>
            <div class="form-background">
              <label for="project-category" class="input-label">Category</label>
              <select
                id="project-category"
                class="input"
                v-model="$v.form.project.category.$model"
                :class="{
                  input: true,
                  invalid: $v.form.project.category.$error
                }"
              >
                  <option selected disabled label="Choose the best fit" />
                  <option value="content">Content</option>
                  <option value="researcg">Research</option>
                  <option value="tooling">Tooling</option>
                  <option value="data">Data</option>
              </select>
              <p :class="{
                error: true,
                invisible: !$v.form.project.category.$error
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
                invisible: !$v.form.project.problemSpace.$error
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
                invisible: !$v.form.fund.address.$error
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
                invisible: !$v.form.fund.plans.$error
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
                <form>
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
        <div v-if="currentStep === 5">
          <h2 class="step-title">Review</h2>
          <!-- TODO show summary of information -->
          Summary of all data!
        </div>
        <div class="btn-row">
          <router-link v-if="currentStep > 0" :to="{ name: 'joinStep', params: { step: steps[currentStep - 1] }}" class="btn-primary">
            Previous step
          </router-link>
          <router-link v-if="currentStep < 5" :to="{ name: 'joinStep', params: { step: steps[currentStep + 1] }}" class="btn-primary">
            Next step
          </router-link>
          <!-- TODO button to trigger tx  -->
          <router-link v-if="currentStep == 5" to="/project-added" class="btn-primary">
            Finish
          </router-link>
        </div>
      </form>
      </div>
  </div>

  <div class="progress-block">
        <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length"/>
        <h3>
          Step {{currentStep + 1}} of {{steps.length}}
        </h3>
          <div v-if="currentStep === 0">
          <h2>About the project</h2>
          </div>
          <div class="btn-row">
          <router-link v-if="currentStep > 0" :to="{ name: 'joinStep', params: { step: steps[currentStep - 1] }}" class="btn-primary">
            Previous step
          </router-link>
          <router-link v-if="currentStep < 5" :to="{ name: 'joinStep', params: { step: steps[currentStep + 1] }}" class="btn-primary">
            Next step
          </router-link>
          <!-- TODO button to trigger tx  -->
          <router-link v-if="currentStep == 5" to="/project-added" class="btn-primary">
            Finish
          </router-link>
        </div>
  </div>
  </layout-steps>
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
    const steps = ['one', 'two', 'three', 'four', 'five', 'six']
    const currentStep = steps.indexOf(this.$route.params.step)
    this.steps = steps
    this.currentStep = currentStep
    // TODO redirect to /join/one if step doesn't exist
    // if (currentStep < 0) {
    //   console.log('NO STEP')
    //   this.$router.push({ name: 'apply', params: 'one' })
    //   return
    // }
  }


  get requiresUpload(): boolean {
    return this.form.image.requiresUpload === 'true'
  }    
} 
</script>

<style scoped lang="scss">
@import "../styles/vars";
@import "../styles/theme";

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
  @media (min-width: $breakpoint-m) {
      display: none;
    }
}

.title {
  margin-left: 16rem;
  padding: 0;
}

.desktop-title {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4rem;

  @media (max-width: $breakpoint-m) {
      display: none;
    }
}

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
   @media (min-width: $breakpoint-m) {
      background: $bg-secondary-color;
      padding: 1.5rem;
      border-radius: 1rem;
    }


}

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
/* .input-error {
  display: none;
  &:invalid {
    display: block;
  }
} */

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

.error {
  color: $error-color;
  margin: 0.5rem 0 -1rem;
}

.progress-block {
  margin-left: 1.5rem; 
  background: $bg-secondary-color; 
  border-radius: 8px; 
  padding: 1rem; 
  height: 100%;
  width: 33%;
}

.desktop-link {
  margin-right: 16rem;
}
</style>