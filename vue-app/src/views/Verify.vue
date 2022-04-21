<template>
  <div class="container">
    <div class="grid">
      <div class="progress-area desktop">
        <div class="progress-container">
          <progress-bar
            :currentStep="currentStep + 1"
            :totalSteps="steps.length"
          />
          <p class="subtitle">
            Step {{ currentStep + 1 }} of {{ steps.length }}
          </p>
          <div class="progress-steps">
            <div
              v-for="(step, stepIndex) in steps"
              :key="step.page"
              class="progress-step"
            >
              <template v-if="stepIndex === currentStep">
                <loader
                  v-if="stepIndex === 2 && !brightId.isVerified"
                  class="progress-steps-loader"
                />
                <img
                  class="current-step"
                  v-else
                  src="@/assets/current-step.svg"
                  alt="current step"
                />
                <p v-text="step.name" class="active step" />
              </template>
              <template
                v-else-if="isStepUnlocked(stepIndex) && isStepValid(stepIndex)"
              >
                <loader
                  v-if="stepIndex === 2 && !brightId.isVerified"
                  class="progress-steps-loader"
                />
                <img v-else src="@/assets/green-tick.svg" alt="step complete" />
                <p v-text="step.name" class="step" />
              </template>
              <template v-else>
                <img
                  class="remaining-step"
                  src="@/assets/step-remaining.svg"
                  alt="step remaining"
                />
                <p v-text="step.name" class="step" />
              </template>
            </div>
          </div>
        </div>
      </div>
      <div class="progress-area mobile">
        <progress-bar
          :currentStep="currentStep + 1"
          :totalSteps="steps.length"
        />
        <div class="row">
          <p>Step {{ currentStep + 1 }} of {{ steps.length }}</p>
          <links class="cancel-link" to="/verify"> Cancel </links>
        </div>
      </div>
      <div class="title-area">
        <h1>Set up BrightID</h1>
      </div>
      <div class="cancel-area desktop">
        <links class="cancel-link" to="/verify"> Cancel </links>
      </div>
      <div class="form-area">
        <div class="verification-status" v-if="currentStep === 2">
          <div>
            <h2>Verification status</h2>
            <p>
              {{
                isManuallyVerified
                  ? "You're BrightID verified! Complete the remaining steps to start contributing."
                  : 'Follow the instructions below to get verified in BrightID.'
              }}
            </p>
            <div v-if="!isManuallyVerified">
              <p>
                Once you're verified in BrightID, verification confirmation
                doesn't happen immediately so feel free to check by clicking the
                button below.
              </p>
              <div class="actions">
                <button
                  v-if="!isManuallyVerified"
                  @click="handleIsVerifiedClick"
                  class="btn-primary"
                  :disabled="loadingManualVerify"
                >
                  Check if you are verified
                </button>
                <loader v-if="loadingManualVerify" />
              </div>
            </div>
          </div>
          <div :class="isManuallyVerified ? 'success' : 'unverified'">
            {{ isManuallyVerified ? 'Ready!' : 'Unverified' }}
          </div>
        </div>
        <div class="application">
          <div v-if="currentStep === 0">
            <h2 class="step-title">Connect</h2>
            <p>
              First you need to connect your BrightID account with your wallet
              address.
            </p>
            <p>
              Once the app is linked in your BrightID app, wait a few moments
              for us to verify the connection. We'll automatically transition
              you to the next step.
            </p>
            <div class="qr">
              <div class="instructions">
                <p class="desktop" v-if="appLinkQrCode">
                  Scan this QR code with your BrightID app
                </p>
                <img :src="appLinkQrCode" class="desktop qr-code" />
                <p class="mobile">
                  Follow this link to connect your wallet to your BrightID app
                </p>
                <links class="mobile" :to="appLink">
                  <div class="icon">
                    <img src="@/assets/bright-id.png" />
                  </div>
                  {{ appLink }}
                </links>
                <p class="mobile">
                  <em>
                    This link might look scary but it just makes a connection
                    between your connected wallet address, our app, and
                    BrightID. Make sure your address looks correct.
                  </em>
                </p>
              </div>

              <loader />
            </div>
          </div>
          <div v-if="currentStep === 1">
            <h2 class="step-title">Get sponsored</h2>
            <p>
              You need a sponsorship token to become BrightID verified. This
              helps support BrightID as a decentralized platform. You’ll only
              ever need to do this once and it covers you for any other app that
              works with BrightID.
            </p>
            <div class="transaction">
              <div>
                <button
                  type="button"
                  class="btn-action btn-block"
                  @click="sponsor"
                  :disabled="sponsorTxHash.length !== 0"
                >
                  Get sponsored
                </button>
                <transaction
                  v-if="sponsorTxHash || loadingTx || sponsorTxError"
                  :display-close-btn="false"
                  :hash="sponsorTxHash"
                  :error="sponsorTxError"
                />
              </div>
              <div v-if="sponsorTxHash">
                <loader />
                <p>
                  Waiting for sponsorship verification from BrightID, please
                  wait. This shouldn't take more than a couple of minutes.
                </p>
              </div>
            </div>
          </div>
          <div v-if="currentStep === 2">
            <h2 class="step-title">Get verified</h2>
            <p>
              BrightID verification helps prove that you’re a unique human. To
              get verified, you need enough people to confirm they've met you
              and you're a real person. There are a couple of ways to do this:
            </p>
            <accordion
              tag="🚀 Fastest"
              header="Join a BrightId party"
              content="BrightID run verification parties regularly. Join the call,
            meet other new users, and they'll verify you’re a human and not a
            bot. Quick and painless, even for you introverts out there."
              :linkButton="{
                link: 'https://meet.brightid.org/#/',
                text: 'View party schedule',
              }"
            />
            <accordion
              tag="🎰 Luckiest"
              header="Connect with 2 verified humans"
              content="Know anyone that's contributed to Gitcoin Grants or clr.fund
                rounds? They may already be verified. Hit them up and see if
                they can verify you!"
            />
          </div>
          <div v-if="currentStep === 3">
            <h2 class="step-title">Register</h2>
            <p>
              To protect the round from bribery and fraud, you need to add your
              wallet address to a smart contract registry. Once you’re done, you
              can join the funding round!
            </p>
            <div class="transaction">
              <button
                type="button"
                class="btn-action btn-block"
                @click="register"
                :disabled="registrationTxHash.length !== 0"
              >
                Become a contributor
              </button>
              <transaction
                v-if="registrationTxHash || loadingTx || registrationTxError"
                :display-close-btn="false"
                :hash="registrationTxHash"
                :error="registrationTxError"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Accordion from '@/components/Accordion.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import QRCode from 'qrcode'
