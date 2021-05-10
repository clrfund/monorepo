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
              :class="{
                'zoom-link': step <= form.furthestStep && step !== currentStep && !navDisabled,
                disabled: navDisabled
              }"
              @click="handleStepNav(step)"
            >
              <template v-if="step === currentStep">
                <img src="@/assets/current-step.svg" alt="current step" />
                <p v-text="name" class="active step" />
              </template>
              <template v-else-if="step === furthestStep">
                <img src="@/assets/furthest-step.svg" alt="current step" />
                <p v-text="name" class="active step" />
              </template>
              <template v-else-if="isStepUnlocked(step) && isStepValid(step)">
                <img src="@/assets/green-tick.svg" alt="step complete" />
                <p v-text="name" class="step" />
              </template>
              <template v-else>
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
            :handleStepNav="handleStepNav"
            :navDisabled="navDisabled"
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
          <router-link class="cancel-link" to="/setup">
            Cancel
          </router-link>
        </div>
      </div>
      <div class="title-area">
        <h1>Set up BrightID</h1>
      </div>
      <div class="cancel-area desktop">
        <router-link class="cancel-link" to="/setup">
          Cancel
        </router-link>
      </div>
      <div class="form-area">
        <div class="verification-status" v-if="currentStep === 1">
            <div>
                <h2>Verification status</h2>
                <p>Follow the instructions below to get verified. It’s not immediate so feel free to move onto the next step when you’re ready.</p>
            </div>
            <div :class="isVerified ? 'success' : 'unverified'">{{isVerified ? 'Ready!' : 'Unverified'}} </div>
        </div>
        <div class="application">
        <div v-if="currentStep === 0">
            <h2 class="step-title">Connect</h2>
            <p>Open your BrightID app and scan this QR code. This will make the initial link between your BrightID account and our funding round.</p>
            <div class="qr">
                <img :src="appLinkQrCode" class="qr-code">
                <a v-if="!desktop" :href="appLink" target="_blank">{{ appLink }}</a>
            </div>
            <!-- TODO: success state for linked -->
            <p v-if="verification">Connected!</p>
        </div>    
        <div v-if="currentStep === 1">
            <h2 class="step-title">Get verified</h2>
            <p>This will help us know you’re not a bot! Here are your options.</p>
        </div>
        <div v-if="currentStep === 2">
            <h2 class="step-title">Sponsorship</h2>
            <p>test</p>
        </div>
        <div v-if="currentStep === 3">
            <h2 class="step-title">Get registered</h2>
            <p>test</p>
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
import IpfsImageUpload from '@/components/IpfsImageUpload.vue'
import Markdown from '@/components/Markdown.vue'
import ProjectProfile from '@/components/ProjectProfile.vue'
import Warning from '@/components/Warning.vue'

import { SET_RECIPIENT_DATA } from '@/store/mutation-types'
import { RecipientApplicationData, formToProjectInterface, BrightIDSteps } from '@/api/recipient-registry-optimistic'
import { Project } from '@/api/projects'
import QRCode from 'qrcode'
import {
  getBrightIdLink,
  Verification,
  BrightIdError,
  getVerification,
  isSponsoredUser,
  selfSponsor,
  registerUser,
} from '@/api/bright-id'
import { User } from '@/api/user'
import Transaction from '@/components/Transaction.vue'
import Loader from '@/components/Loader.vue'
import { LOAD_USER_INFO } from '@/store/action-types'
import { waitForTransaction } from '@/utils/contracts'


@Component({
  components: {
    LayoutSteps,
    ProgressBar,
    ButtonRow,
    IpfsImageUpload,
    Markdown,
    ProjectProfile,
    Warning,
    Transaction,
    Loader,
  },
  validations: {
    form: {
      connect: {
      },
      verification: {
      },
      sponsorship: {

      },
      registration: {

      },
    },
  },
})
export default class IndividualityView extends mixins(validationMixin) {
  form: BrightIDSteps = {
    connect: {

    },
    verification: {

    },
    sponsorship: {

    },
    registration: {

    },

  }
  currentStep = 0
  steps: string[] = []
  stepNames: string[] = []
  showSummaryPreview = false
  isVerified = true
  step = 0

  appLink = ''
  appLinkQrCode = ''

  sponsorTxHash = ''
  sponsorTxError = ''
  registrationTxHash = ''
  registrationTxError = ''

  private get currentUser(): User {
    return this.$store.state.currentUser
  }

  mounted() {
    // Present app link and QR code
    this.appLink = getBrightIdLink(this.currentUser.walletAddress)
    QRCode.toDataURL(this.appLink, (error, url: string) => {
      if (!error) {
        this.appLinkQrCode = url
      }
    })
    this.waitForVerification()
  }

  private async waitForVerification() {
    let verification
    const checkVerification = async () => {
      try {
        verification = await getVerification(this.currentUser.walletAddress)
      } catch (error) {
        if (
          error instanceof BrightIdError &&
          error.code === 4 &&
          this.step <= 1
        ) {
          // Error 4: Not sponsored
          this.sponsor()
        }
      }
      if (verification) {
        this.register(verification)
      }
    }
    await checkVerification()
    if (this.step === 0) {
      // First check completed
      this.step = 1
    }
    if (!verification) {
      const intervalId = setInterval(async () => {
        await checkVerification()
        if (verification) {
          clearInterval(intervalId)
        }
      }, 5000)
    }
  }

