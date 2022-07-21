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
          <div v-if="steps[currentStep] === 'summary'" id="summary">
            <metadata-viewer :metadata="metadata"></metadata-viewer>
          </div>
          <div v-if="steps[currentStep] === 'email'">
            <div class="inputs">
              <div class="heading">
                <h2>Contact email</h2>
              </div>
              <p class="input-description">
                For important updates about your project and the funding round.
              </p>
              <input
                id="team-email"
                type="email"
                placeholder="example: doge@goodboi.com"
                v-model.lazy="$v.email.$model"
                :class="{
                  input: true,
                  invalid: $v.email.$error,
                }"
              />
              <p class="input-notice">
                We won't display this publicly or add it to the on-chain
                registry.
              </p>
              <p
                :class="{
                  error: true,
                  hidden: !$v.email.$error,
                }"
              >
                This doesn't look like an email.
              </p>
            </div>
          </div>
          <div v-if="steps[currentStep] === 'submit'">
            <h2 class="step-title">Submit project</h2>
            <p>
              This is a blockchain transaction that will add your project
              information to the funding round.
            </p>
            <div class="inputs">
              <recipient-submission-widget
                :isWaiting="isWaiting"
                :txHash="txHash"
                :txError="txError"
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
        :finalStep="steps.length - 1"
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
import LayoutSteps from '@/components/LayoutSteps.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import FormNavigation from '@/components/FormNavigation.vue'
import FormProgressWidget from '@/components/FormProgressWidget.vue'
import RecipientSubmissionWidget from '@/components/RecipientSubmissionWidget.vue'
import MetadataList from '@/views/MetadataList.vue'
import MetadataViewer from '@/views/MetadataViewer.vue'
import Links from '@/components/Links.vue'
import Loader from '@/components/Loader.vue'

import {
  SET_RECIPIENT_DATA,
  RESET_RECIPIENT_DATA,
} from '@/store/mutation-types'

import { Project } from '@/api/projects'
import { Metadata, MetadataValidations } from '@/api/metadata'
import { DateTime } from 'luxon'
import { addRecipient } from '@/api/recipient-registry-optimistic'
import { waitForTransaction } from '@/utils/contracts'
import { required, email } from 'vuelidate/lib/validators'

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
  validations: {
    metadata: MetadataValidations,
    email: {
      email,
      required: process.env.VUE_APP_GOOGLE_SPREADSHEET_ID
        ? required
        : () => true,
    },
  },
})
export default class JoinView extends mixins(validationMixin) {
  currentStep = 0
  steps = this.isEmailRequired
    ? ['project', 'summary', 'email', 'submit']
    : ['project', 'summary', 'submit']
  stepNames = this.isEmailRequired
    ? ['Select a project metadata', 'Review', 'Email', 'Submit']
    : ['Select a project metadata', 'Review', 'Submit']
  metadata = new Metadata({ furtherstep: 0 })
  email = ''
  loading = true
  isWaiting = false
  txHash = ''
  txError = ''