import {
  getBrightIdLink,
  selfSponsor,
  registerUser,
  BrightId,
  BrightIdError,
  getBrightId,
} from '@/api/bright-id'
import { User } from '@/api/user'
import Transaction from '@/components/Transaction.vue'
import Loader from '@/components/Loader.vue'
import Links from '@/components/Links.vue'
import { LOAD_USER_INFO, LOAD_BRIGHT_ID } from '@/store/action-types'
import { waitForTransaction } from '@/utils/contracts'
import { SET_CURRENT_USER } from '@/store/mutation-types'

interface BrightIDStep {
  page: 'connect' | 'sponsorship' | 'verification' | 'registration'
  name: string
}

@Component({
  components: {
    Accordion,
    ProgressBar,
    Transaction,
    Loader,
    Links,
  },
})
export default class VerifyView extends Vue {
  steps: Array<BrightIDStep> = [
    { page: 'connect', name: 'Connect' },
    { page: 'sponsorship', name: 'Sponsorship' },
    { page: 'verification', name: 'Get verified' },
    { page: 'registration', name: 'Get registered' },
  ]

  appLink = ''
  appLinkQrCode = ''

  sponsorTxHash = ''
  sponsorTxError = ''
  registrationTxHash = ''
  registrationTxError = ''

  loadingTx = false

  isManuallyVerified = false
  loadingManualVerify = false

  get currentUser(): User {
    return this.$store.state.currentUser
  }

  get brightId(): BrightId | undefined {
    return this.currentUser?.brightId
  }

  get currentStep(): number {
    if (!this.brightId || !this.brightId.isLinked) {
      return 0
    }

    if (!this.brightId.isSponsored) {
      return 1
    }

    if (!this.brightId.isVerified) {
      return 2
    }

    if (!this.currentUser?.isRegistered) {
      return 3
    }

    // This means the user is registered
    return -1
  }

  created() {
    if (!this.currentUser?.walletAddress) {
      this.$router.replace({ name: 'verify' })
    }

    // redirect to the verify success page if the user is registered
    if (this.currentStep < 0) {
      this.$router.replace({ name: 'verified' })
    }
  }

  mounted() {
    if (this.currentUser && !this.brightId?.isLinked) {
      // Present app link and QR code
      this.appLink = getBrightIdLink(this.currentUser.walletAddress)
      QRCode.toDataURL(this.appLink, (error, url: string) => {
        if (!error) {
          this.appLinkQrCode = url
        }
      })
      this.waitUntil(() => this.brightId?.isLinked)
    }
  }

