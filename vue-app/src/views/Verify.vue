<template>
  <div class="container">
    <div class="grid">
      <!-- TODO: use FormProgressWidget.vue component... -->
      <!-- This is all copy/pasted from there -->
      <!-- Will likely need to generalize it a bit -->
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
                'zoom-link': step !== currentStep,
                disabled: false, // TODO add logic
              }"
              @click="handleStepNav(step)"
            >
              <template v-if="step === currentStep">
                <loader v-if="step === 1 && isStepUnlocked(1) && !isVerified" class="progress-steps-loader" />
                <img v-else src="@/assets/current-step.svg" alt="current step" />
                <p v-text="name" class="active step" /> <tooltip v-if="step === 1 && isStepUnlocked(1) && !isVerified" position="left" content="We'll keep checking with BrightID to see if you're verified"><img src="@/assets/info.svg" /></tooltip>
              </template>
              <template v-else-if="isStepUnlocked(step) && isStepValid(step)">
                <loader v-if="step === 1 && isStepUnlocked(1) && !isVerified" class="progress-steps-loader" />
                <img v-else src="@/assets/green-tick.svg" alt="step complete" />
                <p v-text="name" class="step" /> <tooltip v-if="step === 1 && isStepUnlocked(1) && !isVerified" position="left" content="You still need verification from BrightID"><img src="@/assets/info.svg" /></tooltip>
              </template>
              <template v-else>
                <img src="@/assets/step-remaining.svg" alt="step remaining" />
                <p v-text="name" class="step" />
              </template>
            </div>
          </div>
          <form-navigation
            :isJoin="false"
            :isStepValid="isStepValid(currentStep)"
            :steps="steps"
            :currentStep="currentStep"
            :callback="saveFormData"
            :handleStepNav="handleStepNav"
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
          <router-link class="cancel-link" to="/verify">
            Cancel
          </router-link>
        </div>
      </div>
      <div class="title-area">
        <h1>Set up BrightID</h1>
      </div>
      <div class="cancel-area desktop">
        <router-link class="cancel-link" to="/verify">
          Cancel
        </router-link>
      </div>
      <div class="form-area">
        <div class="verification-status" v-if="currentStep === 1">
            <div>
                <h2>Verification status</h2>
                <p>{{isVerified ? 'You\'re BrightID verified! Complete the remaining steps to start contributing.' : 'Follow the instructions below to get verified. It’s not immediate so feel free to move onto the next step when you’re ready.'}}</p>
            </div>
            <div :class="isVerified ? 'success' : 'unverified'">{{isVerified ? 'Ready!' : 'Unverified'}} </div>
        </div>
        <!-- The below should be displayed if the user was already sponsored and didn't have to do a tx through our app -->
        <div class="verification-status" v-if="currentStep === 2 && isSponsored">
            <div>
                <!-- TODO: add blockie -->
                <h2>You're already sponsored!</h2>
            </div>
            <div class="success">Sponsored by {{sponsoredBy}}</div>
        </div>
        <div class="application">
        <div v-if="currentStep === 0">
            <h2 class="step-title">Connect</h2>
            <p>First you need to connect your BrightID account with your wallet address.</p>
            <div class="qr">
                <div v-if="step > 1">
                    <div class="connected-message">
                        <div class="checkmark"><img src="@/assets/checkmark.svg" /></div>
                        <div class="profile-image">
                            <img :src="profileImageUrl">
                            <!-- TODO: display blockie next to checkmark -->
                        </div>
                        <p>Move along! Your BrightID app is connected</p>
                    </div>
                </div>
                <div class="instructions" v-else>
                    <p class="desktop" v-if="appLinkQrCode">Scan this QR code with your BrightID app</p>
                    <img :src="appLinkQrCode" class="desktop qr-code">
                    <!-- TODO: connection should cause the QR code to appear -->
                    <p class="mobile">Follow this link to connect your wallet to your BrightID app</p>
                    <a class="mobile" :href="appLink" target="_blank">
                      <div class="icon">
                        <img src="@/assets/bright-id.png" />
                      </div>
                      {{ appLink }}
                    </a>
                    <p class="mobile"><em>This link might look scary but it just makes a connection between your connected wallet address, our app, and BrightID. Make sure your address looks correct.</em></p>
                </div>

                <loader v-if="step === 0" />
            </div>
            <div v-if="!appLinkQrCode">
              <loader />
              <div>Connect your wallet to get started</div>
              <wallet-widget />
            </div>
            <!-- TODO: success state for linked -->
        </div>    
        <div v-if="currentStep === 1 && !isVerified">
            <h2 class="step-title">Get verified</h2>
            <p>BrightID verification helps prove that you’re a unique human. To get verified, you need enough people to confirm they've met you and you're a real person. There are a few different ways to do this...</p>
            <div class="option">
              <div class="option-header">
                <div>
                  <div class="tag">🚀Fastest</div>
                  <h3>Join a BrightID party </h3>
                </div>
                <img @click="handleToggleTab" v-if="showExpandedOption" src="@/assets/chevron-up.svg" />
                <img @click="handleToggleTab" v-else src="@/assets/chevron-down.svg" />
              </div>
              <div v-if="showExpandedOption" id="fastest">
                <p>
                  BrightID run verification parties regularly. Join the call, meet other new users, and they'll verify you’re a human and not a bot. Quick and painless, even for you introverts out there.
                </p>
                <div class="btn-secondary">View party schedule</div>
              </div>
            </div>
            <div class="option">
              <div class="option-header">
                <div>
                  <div class="tag">💡Most interesting</div>
                  <h3>Join us at “The consensus layer bonanza – an evening with the eth2 researchers”</h3>
                </div>
                <img @click="handleToggleTab" v-if="showExpandedOption" src="@/assets/chevron-up.svg" />
                <img @click="handleToggleTab" v-else src="@/assets/chevron-down.svg" />
              </div>
              <p v-if="showExpandedOption" id="interesting">
                Information to come
              </p>
            </div>
            <div class="option">
              <div class="option-header">
                <div>
                  <div class="tag">🎰 Luckiest</div>
                  <h3>Connect with 2 verified humans</h3>
                </div>
                <img @click="handleToggleTab" v-if="showExpandedOption" src="@/assets/chevron-up.svg" />
                <img @click="handleToggleTab" v-else src="@/assets/chevron-down.svg" />
              </div>
              <p v-if="showExpandedOption" id="luckiest">
                Know anyone that's contributed to Gitcoin Grants or clr.fund rounds? They may already be verified. Hit them up and see if they can verify you!
              </p>
            </div>
        </div>
        <div v-if="currentStep === 2">
            <h2 class="step-title">Sponsorship</h2>
            <p>You need a sponsorship token to become BrightID verified. This helps support BrightID as a decentralized platform. You’ll only ever need to do this once and it covers you for any other app that works with BrightID.</p>
            <div class="transaction">
                <div v-if="isSponsored">
                  <div class="connected-message">
                      <div class="checkmark"><img src="@/assets/checkmark.svg" /></div>
                      <div class="profile-image">
                          <img :src="profileImageUrl">
                          <!-- TODO: display blockie next to checkmark -->
                      </div>
                      <p>Move along! You're sponsored!</p>
                      <!-- TODO: if isSponsored = true and the user did it via our UI we should show the tx receipt -->
                  </div>
                </div>
                <div v-else>
                  <wallet-widget class="mx0" v-bind:showEth="true" />
                  <!--TODO: mobile view for this wallet widget has a weird background -->
                  <div class="checkout-row">
                      <p class="m0"><b>Estimated transaction fee</b></p>
                      <p class="m0">{{txFee}} {{feeToken}} ({{fiatSign}}{{fiatFee}}) </p>
                  </div>
                  <div class="btn-action">Get sponsored</div>
                  <transaction
                      :hash="sponsorTxHash" />
                </div>
            </div>
            
        </div>
        <div v-if="currentStep === 3">
            <h2 class="step-title">Get registered</h2>
            <p>To protect the round from bribery and fraud, you need to add your wallet address to a smart contract register. Once you’re done, you can join the funding round!</p>
            <div class="verification-status" v-if="!isVerified">
              <div>
                  <h2>You can't register yet</h2>
                  <p>You can’t join the round until you’re BrightID verified. Reminder: it can take up to a few hours even after you've met the requirements. <router-link to="/verify/verification">How to get verified</router-link></p>
              </div>
              <div :class="isVerified ? 'success' : 'unverified'">{{isVerified ? 'Ready!' : 'Unverified'}} </div>
            </div>
            <div class="transaction" v-if="isVerified">
                <wallet-widget class="mx0" v-bind:showEth="true"/>
                <div class="checkout-row">
                  <p class="m0"><b>Estimated transaction fee</b></p>
                  <p class="m0">{{txFee}} {{feeToken}} ({{fiatSign}}{{fiatFee}}) </p>
                </div>
                <div class="btn-action">Become a contributor</div>
                <transaction
                    :hash="sponsorTxHash" />
            </div>
        </div>
        </div>
      </div>
      <div class="nav-area nav-bar mobile">
        <!-- TODO fix props we pass to form-progress-widget -->
        <!-- <form-progress-widget
          :steps="steps"
          :currentStep="currentStep"
          :callBack="saveFormData"
          :isStepValid="isStepValid(currentStep)"
        /> -->
        <!-- TODO submit button to trigger tx, pass callback to above <botton-row />?  -->
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Component, { mixins } from 'vue-class-component'
// TODO do we need form validation for this flow? I don't think so...
import { validationMixin } from 'vuelidate'
// import { required, maxLength, url, email } from 'vuelidate/lib/validators'
// import { isAddress } from '@ethersproject/address'
import LayoutSteps from '@/components/LayoutSteps.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import FormNavigation from '@/components/FormNavigation.vue'
import FormProgressWidget from '@/components/FormProgressWidget.vue'
import Tooltip from '@/components/Tooltip.vue'
import Markdown from '@/components/Markdown.vue'
import ProjectProfile from '@/components/ProjectProfile.vue'
import WalletWidget from '@/components/WalletWidget.vue'
import Warning from '@/components/Warning.vue'
import { SET_RECIPIENT_DATA } from '@/store/mutation-types'
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

