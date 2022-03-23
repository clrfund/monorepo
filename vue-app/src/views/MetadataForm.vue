<template>
  <div class="container">
    <div class="grid">
      <form-progress-widget
        :currentStep="currentStep"
        :furthestStep="furthestStep"
        :steps="steps"
        :stepNames="stepNames"
        :isNavDisabled="isNavDisabled"
        :isStepUnlocked="isStepUnlocked"
        :isStepValid="isStepValid"
        :handleStepNav="handleStepNav"
        :saveFormData="saveFormData"
        :cancelRedirectUrl="cancelUrl"
      />
      <div class="title-area">
        <h1>Metadata</h1>
      </div>
      <div class="cancel-area desktop">
        <links class="cancel-link" :to="cancelUrl"> Cancel </links>
      </div>
      <loader v-if="loading" />
      <div v-if="!loading" class="form-area">
        <div class="application">
          <div v-if="currentStep === 0">
            <h2 class="step-title">About the project</h2>
            <div class="inputs">
              <div class="form-background">
                <label for="project-name" class="input-label"
                  >Project name</label
                >
                <input
                  id="project-name"
                  type="text"
                  placeholder="ex: clr.fund"
                  v-model="$v.form.project.name.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.project.name.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !$v.form.project.name.$error,
                  }"
                >
                  Your project needs a name
                </p>
              </div>
              <div class="form-background">
                <label for="project-tagline" class="input-label">Tagline</label>
                <p class="input-description">
                  Describe your project in a sentence. Max characters: 140
                </p>
                <textarea
                  id="project-tagline"
                  placeholder="ex: A quadratic funding protocol"
                  v-model="$v.form.project.tagline.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.project.tagline.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden:
                      !$v.form.project.tagline.$error ||
                      $v.form.project.tagline.maxLength,
                  }"
                >
                  This tagline is too long. Be brief for potential contributors
                </p>
                <p
                  :class="{
                    error: true,
                    hidden:
                      !$v.form.project.tagline.$error ||
                      !$v.form.project.tagline.maxLength,
                  }"
                >
                  Your project needs a tagline
                </p>
              </div>
              <div class="form-background">
                <label for="project-description" class="input-label">
                  Description
                  <p class="input-description">Markdown supported.</p>
                </label>
                <textarea
                  id="project-description"
                  placeholder="ex: CLR.fund is a quadratic funding protocol that aims to make it as easy as possible to set up, manage, and participate in quadratic funding rounds..."
                  v-model="$v.form.project.description.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.project.description.$error,
                  }"
                />
                <p v-if="form.project.description" class="input-label pt-1">
                  Preview:
                </p>
                <markdown :raw="form.project.description" />
                <p
                  :class="{
                    error: true,
                    hidden: !$v.form.project.description.$error,
                  }"
                >
                  Your project needs a description. What are you raising money
                  for?
                </p>
              </div>
              <div class="form-background">
                <label for="project-category" class="input-label"
                  >Category
                  <p class="input-description">Choose the best fit.</p>
                </label>
                <form class="radio-row" id="category-radio">
                  <input
                    id="category-content"
                    type="radio"
                    name="project-category"
                    value="Content"
                    v-model="$v.form.project.category.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.project.category.$error,
                    }"
                  />
                  <label for="category-content" class="radio-btn"
                    >Content</label
                  >
                  <input
                    id="research"
                    type="radio"
                    name="project-category"
                    value="Research"
                    v-model="$v.form.project.category.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.project.category.$error,
                    }"
                  />
                  <label for="research" class="radio-btn">Research</label>
                  <input
                    id="tooling"
                    type="radio"
                    name="project-category"
                    value="Tooling"
                    v-model="$v.form.project.category.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.project.category.$error,
                    }"
                  />
                  <label for="tooling" class="radio-btn">Tooling</label>
                  <input
                    id="data"
                    type="radio"
                    name="project-category"
                    value="Data"
                    v-model="$v.form.project.category.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.project.category.$error,
                    }"
                  />
                  <label for="data" class="radio-btn">Data</label>
                </form>
                <p
                  :class="{
                    error: true,
                    hidden: !$v.form.project.category.$error,
                  }"
                >
                  You need to choose a category
                </p>
              </div>
              <div class="form-background">
                <label for="project-problem-space" class="input-label"
                  >Problem space</label
                >
                <p class="input-description">
                  Explain the problems you're trying to solve. Markdown
                  supported.
                </p>
                <textarea
                  id="project-problem-space"
                  placeholder="ex: there is no way to spin up a quadratic funding round. Right now, you have to collaborate with GitCoin Grants which isn’t a scalable or sustainable model."
                  v-model="$v.form.project.problemSpace.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.project.problemSpace.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !$v.form.project.problemSpace.$error,
                  }"
                >
                  Explain the problem your project solves
                </p>
                <p v-if="form.project.description" class="input-label pt-1">
                  Preview:
                </p>
                <markdown :raw="form.project.problemSpace" />
              </div>
            </div>
          </div>
          <div v-if="currentStep === 1">
            <h2 class="step-title">Donation details</h2>
            <div class="inputs">
              <div class="form-background">
                <label for="fund-address" class="input-label"
                  >Ethereum address</label
                >
                <p class="input-description">
                  The destination address for donations, which you'll use to
                  claim funds. This doesn't have to be the same address as the
                  one you use to send your metadata transaction.
                </p>
                <div
                  v-for="(address, index) in form.fund.receivingAddresses"
                  :key="index"
                >
                  <div key="index" class="address-container">
                    <img
                      src="@/assets/remove.svg"
                      alt="remove"
                      class="remove-icon"
                      @click="removeAddress(index)"
                    />
                    <span class="input-description">
                      {{ address }}
                    </span>
                  </div>
                </div>
                <div class="input-row">
                  <dropdown
                    :options="sortedNetworks"
                    :selected="selectedNetwork"
                    @change="handleDropdownClick"
                  />
                  <input
                    id="fund-address"
                    placeholder="address, ex: 0x123456789..."
                    v-model.lazy="$v.addressName.$model"
                    @focus="$v.addressName.$reset"
                    :class="{
                      input: true,
                      invalid: $v.addressName.$error,
                    }"
                  />
                  <button
                    @click="
                      addAddress({
                        network: selectedNetwork,
                        address: addressName,
                      })
                    "
                    class="btn-secondary"
                    :disabled="$v.addressName.$invalid || !selectedNetwork"
                  >
                    Add
                  </button>
                </div>
                <p
                  :class="{
                    error: true,
                    hidden: !$v.addressName.$error,
                  }"
                >
                  Enter a valid Ethereum 0x address
                </p>
                <!-- TODO: only validate after user removes focus on input -->
              </div>
              <div class="form-background">
                <label for="fund-plans" class="input-label"
                  >How will you spend your funding?</label
                >
                <p class="input-description">
                  Potential contributors might convert based on your specific
                  funding plans. Markdown supported.
                </p>
                <textarea
                  id="fund-plans"
                  placeholder="ex: on our roadmap..."
                  v-model="$v.form.fund.plans.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.fund.plans.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !$v.form.fund.plans.$error,
                  }"
                >
                  Let potential contributors know what plans you have for their
                  donations.
                </p>
                <p v-if="form.fund.plans" class="input-label pt-1">Preview:</p>
                <markdown :raw="form.fund.plans" />
              </div>
            </div>
          </div>
          <div v-if="currentStep === 2">
            <h2 class="step-title">Team details</h2>
            <p>Tell us about the folks behind your project.</p>
            <div class="inputs">
              <div v-if="isEmailRequired" class="form-background">
                <label for="team-email" class="input-label">
                  Contact email
                </label>
                <p class="input-description">
                  For important updates about your project and the funding
                  round.
                </p>
                <input
                  id="team-email"
                  placeholder="example: doge@goodboi.com"
                  v-model.lazy="$v.form.team.email.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.team.email.$error,
                  }"
                />
                <p class="input-notice">
                  We won't display this publicly or add it to the on-chain
                  registry.
                </p>
                <p
                  :class="{
                    error: true,
                    hidden: !$v.form.team.email.$error,
                  }"
                >
                  This doesn't look like an email.
                </p>
              </div>
              <div class="form-background">
                <label for="team-name" class="input-label"
                  >Team name (optional)</label
                >
                <p class="input-description">If different to project name.</p>
                <input
                  id="team-name"
                  type="email"
                  placeholder="ex: clr.fund"
                  v-model="$v.form.team.name.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.team.name.$error,
                  }"
                />
              </div>
              <div class="form-background">
                <label for="team-desc" class="input-label"
                  >Team description (optional)</label
                >
                <p class="input-description">
                  If different to project description. Markdown supported.
                </p>
                <textarea
                  id="team-desc"
                  placeholder="ex: CLR.fund is a quadratic funding protocol that aims to make it as easy as possible to set up, manage, and participate in quadratic funding rounds..."
                  v-model="$v.form.team.description.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.team.description.$error,
                  }"
                />
                <p v-if="form.team.description" class="input-label pt-1">
                  Preview:
                </p>
                <markdown :raw="form.team.description" />
              </div>
            </div>
          </div>
          <div v-if="currentStep === 3">
            <h2 class="step-title">Links</h2>
            <p>
              Give contributors some links to check out to learn more about your
              project. Provide at least one.
            </p>
            <div class="inputs">
              <div class="form-background">
                <label for="links-github" class="input-label">GitHub</label>
                <input
                  id="links-github"
                  type="link"
                  placeholder="example: https://github.com/ethereum/clrfund"
                  v-model.lazy="$v.form.links.github.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.links.github.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !$v.form.links.github.$error,
                  }"
                >
                  This doesn't look like a valid URL
                </p>
                <!-- TODO: only validate after user removes focus on input -->
              </div>
              <div class="form-background">
                <label for="links-radicle" class="input-label">Radicle</label>
                <input
                  id="links-radicle"
                  type="link"
                  placeholder="example: https://radicle.xyz/ethereum/clrfund"
                  v-model.lazy="$v.form.links.radicle.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.links.radicle.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !$v.form.links.radicle.$error,
                  }"
                >
                  This doesn't look like a valid URL
                </p>
              </div>
              <div class="form-background">
                <label for="links-website" class="input-label">Website</label>
                <input
                  id="links-website"
                  type="link"
                  placeholder="example: https://clr.fund"
                  v-model.lazy="$v.form.links.website.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.links.website.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !$v.form.links.website.$error,
                  }"
                >
                  This doesn't look like a valid URL
                </p>
              </div>
              <div class="form-background">
                <label for="links-twitter" class="input-label">Twitter</label>
                <input
                  id="links-twitter"
                  type="link"
                  placeholder="example: https://twitter.com/ethereum"
                  v-model.lazy="$v.form.links.twitter.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.links.twitter.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !$v.form.links.twitter.$error,
                  }"
                >
                  This doesn't look like a valid URL
                </p>
              </div>
              <div class="form-background">
                <label for="links-discord" class="input-label">Discord</label>
                <input
                  id="links-discord"
                  type="link"
                  placeholder="ex: https://discord.gg/5Prub9zbGz"
                  class="input"
                  v-model.lazy="$v.form.links.discord.$model"
                  :class="{
                    input: true,
                    invalid: $v.form.links.discord.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !$v.form.links.discord.$error,
                  }"
                >
                  This doesn't look like a valid URL
                </p>
              </div>
            </div>
          </div>
          <div v-if="currentStep === 4">
            <h2 class="step-title">Images</h2>
            <p>
              Uploaded images will be stored on IPFS, a decentralized storage
              platform.
              <links to="https://ipfs.io/#how">More on IPFS</links>
            </p>
            <div class="inputs">
              <div class="form-background">
                <ipfs-image-upload
                  label="Banner image"
                  description="Recommended aspect ratio: 16x9 • Max file size: 512kB • JPG, PNG, or GIF"
                  :onUpload="handleUpload"
                  formProp="bannerHash"
                  :hash="form.image.bannerHash"
                />
              </div>
              <div class="form-background">
                <ipfs-image-upload
                  label="Thumbnail image"
                  description="Recommended aspect ratio: 1x1 (square) • Max file size: 512kB • JPG, PNG, or GIF"
                  :onUpload="handleUpload"
                  formProp="thumbnailHash"
                  :hash="form.image.thumbnailHash"
                />
              </div>
            </div>
          </div>
          <div v-if="currentStep === 5" id="summary">
            <project-profile
              v-if="showSummaryPreview"
              :project="projectInterface"
              :previewMode="true"
              class="project-details"
            />
            <div v-if="!showSummaryPreview">
              <metadata-viewer
                :metadata="metadataInterface"
                displayDeleteBtn="false"
              ></metadata-viewer>
            </div>
          </div>
          <div v-if="currentStep === 6">
            <h2 class="step-title">Submit metadata</h2>
            <p>
              This is a transaction that will add your project metadata to the
              blockchain.
            </p>
            <div class="inputs">
              <metadata-submission-widget
                :metadata="metadataInterface"
                :onSuccess="onSuccess"
                :onSubmit="onSubmit"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mobile nav-bar">
      <form-navigation
        :isStepValid="isStepValid(currentStep)"
        :steps="steps"
        :finalStep="steps.length - 2"
        :currentStep="currentStep"
        :callback="saveFormData"
        :handleStepNav="handleStepNav"
        :isNavDisabled="isNavDisabled"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Component, { mixins } from 'vue-class-component'