  private async sponsor() {
    this.step = 2
    const { userRegistryAddress } = this.$store.state.currentRound
    const signer = this.currentUser.walletProvider.getSigner()
    const isSponsored = await isSponsoredUser(
      userRegistryAddress,
      this.currentUser.walletAddress,
    )
    if (!isSponsored) {
      try {
        await waitForTransaction(
          selfSponsor(userRegistryAddress, signer),
          (hash) => this.sponsorTxHash = hash,
        )
      } catch (error) {
        this.sponsorTxError = error.message
        return
      }
    }
  }

  private async register(verification: Verification) {
    this.step = 3
    const { userRegistryAddress } = this.$store.state.currentRound
    const signer = this.currentUser.walletProvider.getSigner()
    try {
      await waitForTransaction(
        registerUser(userRegistryAddress, verification, signer),
        (hash) => this.registrationTxHash = hash,
      )
    } catch (error) {
      this.registrationTxError = error.message
      return
    }
    this.$store.dispatch(LOAD_USER_INFO)
    this.step += 1
  }

  created() {
    const steps = Object.keys(this.form)
    // Reassign last key from form object (furthestStep) to 'summary'
    /* steps[steps.length - 1] = 'summary' */
    const currentStep = steps.indexOf(this.$route.params.step)
    const stepNames = [
      'Connect',
      'Get verified',
      'Sponsorship',
      'Get registered',
    ]
    this.steps = steps
    this.currentStep = currentStep
    this.stepNames = stepNames
    this.form = this.$store.state.recipient || this.form

    // redirect to /join/ if step doesn't exist
    if (this.currentStep < 0) {
      this.$router.push({ name: 'setup' })
    }
    // "Next" button restricts forward navigation via validation, and
    // eventually updates the `furthestStep` tracker when valid and clicked/tapped.
    // If URL step is ahead of furthest, navigate back to furthest
    if (this.currentStep > this.form.furthestStep) {
      this.$router.push({ name: 'getVerified', params: { step: steps[this.form.furthestStep] }})
    }

  }


  
  isStepValid(step: number): boolean {
    if (step === 3) {
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
    this.$store.commit(SET_RECIPIENT_DATA, {
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

  get navDisabled(): boolean {
    return !this.isStepValid(this.currentStep) && this.currentStep !== this.furthestStep
  }

  handleStepNav(step): void {
    // If navDisabled => disable quick-links
    if (this.navDisabled) return
    // Save form data
    this.saveFormData()
    // Navigate
    if (this.isStepUnlocked(step)) {
      this.$router.push({
        name: 'getVerified',
        params: {
          step: this.steps[step],
        },
      })
    }
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

    .zoom-link {
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
  padding-left: 0rem; 
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;

  h1 {
    font-family: "Glacial Indifference", sans-serif;
  }

  @media (max-width: $breakpoint-m) {
    margin-top: 2rem;
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
  &:first-of-type {
    margin-top: 0;
  }
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.application {
  /* height: 100%; */
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
  input[type="radio"]:checked+label {
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
  font-family: "Inter";     
  @media (max-width: $breakpoint-m) {
    /* flex-direction: column;
    gap: 0;
    margin-left: 0rem; */
    /* display: none; */
  }
  .active-tab{
    padding-bottom: 0.5rem;
    border-bottom: 4px solid $clr-green;
    border-radius: 4px;
    font-weight: 600;
    /* text-decoration: underline; */
  }
  .inactive-tab{
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

.verification-status {
    background: $bg-light-color;
    padding: 1.5rem 2rem;
    border-radius: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.verification-status h2 {
    font-family: "Glacial Indifference", sans-serif;
    font-size: 1.25rem;
    font-style: normal;
    font-weight: 700;
    line-height: 1.5rem;
    letter-spacing: 0em;
    text-align: left;
    margin: 0;
}

.verification-status p {
    margin: 0;
    margin-top: 0.5rem;
}

.success {
    color: $clr-green;
    font-weight: 600;
}

.unverified {
    color: $error-color;
    font-weight: 600;
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
   .active-tab{
    padding-bottom: 0.5rem;
    border-bottom: 4px solid $clr-green;
    border-radius: 4px;
    font-weight: 600;
    /* text-decoration: underline; */
  }
  .inactive-tab{
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
  font-family: "Glacial Indifference", sans-serif;
  font-size: 1.5rem;
}

.edit-button {
  font-family: "Inter";
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


.qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: $bg-primary-color;  
    border-radius: 1rem;
    margin-top: 2rem;  
    padding: 2rem; 
    @media (max-width: $breakpoint-m) {
        width: 100%;
  }
}

.qr-code {
  width: 320px;
  margin: 2rem;
}

.data img {
  padding: 0.25rem;
  margin-top: 0.25rem;
  &:hover {
    background: $bg-primary-color;
    border-radius: 4px;
  }
}
.disabled {
  cursor: not-allowed;
  opacity: 0.5;

  &:hover {
    opacity: 0.5;
    transform: scale(1);
    cursor: not-allowed;
  }  
}
.pt-1 {
  padding-top: 1rem;
}
</style>