// TODO is this needed? What data do we need to track in each step of flow?
// How long should we expect this flow to take some users? Should we store in GUN db?
// See how this is handled in BrightIdModal.vue
interface BrightIDSteps {
    connect: {};
    verification: {};
    sponsorship: {};
    registration: {};
}

@Component({
  components: {
    LayoutSteps,
    ProgressBar,
    FormNavigation,
    FormProgressWidget,
    Markdown,
    ProjectProfile,
    Warning,
    Transaction,
    Loader,
    WalletWidget,
    Tooltip,
  },
  validations: {
    form: {
      connect: {},
      verification: {},
      sponsorship: {},
      registration: {},
    },
  },
})
export default class VerifyView extends mixins(validationMixin) {
  form: BrightIDSteps = {
    connect: {},
    verification: {},
    sponsorship: {},
    registration: {},
  }
  currentStep = 0
  steps: string[] = []
  stepNames: string[] = []
  showSummaryPreview = false
  sponsoredBy = 'Gitcoin'
  txFee = '0.00006'
  feeToken = 'ETH'
  fiatFee = '1.04'
  fiatSign = '$'
  step = 0
  showExpandedOption = false
  isSponsored = false // TODO implement

  appLink = ''
  appLinkQrCode = ''

  sponsorTxHash = ''
  sponsorTxError = ''
  registrationTxHash = ''
  registrationTxError = ''
  profileImageUrl: string | null = null