import { validationMixin } from 'vuelidate'
import {
  required,
  minLength,
  maxLength,
  url,
  email,
} from 'vuelidate/lib/validators'
import * as isIPFS from 'is-ipfs'
import { isAddress } from '@ethersproject/address'
import LayoutSteps from '@/components/LayoutSteps.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import FormNavigation from '@/components/FormNavigation.vue'
import FormProgressWidget from '@/components/FormProgressWidget.vue'
import IpfsImageUpload from '@/components/IpfsImageUpload.vue'
import IpfsCopyWidget from '@/components/IpfsCopyWidget.vue'
import Loader from '@/components/Loader.vue'
import Markdown from '@/components/Markdown.vue'
import ProjectProfile from '@/components/ProjectProfile.vue'
import MetadataSubmissionWidget from '@/components/MetadataSubmissionWidget.vue'
import Warning from '@/components/Warning.vue'
import Links from '@/components/Links.vue'
import MetadataList from '@/views/MetadataList.vue'
import MetadataViewer from '@/views/MetadataViewer.vue'
import Dropdown from '@/components/Dropdown.vue'
import { Metadata } from '@/api/metadata'
import { Prop } from 'vue-property-decorator'

import { SET_METADATA } from '@/store/mutation-types'
import {
  RecipientApplicationData,
  formToProjectInterface,
} from '@/api/recipient'
import { Project } from '@/api/projects'
import { CHAIN_INFO } from '@/plugins/Web3/constants/chains'
import { ContractReceipt, ContractTransaction } from 'ethers'

