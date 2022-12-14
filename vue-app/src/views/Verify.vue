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
            {{
              $t('verify.subtitle', {
                currentStep: currentStep + 1,
                steps: steps.length,
              })
            }}
          </p>
          <div class="progress-steps">
            <div
              v-for="(step, stepIndex) in steps"
              :key="step.page"
              class="progress-step"
            >
              <template v-if="stepIndex === currentStep">
                <loader
                  v-if="stepIndex === 0 && !brightId.isVerified"
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
                  v-if="stepIndex === 0 && !brightId.isVerified"
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
          <p>
            {{
              $t('verify.p1', {
                currentStep: currentStep + 1,
                steps: steps.length,
              })
            }}
          </p>
          <links class="cancel-link" to="/verify">
            {{ $t('cancel') }}
          </links>
        </div>
      </div>
      <div class="title-area">
        <h1>{{ $t('verify.h1') }}</h1>
      </div>
      <div class="cancel-area desktop">
        <links class="cancel-link" to="/verify">
          {{ $t('cancel') }}
        </links>
      </div>
      <div class="form-area">
        <div class="application">
          <div v-if="currentStep === 0">
            <h2 class="step-title">{{ $t('verify.h2_1') }}</h2>
            <p>
              {{ $t('verify.p2') }}
            </p>
            <p>
              {{ $t('verify.p3') }}
            </p>
            <div class="qr">
              <div class="instructions" v-if="appLink">
                <p class="desktop" v-if="appLinkQrCode">
                  {{ $t('verify.p4') }}
                </p>
                <img :src="appLinkQrCode" class="desktop qr-code" />
                <p class="mobile">
                  {{ $t('verify.p5') }}
                </p>
                <links class="mobile" :to="appLink">
                  <div class="icon">
                    <img src="@/assets/bright-id.png" />
                  </div>
                  {{ appLink }}
                </links>
                <p class="mobile">
                  <em>
                    {{ $t('verify.p6') }}
                  </em>
                </p>
              </div>

              <loader />
            </div>
          </div>
          <div v-if="currentStep === 1">
            <h2 class="step-title">{{ $t('verify.h2_2') }}</h2>
            <p>
              {{ $t('verify.p7') }}
            </p>
            <div class="transaction">
              <button
                type="button"
                class="btn-action btn-block"
                @click="register"
                :disabled="registrationTxHash.length !== 0"
              >
                {{ $t('verify.btn') }}
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
import { Watch } from 'vue-property-decorator'
import ProgressBar from '@/components/ProgressBar.vue'
import QRCode from 'qrcode'
import {
  getBrightIdLink,
  getBrightIdUniversalLink,
  registerUser,
  BrightId,
} from '@/api/bright-id'
import { User } from '@/api/user'
import Transaction from '@/components/Transaction.vue'
import Loader from '@/components/Loader.vue'
import Links from '@/components/Links.vue'
import { LOAD_USER_INFO, LOAD_BRIGHT_ID } from '@/store/action-types'
import { waitForTransaction } from '@/utils/contracts'

interface BrightIDStep {
  page: 'connect' | 'registration'
  name: string
}

@Component({
  components: {
    ProgressBar,
    Transaction,
    Loader,
    Links,
  },
})
export default class VerifyView extends Vue {
  steps: Array<BrightIDStep> = [
    { page: 'connect', name: 'Connect' },
    { page: 'registration', name: 'Get registered' },
  ]

  appLink = ''
  appLinkQrCode = ''

  registrationTxHash = ''
  registrationTxError = ''

  loadingTx = false

  get currentUser(): User {
    return this.$store.state.currentUser
  }

  get brightId(): BrightId | undefined {
    return this.currentUser?.brightId
  }

  get currentStep(): number {
    if (!this.brightId || !this.brightId.isVerified) {
      return 0
    }

    if (!this.currentUser?.isRegistered) {
      return 1
    }

    // This means the user is registered
    return -1
  }

  async created() {
    if (
      !this.currentUser?.walletAddress ||
      this.$store.getters.hasContributionPhaseEnded
    ) {
      this.$router.replace({ name: 'verify' })
    }

    // make sure BrightId status is availabel before page load
    await this.loadBrightId()

    // redirect to the verify success page if the user is registered
    if (this.currentStep < 0) {
      this.$router.replace({ name: 'verified' })
    }
  }

  mounted() {
    if (this.currentUser && !this.brightId?.isVerified) {
      // Present app link and QR code
      this.appLink = getBrightIdUniversalLink(this.currentUser.walletAddress)
      const qrcodeLink = getBrightIdLink(this.currentUser.walletAddress)
      QRCode.toDataURL(qrcodeLink, (error, url: string) => {
        if (!error) {
          this.appLinkQrCode = url
        }
      })
      this.waitUntil(() => this.brightId?.isVerified)
    }
  }

  @Watch('currentUser')
  logoutUser() {
    if (!this.currentUser?.walletAddress) {
      this.$router.replace({ name: 'verify' })
    }
  }

  async register() {
    const { userRegistryAddress } = this.$store.getters
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

  /**
   * Start polling brightId state until the condition is met
   */
  private async waitUntil(isConditionMetFn, intervalTime = 5000) {
    let isConditionMet = false

    const checkVerification = async () => {
      await this.loadBrightId()
      isConditionMet = isConditionMetFn()

      if (!isConditionMet) {
        setTimeout(async () => {
          await checkVerification()
        }, intervalTime)
      }
    }
    await checkVerification()
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

.cancel-link {
  position: sticky;
  top: 0px;
  color: var(--error-color);
  text-decoration: underline;
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