  private get currentUser(): User {
    return this.$store.state.currentUser
  }

  private get isVerified(): boolean {
    return this.$store.state.currentUser?.isVerified
  }

  handleToggleTab(event): void {
    const { id } = event.target
    // Guard clause: 
    if (
      (this.showExpandedOption && id === 'review') ||
      (this.showExpandedOption && id === 'preview')
    ) return
    this.showExpandedOption = !this.showExpandedOption
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
        // TODO fix
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

    // redirect to /verify/ if step doesn't exist
    if (this.currentStep < 0) {
      this.$router.push({ name: 'verify' })
    }

    // TODO fetch verification data w/ BrightID - don't need furthest step
    // Particularly for people who are already verified on BrightID...
    // if (this.currentStep > this.form.furthestStep) {
    //   this.$router.push({ name: 'verifyStep', params: { step: steps[this.form.furthestStep] }})
    // }

  }

  // TODO implement
  isStepValid(step: number): boolean {
    return !!step
  }

  // TODO fetch verification data w/ BrightID - don't need furthest step
  isStepUnlocked(step: number): boolean {
    switch (step) {
    case 0:
      // Connect
      return true
    case 1:
      // Verify
      return this.isVerified
    case 2:
      // Sponsor
      return this.sponsoredBy.length > 0
    case 3:
      // Register
      return this.registrationTxHash.length > 0
    default:
      return false
    }
  }