type RecievingAddress = {
  network: string
  address: string
}

@Component({
  components: {
    LayoutSteps,
    ProgressBar,
    FormNavigation,
    FormProgressWidget,
    IpfsImageUpload,
    IpfsCopyWidget,
    Loader,
    Markdown,
    Dropdown,
    ProjectProfile,
    MetadataSubmissionWidget,
    Warning,
    Links,
    MetadataList,
    MetadataViewer,
  },
  validations: {
    addressName: { required, validEthAddress: isAddress },
    form: {
      project: {
        name: { required },
        tagline: {
          required,
          maxLength: maxLength(140),
        },
        description: { required },
        category: { required },
        problemSpace: { required },
      },
      fund: {
        receivingAddresses: {
          required,
          minLength: minLength(1),
        },
        resolvedAddress: {},
        plans: { required },
      },
      team: {
        name: {},
        description: {},
        email: {
          email,
          required: process.env.VUE_APP_GOOGLE_SPREADSHEET_ID
            ? required
            : () => true,
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
export default class MetadataForm extends mixins(validationMixin) {
  @Prop() loadFormData!: () => Promise<void>
  @Prop() cancelUrl!: string
  @Prop() gotoStep!: (step: string) => void
  @Prop() onSuccess!: (receipt: ContractReceipt) => void
  @Prop() onSubmit!: (
    metadata: Metadata,
    provider: any
  ) => Promise<ContractTransaction>

  form: RecipientApplicationData = new Metadata({}).toFormData()
  addressName = ''
  currentStep = 0
  steps: string[] = []
  stepNames: string[] = []
  showSummaryPreview = false
  loading = true
  networks: string[] = []
  selectedNetwork = ''

  async created() {
    const steps = [
      'project',
      'fund',
      'team',
      'links',
      'image',
      'summary',
      'submit',
    ]
    const stepNames = [
      'About the project',
      'Donation details',
      'Team details',
      'Links',
      'Images',
      'Review',
      'Submit',
    ]
    const currentStep = steps.indexOf(this.$route.params.step)
    this.steps = steps
    this.stepNames = stepNames
    this.currentStep = currentStep
    await this.loadFormData()
    this.form = this.$store.state.metadata
    this.loading = false
    this.loadNetworks()

    // go to first step if step doesn't exist
    if (this.currentStep < 0) {
      this.currentStep = 0
    }
    // "Next" button restricts forward navigation via validation, and
    // eventually updates the `furthestStep` tracker when valid and clicked/tapped.
    // If URL step is ahead of furthest, navigate back to furthest
    if (this.currentStep > this.form.furthestStep) {
      this.gotoStep(this.steps[this.form.furthestStep])
    }
  }

  get isEmailRequired(): boolean {
    return !!process.env.VUE_APP_GOOGLE_SPREADSHEET_ID
  }

  get sortedNetworks(): string[] {
    return this.networks.sort()
  }

  handleDropdownClick(selection: string): void {
    this.selectedNetwork = selection
  }

  addAddress({ network, address }: RecievingAddress): void {
    this.$v.addressName.$touch()

    if (!this.$v.addressName.$invalid && this.selectedNetwork) {
      this.form.fund.receivingAddresses.push(`${network}:${address}`)
      this.networks = this.networks.filter((net) => net !== network)
      this.selectedNetwork = this.networks[0]
    }
  }

  loadNetworks(): void {
    const exclusion = new Set(
      this.form.fund.receivingAddresses.map((addr) => {
        const [network] = addr.split(':')
        return network
      })
    )
    // filter out the networks already in the receiving list
    this.networks = Object.values(CHAIN_INFO)
      .map(({ shortName }) => shortName)
      .filter((name) => {
        return !exclusion.has(name)
      })
    this.selectedNetwork = this.networks[0] || ''
  }

  removeAddress(index): void {
    this.form.fund.receivingAddresses.splice(index, 1)
    this.loadNetworks()
  }

  handleToggleTab(event): void {
    const { id } = event.target
    // Guard clause:
    if (
      (!this.showSummaryPreview && id === 'review') ||
      (this.showSummaryPreview && id === 'preview')
    )
      return
    this.showSummaryPreview = !this.showSummaryPreview
  }

  // Check that at least one link is not empty && no links are invalid
  isLinkStepValid(): boolean {
    let isValid = false
    const links = Object.keys(this.form.links)
    for (const link of links) {
      const linkData = this.$v.form.links?.[link]
      if (!linkData) return false
      const isInvalid = linkData.$invalid
      const isEmpty = linkData.$model.length === 0
      if (isInvalid) {
        return false
      } else if (!isEmpty) {
        isValid = true
      }
    }
    return isValid
  }

  isStepValid(step: number): boolean {
    if (step === 4) {
      return this.isLinkStepValid()
    }
    const stepName: string = this.steps[step]
    return !this.$v.form[stepName]?.$invalid
  }

  isStepUnlocked(step: number): boolean {
    return step <= this.form.furthestStep
  }

  saveFormData(updateFurthest?: boolean): void {
    if (updateFurthest && this.currentStep + 1 > this.form.furthestStep) {
      this.form.furthestStep = this.currentStep + 1
    }
    if (typeof this.currentStep !== 'number') return
    this.$store.commit(SET_METADATA, {
      updatedData: this.form,
      step: this.steps[this.currentStep],
      stepNumber: this.currentStep,
    })
  }

  // Callback from IpfsImageUpload component
  handleUpload(key, value) {
    this.form.image[key] = value
    this.saveFormData(false)
  }

  get isNavDisabled(): boolean {
    return (
      !this.isStepValid(this.currentStep) &&
      this.currentStep !== this.furthestStep
    )
  }

  handleStepNav(step): void {
    // If isNavDisabled => disable quick-links
    if (this.isNavDisabled) return
    // Save form data
    this.saveFormData()
    // Navigate
    if (this.isStepUnlocked(step)) {
      this.gotoStep(this.steps[step])
    }
  }

  get metadataInterface(): Metadata {
    console.log('metadataInterface', this.form)
    return Metadata.fromFormData(this.form)
  }

  get projectInterface(): Project {
    return formToProjectInterface(this.form)
  }

  get furthestStep() {
    return this.form.furthestStep
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
  width: clamp(calc(800px - 4rem), calc(100% - 4rem), 1100px);
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
    'title cancel'
    'form progress';
  height: calc(100vh - var($nav-header-height));
  gap: 0 2rem;
  @media (max-width: $breakpoint-m) {
    grid-template-rows: auto auto 1fr auto;
    grid-template-columns: 1fr;
    grid-template-areas:
      'progress'
      'title'
      'form';
    gap: 0;
  }
}

.input-row {
  display: grid;
  grid-template-columns: 130px 2fr auto;
  column-gap: 10px;
  & > * {
    margin: 8px 0;
  }

  @media (max-width: $breakpoint-m) {
    grid-template-columns: 1fr;
  }
}

.title-area {
  grid-area: title;
  display: flex;
  padding: 1rem;
  padding-left: 0rem;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;

  h1 {
    font-family: 'Glacial Indifference', sans-serif;
  }

  @media (max-width: $breakpoint-m) {
    margin-top: 6rem;
    padding-bottom: 0;
    padding-left: 1rem;
    font-size: 14px;
    font-weight: normal;
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
  overflow: auto;
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

.form-title-area {
  display: flex;
  justify-content: space-between;
}

.nav-bar {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  padding: 1.5rem;
  background: $bg-primary-color;
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
  &:first-of-type {
    margin-top: 0;
  }
}

.application {
  /* height: 100%; */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 2rem;
  overflow: none;
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

.address-container {
  display: flex;
  align-items: center;

  .input-description {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.remove-icon {
  width: 1.5rem;
  height: 1.5rem;
  cursor: pointer;
  margin: 0.5rem;
  &:hover {
    opacity: 0.8;
    transform: scale(1.02);
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
    box-shadow: 0px 4px 16px 0px 25, 22, 35, 0.4;
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
  margin-top: 1rem;
  box-sizing: border-box;
  border: 2px solid $button-color;
  border-radius: 1rem;
  overflow: hidden;
  width: fit-content;
  input {
    position: fixed;
    opacity: 0;
    pointer-events: none;
  }
  input[type='radio']:checked + label {
    background: $clr-pink;
    font-weight: 600;
  }
  @media (max-width: $breakpoint-m) {
    width: 100%;
    flex-direction: column;
    text-align: center;
  }
}

.radio-btn {
  box-sizing: border-box;
  color: white;
  font-size: 16px;
  line-height: 24px;
  align-items: center;
  padding: 0.5rem 1rem;
  margin-left: -1px;

  border-right: 2px solid $button-color;
  border-bottom: none;
  @media (max-width: $breakpoint-m) {
    border-right: none;
    border-bottom: 2px solid $button-color;
  }
  &:last-of-type {
    border-right: none;
    border-bottom: none;
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
  content: ' ';
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

.read-only-title {
  line-height: 150%;
  margin: 0;
}

.project-details {
  &:last-child {
    margin-bottom: 0;
  }
}

.summary {
  margin-bottom: 1rem;
}

.summary-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid $highlight-color;
  padding-bottom: 0.5rem;
}

.toggle-tabs-desktop {
  display: flex;
  gap: 2rem;
  font-family: 'Inter';
  @media (max-width: $breakpoint-m) {
    /* flex-direction: column;
    gap: 0;
    margin-left: 0rem; */
    /* display: none; */
  }
  .active-tab {
    padding-bottom: 0.5rem;
    border-bottom: 4px solid $clr-green;
    border-radius: 4px;
    font-weight: 600;
    /* text-decoration: underline; */
  }
  .inactive-tab {
    padding-bottom: 0.5rem;
    cursor: pointer;
    &:hover {
      opacity: 0.8;
      border-bottom: 4px solid #fff7;
      border-radius: 4px;
    }
    /* text-decoration: underline; */
  }
}

.toggle-tabs-mobile {
  display: flex;
  gap: 2rem;
  @media (min-width: $breakpoint-m) {
    /* flex-direction: column;
    gap: 0;
    margin-left: 0rem; */
    display: none;
  }
  .active-tab {
    padding-bottom: 0.5rem;
    border-bottom: 4px solid $clr-green;
    border-radius: 4px;
    font-weight: 600;
    /* text-decoration: underline; */
  }
  .inactive-tab {
    padding-bottom: 0.5rem;
    cursor: pointer;
    &:hover {
      opacity: 0.8;
      transform: scale(1.02);
    }
    /* text-decoration: underline; */
  }
}

.step-subtitle {
  margin: 0.5rem 0;
  font-family: 'Glacial Indifference', sans-serif;
  font-size: 1.5rem;
}

.edit-button {
  font-family: 'Inter';
  font-weight: 500;
  font-size: 16px;
  color: $clr-green;
}

.data {
  opacity: 0.8;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.data img {
  padding: 0.25rem;
  margin-top: 0.25rem;
  &:hover {
    background: $bg-primary-color;
    border-radius: 4px;
  }
}

.pt-1 {
  padding-top: 1rem;
}

.tx-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0.5rem 0;
  font-weight: 500;
}

.tx-row-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0.5rem 0;
  font-weight: 600;
  font-size: 20px;
  font-family: 'Glacial Indifference', sans-serif;
  background: $bg-secondary-color;
  border-radius: 1rem;
  padding: 1rem;
  margin-top: 1.5rem;
}

.tx-item {
  font-size: 14px;
  font-family: Inter;
  line-height: 150%;
  text-transform: uppercase;
  font-weight: 500;
}

.fiat-value {
  font-weight: 400;
  opacity: 0.8;
}

.tx-progress-area {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.checkout {
  margin-bottom: 1rem;
}

.checkout-desktop {
  padding-top: 1.5rem;
  border-top: 1px solid $button-color;
}

.tx-notice {
  margin-top: 0.25rem;
  font-size: 12px;
  font-family: Inter;
  margin-bottom: 0.5rem;
  line-height: 150%;
  text-transform: uppercase;
  font-weight: 500;
}

.break-all {
  @media (max-width: $breakpoint-s) {
    display: block;
  }

  p {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.no-break {
  white-space: nowrap;
}

.resolved-address {
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.5;
  word-break: keep-all;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
