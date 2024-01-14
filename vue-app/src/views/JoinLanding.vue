<template>
  <div id="join-landing">
    <div class="gradient">
      <div class="hero">
        <image-responsive title="core" />
      </div>
    </div>

    <round-status-banner />

    <div class="breadcrumbs">
      <breadcrumbs />
    </div>
    <div class="content" v-if="loading || !isAppReady">
      <h1>{{ $t('joinLanding.loading') }}</h1>
      <loader />
    </div>

    <div class="content" v-else-if="recipientJoinDeadline && !isRoundJoinPhase">
      <div class="big-emoji">☹</div>
      <h1>{{ $t('joinLanding.closed.h1') }}</h1>
      <div id="subtitle" class="subtitle">
        {{ $t('joinLanding.closed.subtitle1') }}
      </div>
      <div class="subtitle mt2" id="subtitle">
        {{ $t('joinLanding.check_out_these') }}
        <links to="https://ethereum.org/en/community/grants/">{{
          $t('joinLanding.other_ways_to_source_funding')
        }}</links
        >{{ $t('joinLanding.or_follow_us_on_twitter') }}
        <links to="https://twitter.com/clrfund">@clrfund</links>
      </div>
      <div class="btn-container">
        <links to="/" class="btn-primary">{{ $t('home') }}</links>
      </div>
    </div>

    <div class="content" v-else-if="isRoundFull">
      <div class="big-emoji">☹</div>
      <h1>{{ $t('joinLanding.full.h1') }}</h1>
      <div id="subtitle" class="subtitle">
        {{ $t('joinLanding.full.subtitle1') }}
      </div>
      <div class="subtitle mt2" id="subtitle">
        {{ $t('joinLanding.check_out_these') }}
        <links to="https://ethereum.org/en/community/grants/">{{
          $t('joinLanding.other_ways_to_source_funding')
        }}</links
        >{{ $t('joinLanding.or_follow_us_on_twitter') }}
        <links to="https://twitter.com/clrfund">@clrfund</links>
      </div>
      <div class="btn-container">
        <links to="/" class="btn-primary">{{ $t('home') }}</links>
        <links to="/about" class="btn-secondary">{{ $t('more_on_maci') }}</links>
      </div>
    </div>

    <div class="content" v-else-if="currentRound">
      <h1>{{ $t('joinLanding.open.h1') }}</h1>
      <div class="subtitle">
        {{ $t('joinLanding.need_info_about_your_project') }}
        <strong>{{ formatAmount(deposit) }} {{ depositToken }}</strong
        >{{ $t('joinLanding.security_deposit') }}
      </div>
      <div class="subtitle mt2">
        {{
          $t('joinLanding.cap_on_projects', {
            maxRecipients: maxRecipients,
          })
        }}
      </div>
      <div class="info-boxes">
        <div class="apply-callout">
          <div class="countdown-label caps">
            {{ $t('joinLanding.open.div1') }}
          </div>
          <div class="countdown caps">
            <time-left v-if="recipientJoinDeadline" valueClass="none" unitClass="none" :date="recipientJoinDeadline" />
          </div>
        </div>
        <div class="apply-callout">
          <div class="countdown-label caps">
            {{ $t('joinLanding.time_to_complete') }}
          </div>
          <div class="countdown-label caps">
            {{ $t('joinLanding.15_minutes_ish') }}
          </div>
        </div>
        <div v-if="isRoundFillingUp" class="apply-callout-warning">
          <div class="filling-up-container">
            <div class="countdown caps">
              {{
                $t('joinLanding.open.div4', {
                  spacesRemainingString: spacesRemainingString,
                })
              }}
            </div>
            <div class="dropdown">
              <img class="icon" @click="openTooltip" src="@/assets/info.svg" />
              <div id="myTooltip" class="hidden button-menu">
                {{ $t('joinLanding.open.div5') }}
                <links to="/about/maci">{{ $t('more_on_maci') }}</links>
              </div>
            </div>
          </div>
          <p class="warning-text">
            {{ $t('joinLanding.open.p1') }}
          </p>
        </div>
      </div>
      <div class="btn-container">
        <button class="btn-secondary" @click="toggleCriteria">
          {{ $t('joinLanding.see_round_criteria') }}
        </button>
        <links to="/join/project" class="btn-primary">{{ $t('add_project') }}</links>
      </div>
    </div>

    <div class="content" v-else>
      <h1>{{ $t('joinLanding.join.h1') }}</h1>
      <div class="subtitle">
        {{ $t('joinLanding.need_info_about_your_project') }}
        <strong>{{ formatAmount(deposit) }} {{ depositToken }}</strong
        >{{ $t('joinLanding.security_deposit') }}
      </div>
      <div class="subtitle mt2">
        {{ $t('joinLanding.cap_on_projects', { maxRecipients: maxRecipients }) }}
      </div>
      <div class="info-boxes">
        <div class="apply-callout">
          <div class="countdown-label caps">
            {{ $t('joinLanding.time_to_complete') }}
          </div>
          <div class="countdown caps">
            {{ $t('joinLanding.15_minutes_ish') }}
          </div>
        </div>
      </div>
      <div class="btn-container">
        <button class="btn-secondary" @click="toggleCriteria">
          {{ $t('joinLanding.see_round_criteria') }}
        </button>
        <links to="/join/project" class="btn-primary">{{ $t('add_project') }}</links>
      </div>
    </div>

    <criteria-modal v-if="showCriteriaPanel" @close="toggleCriteria" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import type { RegistryInfo } from '@/api/recipient-registry-optimistic'