  // TODO refactor/remove - this is copied from Join.vue
  // Not sure if we need to save any form data
  saveFormData(): void {
    if (typeof this.currentStep !== 'number') return
    // TODO update to SET_CONTRIBUTOR_DATA
    this.$store.commit(SET_RECIPIENT_DATA, {
      updatedData: this.form,
      step: this.steps[this.currentStep],
      stepNumber: this.currentStep,
    })
  }

  // TODO refactor/remove - this is copied from Join.vue
  // Not sure if we need to save any form data
  handleStepNav(step): void {
    // Save form data
    this.saveFormData()
    // Navigate
    if (this.isStepUnlocked(step)) {
      this.$router.push({
        name: 'verifyStep',
        params: {
          step: this.steps[step],
        },
      })
    }
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

    .progress-steps-loader {
      margin: 0rem;
      margin-right: 1rem;
      margin-top: 0.5rem;
      padding: 0;
      width: 1rem;
      height: 1rem;
    }

    .progress-steps-loader:after {
      width: 1rem;
      height: 1rem;
      margin: 0;
      border-radius: 50%;
      border: 3px solid $clr-pink;
      border-color: $clr-pink transparent $clr-pink transparent;
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

.connected-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.checkmark {
    background: $clr-green;
    border-radius: 2rem;
    padding: 0.5rem;
    width: fit-content;
    display: flex;
    align-items: center;
}

.checkmark img {
    width: 1rem;
    height: 1rem;
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

.form-area p {
    line-height: 150%;
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
    @media (max-width: $breakpoint-m) {
    flex-direction: column-reverse;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
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
    margin-left: 1rem;
    @media (max-width: $breakpoint-m) {
    margin-left: 0;
    margin-bottom: 1rem;
  }
}

.unverified {
    color: $error-color;
    font-weight: 600;
    margin-left: 1rem;
    @media (max-width: $breakpoint-m) {
    margin-left: 0;
    margin-bottom: 1rem;
  }
}

.transaction {
    background: $bg-primary-color;
    border: 1px solid #000;
    padding: 1.5rem;
    border-radius: 1rem;
    width: auto;
}

.checkout-row {
    display: flex;
    justify-content: space-between;
    margin: 2rem 0;
    @media (max-width: $breakpoint-m) {
    flex-direction: column;
    justify-content: flex-start;
    margin: 1rem 0;
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
    /* @media (max-width: $breakpoint-m) {
        width: 100%;
  } */
}

.instructions {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  a {
    overflow-wrap: anywhere;
  }
}

.qr-code {
  width: 320px;
  margin: 2rem;
}

.option {
    background: $bg-light-color;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;

  img {
    margin: 0.5rem;
    padding: 0.5rem;
    cursor: pointer;
    &:hover {
      background: $bg-secondary-color;
      border-radius: 0.5rem;
    }
  }
  
  h3 {
    font-family: "Glacial Indifference", sans-serif;
    font-size: 1.25rem;
    font-style: normal;
    font-weight: 700;
    line-height: 1.5rem;
    letter-spacing: 0em;
    text-align: left;
    margin: 0;
    margin-top: 0.5rem;
    text-transform: uppercase;
  }
}


.option-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
} 

.tag {
    /* background: #fff9; */
    border-radius: 2rem;
    font-family: "Glacial Indifference", sans-serif;
    padding: 0.25rem 0.5rem;
    padding-left: 0;
    /* color: $bg-primary-color; */
    font-size: 16px;
    text-transform: uppercase;
    width: fit-content;
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

.m0 {
  margin: 0;
}

.mx0 {
  margin-left: 0;
  margin-right: 0;
}

.icon {
  $icon-height: 5rem;
  height: $icon-height;
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  img {
    width: $icon-height;
    aspect-ratio: 1;
  }
}
</style>