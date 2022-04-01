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
        cancelRedirectUrl="/join"
      />
      <div class="title-area">
        <h1>Join the round</h1>
      </div>
      <div class="cancel-area desktop">
        <links class="cancel-link" to="/join"> Cancel </links>
      </div>
      <loader v-if="loading" />
      <div v-if="!loading" class="form-area">
        <div class="application">
          <div v-if="currentStep === 0">
            <metadata-list
              :onClick="handleMetadataSelected"
              :excludeRecipients="true"
            ></metadata-list>
          </div>
          <div v-if="currentStep === 1" id="summary">
            <metadata-viewer :metadata="metadata"></metadata-viewer>
          </div>
          <div v-if="currentStep === 2">
            <h2 class="step-title">Submit project</h2>
            <p>
              This is a blockchain transaction that will add your project
              information to the funding round.
            </p>
            <div class="inputs">
              <recipient-submission-widget
                cta="Submit project"
                pending="Sending deposit..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!loading" class="mobile nav-bar">
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
import Vue from 'vue'
import Component from 'vue-class-component'
import LayoutSteps from '@/components/LayoutSteps.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import FormNavigation from '@/components/FormNavigation.vue'
import FormProgressWidget from '@/components/FormProgressWidget.vue'
import RecipientSubmissionWidget from '@/components/RecipientSubmissionWidget.vue'
import MetadataList from '@/views/MetadataList.vue'
import MetadataViewer from '@/views/MetadataViewer.vue'
import Links from '@/components/Links.vue'
import Loader from '@/components/Loader.vue'

import { SET_RECIPIENT_DATA } from '@/store/mutation-types'

import { Project } from '@/api/projects'
import { Metadata } from '@/api/metadata'

@Component({
  components: {
    LayoutSteps,
    ProgressBar,
    FormNavigation,
    FormProgressWidget,
    RecipientSubmissionWidget,
    MetadataList,
    MetadataViewer,
    Links,
    Loader,
  },
})
export default class JoinView extends Vue {
  currentStep = 0
  steps = ['metadata', 'summary', 'submit']
  stepNames = ['Select a project metadata', 'Review', 'Submit']
  metadata = new Metadata({})
  loading = true

  async created() {
    const currentStep = this.steps.indexOf(this.$route.params.step)
    this.currentStep = currentStep

    // redirect to /join/ if step doesn't exist
    if (this.currentStep < 0) {
      this.$router.push({ name: 'join' })
    }

    await this.loadMetadata()
    this.loading = false

    // "Next" button restricts forward navigation via validation, and
    // eventually updates the `furthestStep` tracker when valid and clicked/tapped.
    // If URL step is ahead of furthest, navigate back to furthest
    if (this.currentStep > this.furthestStep) {
      this.$router.push({
        name: 'join-step',
        params: { step: this.steps[this.furthestStep] },
      })
    }
  }

  isStepValid(step: number): boolean {
    return this.steps[step] === 'metadata'
      ? this.hasMetadata
      : this.hasMetadata && this.isMetadataValid
  }

  isStepUnlocked(step: number): boolean {
    return step <= this.furthestStep
  }

  saveFormData(): void {
    this.$store.commit(SET_RECIPIENT_DATA, {
      updatedData: this.metadata.toProject(),
    })
  }

  get isNavDisabled(): boolean {
    return (
      !this.isStepValid(this.currentStep) &&
      this.currentStep !== this.furthestStep
    )
  }

  get hasMetadata(): boolean {
    return !!this.metadata.id
  }

  get isMetadataValid(): boolean {
    // TODO validate metadata
    return true
  }

  get furthestStep(): number {
    let furthest = 0
    if (this.hasMetadata) {
      furthest++
      if (this.isMetadataValid) {
        furthest++
      }
    }
    return furthest
  }

  handleMetadataSelected(metadata: Metadata): void {
    this.metadata = metadata
    const id = this.metadata.id || ''
    this.$router.push({
      name: 'join-step',
      params: { step: 'summary', id },
    })
  }

  handleStepNav(step): void {
    // If isNavDisabled => disable quick-links
    if (this.isNavDisabled) return
    // Save form data
    this.saveFormData()
    // Navigate
    if (this.isStepUnlocked(step)) {
      const id = this.metadata.id || ''
      this.$router.push({
        name: 'join-step',
        params: {
          step: this.steps[step],
          id,
        },
      })
    }
  }

  async loadMetadata(): Promise<void> {
    const id = this.$route.params.id

    if (id) {
      try {
        const metadata = await Metadata.get(id)
        if (metadata) {
          this.metadata = metadata
          this.saveFormData()
        }
      } catch (err) {
        // TODO display the error
      }
    }
  }

  get projectInterface(): Project {
    return this.metadata.toProject()
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

.nav-bar {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  padding: 1.5rem;
  background: $bg-primary-color;
  box-shadow: $box-shadow;
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

.cancel-link {
  position: sticky;
  top: 0px;
  color: $error-color;
  text-decoration: underline;
}

.inputs {
  margin: 1.5rem 0;
}
</style>