  async created() {
    const currentStep = this.steps.indexOf(this.$route.params.step)
    this.currentStep = currentStep

    // redirect to /join if step doesn't exist
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

  isLinkStepValid(): boolean {
    let isValid = false
    const links = [
      this.$v.metadata.githubUrl,
      this.$v.metadata.radicleUrl,
      this.$v.metadata.websiteUrl,
      this.$v.metadata.twitterUrl,
      this.$v.metadata.discordUrl,
    ]

    for (const link of links.filter(Boolean)) {
      const isInvalid = link?.$invalid
      const isEmpty = link?.$model && link?.$model.length === 0
      if (isInvalid) {
        return false
      } else if (!isEmpty) {
        isValid = true
      }
    }
    return isValid
  }

  isStepValid(step: number): boolean {
    let isValid = true
    const stepName = this.steps[step]
    if (stepName === 'summary') {
      isValid = this.isLinkStepValid() && !this.$v.metadata.$invalid
    } else if (stepName === 'email') {
      isValid = !this.$v.email.$invalid
    }

    return isValid
  }

  isStepUnlocked(step: number): boolean {
    return step <= this.furthestStep
  }

  saveFormData(updateFurthest?: boolean): void {
    if (updateFurthest && this.currentStep + 1 > this.furthestStep) {
      this.metadata.furthestStep = this.currentStep + 1
    }
    this.$store.commit(SET_RECIPIENT_DATA, {
      updatedData: this.metadata,
    })
  }

  get furthestStep(): number {
    return this.metadata.furthestStep || 0
  }

  get isEmailRequired(): boolean {
    return !!process.env.VUE_APP_GOOGLE_SPREADSHEET_ID
  }

  get isNavDisabled(): boolean {
    return (
      !this.isStepValid(this.currentStep) &&
      this.currentStep !== this.metadata.furthestStep
    )
  }

  get hasMetadata(): boolean {
    return !!this.metadata.id
  }

  handleMetadataSelected(metadata: Metadata): void {
    this.metadata = metadata
    const id = this.metadata.id || ''
    this.saveFormData(true)
    this.$router.push({
      name: 'join-step',
      params: { step: 'summary', id },
    })
  }

  async handleStepNav(step: number, updateFurthest?: boolean): Promise<void> {
    // If isNavDisabled => disable quick-links
    if (this.isNavDisabled) return

    if (this.steps[step] === 'email') {
      // save the email in metadata for later use
      this.metadata.email = this.email
      this.$v.metadata.$touch()
    }

    // Save form data
    this.saveFormData(updateFurthest)

    if (step >= this.steps.length) {
      await this.addRecipient()
    } else {
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
  }

  async loadMetadata(): Promise<void> {
    const id = this.$route.params.id

    if (id) {
      if (id === this.$store.state.recipient?.id) {
        this.metadata = new Metadata(this.$store.state.recipient)
        if (this.metadata.email) {
          this.email = this.metadata.email
          this.$v.email.$touch()
        }
      } else {
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
  }

  get projectInterface(): Project {
    return this.metadata.toProject()
  }

  private async addRecipient() {
    const {
      currentRound,
      currentUser,
      recipient,
      recipientRegistryAddress,
      recipientRegistryInfo,
    } = this.$store.state
    this.isWaiting = true
    // Reset errors when submitting
    this.txError = ''
    if (
      recipientRegistryAddress &&
      recipient &&
      recipientRegistryInfo &&
      currentUser
    ) {
      try {
        if (currentRound && DateTime.now() >= currentRound.votingDeadline) {
          this.$router.push({
            name: 'join',
          })
          throw { message: 'round over' }
        }
        await waitForTransaction(
          addRecipient(
            recipientRegistryAddress,
            recipient,
            recipientRegistryInfo.deposit,
            currentUser.walletProvider.getSigner()
          ),
          (hash) => (this.txHash = hash)
        )
        // Send application data to a Google Spreadsheet
        if (process.env.VUE_APP_GOOGLE_SPREADSHEET_ID) {
          await fetch('/.netlify/functions/recipient', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(recipient.toFormData()),
          })
        }
        this.$store.commit(RESET_RECIPIENT_DATA)
      } catch (error) {
        this.isWaiting = false
        this.txError = (error as any).message
        return
      }
      this.isWaiting = false
      this.$router.push({
        name: 'project-added',
        params: {
          hash: this.txHash,
        },
      })
    }
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
    background: var(--bg-secondary-color);
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
  background: var(--bg-primary-color);
  box-shadow: var(--box-shadow);
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
    background: var(--bg-secondary-color);
    padding: 1.5rem;
    border-radius: 1rem;
    margin-bottom: 4rem;
  }
}

.cancel-link {
  position: sticky;
  top: 0px;
  color: var(--error-color);
  text-decoration: underline;
}

.inputs {
  margin: 1.5rem 0;
}

.input {
  border-radius: 16px;
  border: 2px solid $button-color;
  background-color: var(--bg-secondary-color);
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0em;
  width: 100%;
  &:valid {
    border: 2px solid $clr-green;
  }
  &:hover {
    background: var(--bg-primary-color);
    border: 2px solid $highlight-color;
    box-shadow: 0px 4px 16px 0px 25, 22, 35, 0.4;
  }
  &:optional {
    border: 2px solid $button-color;
    background-color: var(--bg-secondary-color);
  }
}

.input.invalid {
  border: 2px solid var(--error-color);
}
</style>