  async sponsor() {
    const { userRegistryAddress } = this.$store.state.currentRound
    const signer = this.currentUser.walletProvider.getSigner()

    this.loadingTx = true
    this.sponsorTxError = ''
    try {
      await waitForTransaction(
        selfSponsor(userRegistryAddress, signer),
        (hash) => (this.sponsorTxHash = hash)
      )
      this.loadingTx = false
      this.waitUntil(() => this.brightId?.isSponsored)
    } catch (error) {
      this.sponsorTxError = error.message
      return
    }
  }

  async register() {
    const { userRegistryAddress } = this.$store.state.currentRound
    const signer = this.currentUser.walletProvider.getSigner()

    if (this.brightId?.verification) {
      this.loadingTx = true
      this.registrationTxError = ''
      try {
        await waitForTransaction(
          registerUser(userRegistryAddress, this.brightId.verification, signer),
          (hash) => (this.registrationTxHash = hash)
        )
        this.loadingTx = false
        this.$router.push({
          name: 'verified',
          params: { hash: this.registrationTxHash },
        })
      } catch (error) {
        this.registrationTxError = error.message
        return
      }
      this.$store.dispatch(LOAD_USER_INFO)
    }
  }

  async handleIsVerifiedClick() {
    this.loadingManualVerify = true

    try {
      const brightId = await getBrightId(this.currentUser.walletAddress)

      if (brightId.isVerified) {
        this.isManuallyVerified = true
        setTimeout(() => {
          this.$store.commit(SET_CURRENT_USER, {
            ...this.currentUser,
            brightId,
          })
        }, 5000)
      }
    } catch (error) {
      if (!(error instanceof BrightIdError)) {
        /* eslint-disable-next-line no-console */
        console.warn('Error while fetching bright id verification', error)
      }
    }

    this.loadingManualVerify = false
  }

  /**
   * Start polling brightId state until the condition is met
   */
  private async waitUntil(isConditionMetFn, intervalTime = 5000) {
    let isConditionMet = false

    const checkVerification = async () => {
      await this.loadBrightId()
      isConditionMet = isConditionMetFn()
    }
    await checkVerification()

    if (!isConditionMet) {
      const intervalId = setInterval(async () => {
        await checkVerification()
        if (isConditionMet) {
          clearInterval(intervalId)
        }
      }, intervalTime)
    }
  }

  async loadBrightId() {
    await this.$store.dispatch(LOAD_BRIGHT_ID)
  }

  isStepValid(step: number): boolean {
    return !!this.steps[step]
  }

  isStepUnlocked(step: number): boolean {
    if (!this.brightId) {
      return false
    }

    switch (step) {
      case 0:
        // Connect
        return true
      case 1:
        // Sponsor
        return this.brightId.isSponsored
      case 2:
        // Verify
        return this.brightId.isVerified
      case 3:
        // Register
        return this.currentUser?.isRegistered
      default:
        return false
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
    grid-template-rows: auto auto 1fr;
    grid-template-columns: 1fr;
    grid-template-areas:
      'progress'
      'title'
      'form';
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
    border-radius: 16px;
    /* width: 320px; */
    box-shadow: var(--box-shadow);

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

      img.current-step {
        filter: var(--img-filter, invert(0.3));
      }

      p {
        margin: 0.5rem 0;
      }
      .step {
        @include stepColor(var(--text-color-rgb));
      }
      .active {
        color: var(--text-color);
        font-weight: 600;
        font-size: 1rem;
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
    font-family: 'Glacial Indifference', sans-serif;
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

.form-area p {
  line-height: 150%;
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
    background: var(--bg-secondary-color);
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
  color: var(--error-color);
  text-decoration: underline;
}

.form-background {
  border-radius: 0.5rem;
  padding: 1rem;
  background: var(--bg-light-color);
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

.loader {
  margin: $modal-space auto;
}

.error {
  color: var(--error-color);
  margin-bottom: 0;
  margin-top: 0.5rem;
  font-size: 14px;
  &:before {
    content: '⚠️ ';
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

.verification-status {
  background: var(--bg-light-color);
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
  font-family: 'Glacial Indifference', sans-serif;
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

.verification-status .actions {
  margin-top: 1rem;
  @media (max-width: $breakpoint-m) {
    button {
      width: 100%;
    }
  }
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
  color: var(--error-color);
  font-weight: 600;
  margin-left: 1rem;
  @media (max-width: $breakpoint-m) {
    margin-left: 0;
    margin-bottom: 1rem;
  }
}

.transaction {
  padding: 2rem;
  border-radius: 1rem;
  width: auto;

  button {
    max-width: 250px;
    margin: auto;
  }
}

.qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.btn-block {
  display: block;
  width: 100%;
}

.remaining-step {
  filter: var(--img-filter, invert(0.3));
}
</style>
