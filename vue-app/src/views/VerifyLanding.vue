<template>
  <div>
    <round-status-banner v-if="currentRound" />
    <loader v-if="loading" />
    <div v-if="!loading">
      <div class="gradient">
        <div class="hero">
          <image-responsive title="newrings" />
        </div>
      </div>
      <div class="content">
        <breadcrumbs />
        <div class="flex-title">
          <h1>{{ $t('verifyLanding.h1') }}</h1>
        </div>
        <div class="subtitle">
          {{ $t('verifyLanding.subtitle') }}
        </div>
        <h2>
          {{ $t('verifyLanding.h2') }}
        </h2>
        <ul>
          <li>
            {{ $t('verifyLanding.li1_t1') }}
            <a href="https://apps.apple.com/us/app/brightid/id1428946820" target="_blank">
              {{ $t('verifyLanding.li1_link1') }}</a
            >
            {{ $t('verifyLanding.li1_t2') }}
            <a href="https://play.google.com/store/apps/details?id=org.brightid" target="_blank">{{
              $t('verifyLanding.li1_link2')
            }}</a>
          </li>
          <li>
            {{ $t('verifyLanding.join') }}
            <links to="https://meet.brightid.org">{{ $t('verifyLanding.brightid_party_link') }}</links>
            {{ $t('verifyLanding.get_verified') }}
          </li>
          <li>
            {{ $t('verifyLanding.li_wallet') }}
            {{ $t('verifyLanding.unitap_gas_tokens')
            }}<links to="https://unitap.app/">{{ $t('verifyLanding.unitap_link') }}</links
            >{{ $t('verifyLanding.unitap_extra_text') }}
          </li>
        </ul>
        <links to="/about/sybil-resistance">{{ $t('verifyLanding.link1') }}</links>
        <div v-if="isRoundOver" class="warning-message">
          {{ $t('verifyLanding.div2') }}
        </div>
        <div v-else-if="isRoundFull" class="warning-message">
          {{ $t('verifyLanding.div3') }}
        </div>
        <div class="btn-container mt2">
          <div v-if="!isRoundOver">
            <wallet-widget v-if="!currentUser" :isActionButton="true" :fullWidthMobile="true" />
            <button v-if="showBrightIdButton" @click="gotoVerify" class="btn-primary">
              {{ $t('verifyLanding.link2') }}
            </button>
          </div>
          <links to="/projects" class="btn-secondary">{{ $t('verifyLanding.link3') }}</links>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { getCurrentRound } from '@/api/round'

import Breadcrumbs from '@/components/Breadcrumbs.vue'
import Links from '@/components/Links.vue'
import Loader from '@/components/Loader.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import WalletWidget from '@/components/WalletWidget.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'
import { useAppStore, useUserStore } from '@/stores'
import { useRouter } from 'vue-router'

const router = useRouter()
const appStore = useAppStore()
const { isRoundContributorLimitReached, hasContributionPhaseEnded } = storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const loading = ref(true)
const currentRound = ref<string | null>(null)
const isRequestingSignature = ref(false)

onMounted(async () => {
  currentRound.value = await getCurrentRound()
  loading.value = false
})

const isRoundFull = computed(() => isRoundContributorLimitReached.value)
const isRoundOver = computed(() => hasContributionPhaseEnded.value)
const showBrightIdButton = computed(() => currentUser.value?.isRegistered === false)

async function gotoVerify() {
  if (currentUser.value && !currentUser.value.encryptionKey) {
    try {
      isRequestingSignature.value = true
      await userStore.requestSignature()
      isRequestingSignature.value = false
    } catch (err) {
      isRequestingSignature.value = false
      return
    }
  }
  router.push({ name: 'verify-step', params: { step: 'connect' } })
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.emoji {
  font-size: 40px;
}

h1 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 40px;
  line-height: 120%;
}

h2 {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 24px;
  letter-spacing: -0.015em;
}

p {
  font-size: 16px;
  line-height: 30px;
}

li {
  font-size: 16px;
  line-height: 30px;
}

ul {
  padding-left: 1.5rem;
}

.gradient {
  background: var(--bg-primary-color);
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;

  .hero {
    display: flex;
    position: fixed;
    top: 0;
    right: 0;
    height: 100%;
    width: 100%;
    @media (max-width: $breakpoint-m) {
      padding: 2rem 0rem;
      padding-bottom: 0rem;
    }

    img {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 66%;
      @media (max-width: $breakpoint-m) {
        right: 0;
        width: 100%;
      }
    }
  }
}
.content {
  position: relative;
  z-index: 1;
  padding: $content-space;
  width: min(100%, 512px);
  margin: 2rem;
  box-sizing: border-box;
  @media (max-width: $breakpoint-m) {
    width: 100%;
    margin: 0;
    padding-bottom: 35vw;
  }

  @media (max-width: $breakpoint-s) {
    @include gradientBackground(
      171.34deg,
      rgba(var(--shadow-dark-rgb), 0.8),
      63.5%,
      rgba(var(--shadow-light-rgb), 0),
      78.75%
    );
  }

  .flex-title {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;

    img {
      width: 1rem;
      height: 1rem;
      position: relative;
      right: 0;
    }
  }
}

.subtitle {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.icon {
  width: 1rem;
  height: 1rem;
  position: relative;
}

.join-message {
  border: 1px solid $clr-green;
  background: var(--bg-primary-color);
  border-radius: 1rem;
  padding: 1rem;
  margin: 1rem 0 0;
  color: $clr-green;
  font-size: 14px;
}

.warning-message {
  border: 1px solid var(--error-color);
  background: var(--bg-primary-color);
  border-radius: 1rem;
  padding: 1rem;
  margin: 1rem 0 0;
  color: var(--error-color);
  font-size: 14px;
}

.info-icon {
  margin-left: 0.5rem;
}
</style>