import Loader from '@/components/Loader.vue'
import CriteriaModal from '@/components/CriteriaModal.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import Links from '@/components/Links.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'

import { getCurrentRound } from '@/api/round'
import { formatAmount as _formatAmount } from '@/utils/amounts'
import { useAppStore, useRecipientStore } from '@/stores'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { maxRecipients, isMessageLimitReached, isRoundJoinPhase, recipientJoinDeadline, isAppReady } =
  storeToRefs(appStore)
const recipientStore = useRecipientStore()
const { recipientRegistryInfo } = storeToRefs(recipientStore)

const currentRound = ref<string | null>(null)
const loading = ref(true)
const showCriteriaPanel = ref(false)

const links = computed<Array<{ link: string; url: string }>>(() => [{ link: 'join', url: '/join' }])

const registryInfo = computed<RegistryInfo | null>(() => recipientRegistryInfo.value)

const deposit = computed<bigint | undefined>(() => registryInfo.value?.deposit)
const depositToken = computed<string | null>(() => registryInfo.value?.depositToken || null)
const spacesRemaining = computed(() => {
  // eslint-disable-next-line
  if (!appStore.currentRound || !registryInfo.value) {
    return null
  }
  return appStore.currentRound.maxRecipients - registryInfo.value.recipientCount
})

const isRoundFull = computed(() => {
  if (spacesRemaining.value === null) {
    return false
  }
  return spacesRemaining.value === 0 || isMessageLimitReached.value
})

const isRoundFillingUp = computed(() => {
  if (spacesRemaining.value === null) {
    return false
  }
  return spacesRemaining.value < 20
})

const spacesRemainingString = computed(() =>
  spacesRemaining.value === 1 ? '1 space' : `${spacesRemaining.value} spaces`,
)

onMounted(async () => {
  currentRound.value = await getCurrentRound()
  loading.value = false
})

function openTooltip(): void {
  document.getElementById('myTooltip')?.classList.toggle('hidden')
}

function toggleCriteria(): void {
  showCriteriaPanel.value = !showCriteriaPanel.value
}

function formatAmount(value?: bigint): string {
  if (!value) return ''
  return _formatAmount(value, 18)
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

h1 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 40px;
  line-height: 120%;
}

.gradient {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  background: var(--bg-primary-color);

  .hero {
    position: fixed;
    top: 0;
    right: 0;
    height: 100%;
    width: 100%;
    background: var(--bg-primary-color);
    @media (max-width: $breakpoint-m) {
      width: 100%;
      padding-bottom: 0rem;
    }

    img {
      position: absolute;
      bottom: 0;
      right: calc(-700px + 50vw);
      max-width: 88%;
      max-height: 100%;

      @media (max-width: $breakpoint-m) {
        right: 1rem;
        width: 100%;
      }
    }
  }
}

.breadcrumbs {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  padding-left: $content-space;
  margin-left: 2rem;
  width: min(100%, 512px);
}

.content {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  padding: $content-space;
  margin-left: 2rem;
  width: min(100%, 512px);
  @media (max-width: $breakpoint-m) {
    width: 100%;
    margin: 0;
    padding-bottom: 35vw;
  }
}

.countdown {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 24px;
  letter-spacing: -0.015em;
}

.countdown-label {
  font-family: Glacial Indifference;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 21px;
  letter-spacing: 6px;
  text-align: left;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 20px;
}

.apply-callout {
  background: var(--bg-secondary-color);
  border: 2px solid var(--border-color);
  box-sizing: border-box;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  &:first-of-type {
    margin-top: 2rem;
  }
}

.icon {
  width: 16px;
  height: 16px;
  filter: var(--img-filter, invert(0.7));
}

.apply-callout-warning {
  background: var(--warning-background);
  border: 2px solid var(--warning-border);
  box-sizing: border-box;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.filling-up-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.warning-text {
  margin-bottom: 0;
  color: var(--warning-color);
}

.info-boxes {
  margin-bottom: 2rem;
}

.button-menu {
  flex-direction: column;
  position: absolute;
  top: 2rem;
  right: 0.5rem;
  background: var(--bg-secondary-color);
  border: 1px solid rgba($border-light, 0.3);
  border-radius: 0.5rem;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 1;
  cursor: pointer;
  padding: 1rem 0.25rem;
  text-align: center;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.show {
  display: flex;
}

.btn-container {
  margin-top: 2.5rem;
}
</style>
