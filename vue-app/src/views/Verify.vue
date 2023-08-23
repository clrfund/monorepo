<template>
  <div class="container">
    <div class="grid">
      <div class="progress-area desktop">
        <div class="progress-container">
          <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length" />
          <p class="subtitle">
            {{
              $t('verify.subtitle', {
                currentStep: currentStep + 1,
                steps: steps.length,
              })
            }}
          </p>
          <div class="progress-steps">
            <div v-for="(step, stepIndex) in steps" :key="step.page" class="progress-step">
              <template v-if="stepIndex === currentStep">
                <img class="current-step" src="@/assets/current-step.svg" alt="current step" />
                <p v-text="$t(`dynamic.verify.step.${step.page}`)" class="active step" />
              </template>
              <template v-else-if="isStepUnlocked(stepIndex) && isStepValid(stepIndex)">
                <img src="@/assets/green-tick.svg" alt="step complete" />
                <p v-text="$t(`dynamic.verify.step.${step.page}`)" class="step" />
              </template>
              <template v-else>
                <img class="remaining-step" src="@/assets/step-remaining.svg" alt="step remaining" />
                <p v-text="$t(`dynamic.verify.step.${step.page}`)" class="step" />
              </template>
            </div>
          </div>
        </div>
      </div>
      <div class="progress-area mobile">
        <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length" />
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
          <div v-if="currentPage === 'sponsorship'">
            <h2 class="step-title">{{ $t('verify.get_sponsored_header') }}</h2>
            <p>
              {{ $t('verify.get_sponsored_text') }}
            </p>
            <div class="transaction">
              <div>
                <div class="row row-gap">
                  <button
                    type="button"
                    class="btn-action btn-block"
                    @click="selfSponsorAndWait"
                    :disabled="selfSponsorTxHash.length !== 0 || loadingTx"
                  >
                    {{ $t('verify.get_sponsored_cta') }}
                  </button>
                  <button type="button" class="btn-secondary btn-block" @click="skipSponsorship">
                    {{ $t('verify.skip_sponsorship') }}
                  </button>
                </div>
                <div class="error" v-if="sponsorTxError">{{ sponsorTxError }}</div>
              </div>
            </div>
          </div>
          <div v-if="currentPage === 'connect'">
            <h2 class="step-title">{{ $t('verify.h2_1') }}</h2>
            <p>
              {{ $t('verify.p2') }}
            </p>
            <p>
              {{ $t('verify.click_next') }}
            </p>
            <transaction
              class="transaction"
              v-if="autoSponsorError"
              :display-close-btn="false"
              hash=""
              :error="autoSponsorError"
            >
            </transaction>
            <div class="qr">
              <loader v-if="!appLink && !autoSponsorError"></loader>
              <div class="instructions" v-if="appLink">
                <p class="desktop" v-if="appLinkQrCode">
                  {{ $t('verify.p4') }}
                </p>
                <img :src="appLinkQrCode" class="desktop qr-code" />
                <p class="mobile">
                  {{ $t('verify.p5') }}
                </p>
                <div class="mobile">
                  <links class="mobile" :to="appLink">
                    <div class="icon">
                      <img src="@/assets/bright-id.png" />
                    </div>
                    {{ appLink }}
                  </links>
                  <div class="copy-container">
                    <div>{{ $t('verify.copy_link') }}</div>
                    <copy-button :value="appLink" text="link" myClass="inline copy-icon" />
                  </div>
                </div>
                <p class="mobile">
                  <em>
                    {{ $t('verify.p6') }}
                  </em>
                </p>
                <div class="row row-gap qr-code">
                  <button
                    v-if="showBackToSponsorshipButton"
                    type="button"
                    class="btn-action btn-block"
                    @click="backToSponsorship"
                  >
                    {{ $t('verify.previous') }}
                  </button>
                  <button type="button" class="btn-secondary btn-block" @click="checkVerificationStatus">
                    {{ $t('verify.next') }}
                  </button>
                </div>
                <div class="warning-text" v-if="showVerificationStatus">
                  {{ $t('verify.verification_status') }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="currentPage === 'registration'">
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

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ProgressBar from '@/components/ProgressBar.vue'
import QRCode from 'qrcode'
import { getBrightIdLink, getBrightIdUniversalLink, registerUser, selfSponsor, sponsorUser } from '@/api/bright-id'
import { registerSnapshotUser, registerMerkleUser } from '@/api/user'
import Transaction from '@/components/Transaction.vue'
import Loader from '@/components/Loader.vue'
import Links from '@/components/Links.vue'
import { waitForTransaction } from '@/utils/contracts'
import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { UserRegistryType, isBrightIdRequired, brightIdSponsorUrl, userRegistryType } from '@/api/core'
import { assert } from '@/utils/assert'

interface VerificationStep {
  page: 'connect' | 'registration' | 'sponsorship'
}

function getVerificationSteps(): Array<VerificationStep> {
  switch (userRegistryType) {
    case UserRegistryType.BRIGHT_ID:
      return brightIdSponsorUrl
        ? [{ page: 'connect' }, { page: 'registration' }]
        : [{ page: 'sponsorship' }, { page: 'connect' }, { page: 'registration' }]
    default:
      return [{ page: 'registration' }]
  }
}

const steps = getVerificationSteps()
const router = useRouter()
const appStore = useAppStore()

// state
const { hasContributionPhaseEnded, userRegistryAddress } = storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const stepNumbers: { [key: string]: number } = steps.reduce((res, step, index) => {
  res[step.page] = index
  return res
}, {})

const appLink = ref('')
const appLinkQrCode = ref('')
const registrationTxHash = ref('')
const registrationTxError = ref('')
const loadingTx = ref(false)
const isSponsoring = ref(!brightIdSponsorUrl)
const showVerificationStatus = ref(false)
const autoSponsorError = ref('')
const sponsorTxError = ref('')
const selfSponsorTxHash = ref('')

const brightId = computed(() => currentUser.value?.brightId)

const currentStep = computed(() => {
  if (isBrightIdRequired) {
    if (!brightId.value) {
      return 0
    }
    if (isSponsoring.value) {
      return stepNumbers['sponsorship']
    }
    if (!brightId.value.isVerified) {
      return stepNumbers['connect']
    }
  }
  if (!currentUser.value?.isRegistered) {
    return stepNumbers['registration']
  }
  // This means the user is registered
  return -1
})

const currentPage = computed(() => {
  return steps[currentStep.value].page
})

// if the sponsor url is not defined, we are doing self sponsorship, show the button
// to allow users to go back to that page
const showBackToSponsorshipButton = !brightIdSponsorUrl

function backToSponsorship() {
  isSponsoring.value = true
  showVerificationStatus.value = false
}

function skipSponsorship() {
  isSponsoring.value = false
}

async function checkVerificationStatus() {
  showVerificationStatus.value = false
  await userStore.loadBrightID()
  if (!brightId.value?.isVerified) {
    showVerificationStatus.value = true
  }
}

onMounted(async () => {
  // need to have round and user signature before continuing with BrightId verification
  if (!currentUser.value?.walletAddress || !currentUser.value.encryptionKey || hasContributionPhaseEnded.value) {
    router.replace({ name: 'verify' })
  }

  if (isBrightIdRequired) {
    // make sure BrightId status is available before page load
    await userStore.loadBrightID()
  }

  // redirect to the verify success page if the user is registered
  if (currentStep.value < 0) {
    router.replace({ name: 'verified' })
  }

  // mounted
  if (isBrightIdRequired && currentUser.value && !brightId.value?.isVerified) {
    const walletAddress = currentUser.value.walletAddress
    // send sponsorship request if automatic sponsoring is enabled
    if (brightIdSponsorUrl) {
      try {
        const res = await sponsorUser(walletAddress)
        if (!res.hash) {
          autoSponsorError.value = res.error ? res.error : JSON.stringify(res)
          return
        }
      } catch (err) {
        const errorMessage = (err as Error).message
        autoSponsorError.value =
          'Unable to sponsor user. Make sure the brightId node is setup correctly.' + errorMessage
        return
      }
    }

    // Present app link and QR code

    appLink.value = getBrightIdUniversalLink(walletAddress)
    const qrcodeLink = getBrightIdLink(walletAddress)
    QRCode.toDataURL(qrcodeLink, (error, url: string) => {
      if (!error) {
        appLinkQrCode.value = url
      }
    })
  }
})

watch(currentUser, () => {
  if (!currentUser.value?.walletAddress) {
    router.replace({ name: 'verify' })
  }
})

async function selfSponsorAndWait() {
  if (!userRegistryAddress.value) {
    sponsorTxError.value = 'Missing the user registry address'
    return
  }

  const signer = userStore.signer
  loadingTx.value = true
  sponsorTxError.value = ''

  try {
    await waitForTransaction(selfSponsor(userRegistryAddress.value, signer), hash => (selfSponsorTxHash.value = hash))
    isSponsoring.value = false
  } catch (error) {
    sponsorTxError.value = (error as Error).message
  } finally {
    loadingTx.value = false
  }
}

async function register() {
  const signer = userStore.signer

  if (isBrightIdRequired && !brightId.value?.verification) {
    return
  }

  loadingTx.value = true
  registrationTxError.value = ''
  try {
    assert(userRegistryAddress.value, 'Missing the user registry address')
    if (isBrightIdRequired) {
      assert(brightId.value?.verification, 'Missing BrightID verification')
      await waitForTransaction(
        registerUser(userRegistryAddress.value, brightId.value.verification, signer),
        hash => (registrationTxHash.value = hash),
      )
    } else {
      if (userRegistryType === UserRegistryType.SNAPSHOT) {
        await waitForTransaction(
          registerSnapshotUser(userRegistryAddress.value, signer),
          hash => (registrationTxHash.value = hash),
        )
      } else if (userRegistryType === UserRegistryType.MERKLE) {
        await waitForTransaction(
          registerMerkleUser(userRegistryAddress.value, signer),
          hash => (registrationTxHash.value = hash),
        )
      } else {
        throw new Error('Unsupported registry type: ' + userRegistryType)
      }
    }
    loadingTx.value = false
    router.push({
      name: 'verified',
      params: { hash: registrationTxHash.value },
    })
  } catch (error) {
    registrationTxError.value = (error as Error).message
    return
  }
  userStore.loadUserInfo()
}

function isStepValid(step: number): boolean {
  return !!steps[step]
}

function isStepUnlocked(step: number): boolean {
  if (!brightId.value) {
    return false
  }

  const stepName = steps[step].page
  switch (stepName) {
    case 'sponsorship':
      return !isSponsoring.value
    case 'connect':
      return !!currentUser.value?.brightId?.isVerified
    case 'registration':
      // Register
      return !!currentUser.value?.isRegistered
    default:
      return false
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
    background: var(--bg-secondary-color);

    .progress-steps {
      margin-bottom: 1rem;
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
        color: var(--text-body);
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
  .warning-text {
    overflow-wrap: anywhere;
    text-align: center;
    padding: 2rem;
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
.copy-container {
  display: flex;
  justify-content: center;
  flex-direction: row;
}
.row-gap {
  gap: 30px;
}

.error {
  overflow-wrap: break-word;
  margin-top: 2rem;
}
</style>
