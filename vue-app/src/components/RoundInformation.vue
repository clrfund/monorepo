<template>
  <div class="projects">
    <div class="round-info">
      <div class="image-wrapper">
        <image-responsive title="docking" height="100%" />
      </div>
      <template v-if="roundInfo">
        <div class="round">
          <div class="round-title-bar">
            <h2 class="round-title">{{ operator }}</h2>
            <v-dropdown :distance="6" class="verified-container" theme="contract-popover">
              <div class="verified">
                <img src="@/assets/verified.svg" />
              </div>
              <template #popper>
                <div class="contract-popover">
                  <div class="contract-address">
                    {{ roundInfo.fundingRoundAddress }}
                  </div>
                  <links :to="blockExplorer.url">{{
                    $t('roundInfo.link1', {
                      blockExplorer: blockExplorer.label,
                    })
                  }}</links>
                </div>
              </template>
            </v-dropdown>
          </div>
          <div class="status" v-if="isRoundCancelled">
            <div class="circle closed" />
            {{ $t('roundInfo.div1') }}
          </div>
          <div class="status" v-else-if="isCurrentRound && !isRoundFinalized && !isRoundTallying">
            <div class="circle open-pulse" />
            {{ $t('roundInfo.div2') }}
          </div>
          <div v-else class="status">
            <div class="circle closed" />
            {{ $t('roundInfo.div3') }}
          </div>
        </div>
        <div :class="{ hidden: !(showNotice && haveNotice) }" class="round-notice">
          <span class="bold-all-caps">
            <p>{{ $t('roundInfo.p1') }}</p>
          </span>
          <p>
            {{ $t('roundInfo.p2') }}
          </p>
          <p v-if="isMaxMessagesReached">
            {{ $t('roundInfo.max_messages_reached') }}
          </p>
          <p v-if="roundInfo.blogUrl">
            {{ $t('roundInfo.more') }}
            <links :to="roundInfo.blogUrl">{{ roundInfo.blogUrl }}</links>
          </p>

          <div class="dismiss-btn" @click="toggleNotice">
            {{ $t('roundInfo.div4') }}
          </div>
        </div>
        <template v-if="isCurrentRound">
          <div class="round-info-item" v-if="isRoundJoinOnlyPhase">
            <div class="full-width">
              <div class="round-info-item-top">
                <div class="round-info-title">{{ $t('roundInfo.div5') }}</div>
              </div>
            </div>
            <div class="round-info-value">
              <time-left v-if="recipientJoinDeadline" :date="recipientJoinDeadline" />
            </div>
          </div>
          <div v-else-if="isRoundContributionPhase && !hasUserContributed" class="round-info-item">
            <div class="full-width">
              <div class="round-info-item-top">
                <div class="round-info-title">{{ $t('roundInfo.div6') }}</div>
                <div
                  v-tooltip="{
                    content: $t('roundInfo.tooltip1'),
                  }"
                >
                  <img width="16" src="@/assets/info.svg" />
                </div>
              </div>
            </div>
            <div class="round-info-value" :title="$t('roundInfo.div7') + formatDate(roundInfo.signUpDeadline)">
              <time-left :date="roundInfo.signUpDeadline" />
            </div>
          </div>
          <div v-else-if="isRoundReallocationPhase || canUserReallocate" class="round-info-item">
            <div class="full-width">
              <div class="round-info-item-top">
                <div class="round-info-title">
                  {{ hasUserContributed ? $t('roundInfo.div8_1') : $t('roundInfo.div8_2') }}
                </div>
                <div
                  v-if="hasUserContributed"
                  v-tooltip="{
                    content: $t('roundInfo.tooltip2'),
                  }"
                >
                  <img width="16" src="@/assets/info.svg" />
                </div>
                <div
                  v-else-if="!currentUser"
                  v-tooltip="{
                    content: $t('roundInfo.tooltip3'),
                  }"
                >
                  <img width="16" src="@/assets/info.svg" />
                </div>
                <div
                  v-else
                  v-tooltip="{
                    content: $t('roundInfo.tooltip4'),
                  }"
                >
                  <img width="16" src="@/assets/info.svg" />
                </div>
              </div>
              <div class="message" v-if="!hasUserContributed">
                {{ $t('roundInfo.div9') }}
              </div>
              <div
                v-else
                class="round-info-value"
                :title="$t('roundInfo.div10') + formatDate(roundInfo.votingDeadline)"
              >
                <div class="round-info-value">
                  <time-left :date="roundInfo.votingDeadline" />
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="isRoundTallying" class="round-info-item">
            <div class="full-width">
              <div class="round-info-item-top">
                <div class="round-info-title">{{ $t('roundInfo.div11') }}</div>
                <img
                  v-tooltip="{
                    content: $t('roundInfo.tooltip5'),
                  }"
                  width="16px"
                  src="@/assets/info.svg"
                />
              </div>
              <div class="round-info-value">
                <div class="message">{{ $t('roundInfo.div12') }}</div>
              </div>
            </div>
          </div>
          <div v-else-if="isRoundFinalized" class="round-info-item">
            <div class="full-width">
              <div class="round-info-item-top">
                <div class="round-info-title">{{ $t('roundInfo.div13') }}</div>
                <div
                  v-tooltip="{
                    content: $t('roundInfo.tooltip6'),
                  }"
                >
                  <img width="16" src="@/assets/info.svg" />
                </div>
              </div>
              <div class="round-info-value">
                <div class="message">{{ $t('roundInfo.div14') }}</div>
              </div>
            </div>
          </div>
        </template>
        <div v-if="roundInfo && hasDateElapsed(roundInfo.votingDeadline)" class="round-info-item">
          <div class="round-info-title">{{ $t('roundInfo.round_period') }}</div>
          <div class="round-info-value">
            <date-range :start-date="roundInfo.startTime" :end-date="roundInfo.votingDeadline" />
          </div>
        </div>
        <div class="round-value-info">
          <div class="round-value-info-item">
            <div class="full-width">
              <div class="round-info-item-top">
                <div class="round-info-title">{{ $t('roundInfo.div15') }}</div>
                <div
                  v-tooltip="{
                    content: $t('roundInfo.tooltip7'),
                  }"
                >
                  <img width="16" src="@/assets/info.svg" />
                </div>
              </div>
              <div class="round-info-value">
                <div class="value large">{{ formatTotalInRound }}</div>
                <div class="unit">{{ roundInfo.nativeTokenSymbol }}</div>
              </div>
            </div>
          </div>
          <div class="round-info-sub-item">
            <div class="round-info-item-top">
              <div class="round-info-title">{{ $t('roundInfo.div16') }}</div>
              <div
                v-tooltip="{
                  content: $t('roundInfo.tooltip8'),
                }"
              >
                <img width="16" src="@/assets/info.svg" />
              </div>
              <div
                v-if="isCurrentRound && !isRoundFinalized && !isRoundTallying && !isRoundCancelled"
                v-tooltip="$t('roundInfo.tooltip9')"
                class="add-link"
                @click="addMatchingFunds"
              >
                <img src="@/assets/add.svg" width="16px" />
                <span class="add-funds-link">{{ $t('roundInfo.span1') }}</span>
              </div>
            </div>

            <div class="round-info-value">
              <div class="value">
                {{ formatAmount(roundInfo.matchingPool) }}
              </div>
              <div class="unit">{{ roundInfo.nativeTokenSymbol }}</div>
            </div>
          </div>
          <div class="round-info-sub-item">
            <div>
              <div class="round-info-title">{{ $t('roundInfo.div17') }}</div>
              <div class="round-info-value">
                <div class="value">
                  {{ formatAmount(roundInfo.contributions) }}
                </div>
                <div class="unit">{{ roundInfo.nativeTokenSymbol }}</div>
              </div>
            </div>
          </div>
          <div class="round-info-sub-item">
            <div>
              <div class="round-info-title">{{ $t('roundInfo.div18') }}</div>
              <div class="round-info-value">
                <div class="value">{{ roundInfo.contributors }}</div>
                <div class="unit">
                  {{ $t('roundInfo.div19') }}{{ roundInfo.contributors > 1 ? $t('roundInfo.pluralism') : '' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="!roundInfo && !isLoading">
        <div class="round-info-item">
          <div class="full-width">
            <div class="round-info-item-top">
              <div class="round-info-title">{{ $t('roundInfo.div20') }}</div>
            </div>
          </div>
          <div class="round-announcement-info">
            {{ $t('roundInfo.div21') }}
          </div>
        </div>
        <div class="round-value-info">
          <div class="round-info-sub-item">
            <div class="round-info-item-top">
              <div class="round-info-title">{{ $t('roundInfo.div16') }}</div>
              <div
                v-tooltip="{
                  content: $t('roundInfo.tooltip8'),
                }"
              >
                <img width="16" src="@/assets/info.svg" />
              </div>
              <div v-tooltip="$t('roundInfo.tooltip9')" class="add-link" @click="addMatchingFunds">
                <img src="@/assets/add.svg" width="16px" />
                <span class="add-funds-link">{{ $t('roundInfo.span1') }}</span>
              </div>
            </div>
            <div class="round-info-value">
              <div class="value">
                {{ formatAmount(matchingPool) }}
              </div>
              <div class="unit">{{ nativeTokenSymbol }}</div>
            </div>
          </div>
        </div>
      </template>
      <loader v-if="isLoading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { DateTime } from 'luxon'
import { hasDateElapsed } from '@/utils/dates'
import { type RoundInfo, getRoundInfo, getLeaderboardRoundInfo } from '@/api/round'
import { chain } from '@/api/core'
import { lsGet, lsSet } from '@/utils/localStorage'
import { formatAmount as _formatAmount } from '@/utils/amounts'
import MatchingFundsModal from '@/components/MatchingFundsModal.vue'
import Loader from '@/components/Loader.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import Links from '@/components/Links.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'
import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useModal } from 'vue-final-modal'
import WalletModal from './WalletModal.vue'
import { getRouteParamValue } from '@/utils/route'

const showNotice = ref(false)
const appStore = useAppStore()
const route = useRoute()
// state
const isLoading = ref(true)
const roundInfo = ref<RoundInfo | null>(null)
const {
  operator,
  currentRoundAddress,
  currentRound,
  isRoundFinalized,
  isRoundTallying,
  hasUserContributed,
  isRoundReallocationPhase,
  canUserReallocate,
  recipientJoinDeadline,
  isRoundContributionPhase,
  nativeTokenSymbol,
  nativeTokenDecimals,
  matchingPool,
} = storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const lsIsNoticeHiddenKey = computed(() => `${roundInfo.value?.fundingRoundAddress}.is-notice-hidden`)
const isRoundCancelled = computed(() => appStore.isRoundCancelled(roundInfo.value))
const isMaxMessagesReached = computed(() => (!roundInfo.value ? true : false))
const isCurrentRound = computed(() => {
  const roundAddress = roundInfo.value?.fundingRoundAddress || ''
  return appStore.isCurrentRound(roundAddress)
})

const formatTotalInRound = computed(() => {
  if (!roundInfo.value) {
    return ''
  }

  const { contributions, matchingPool } = roundInfo.value
  const totalInRound = contributions + matchingPool

  return formatAmount(totalInRound)
})

const haveNotice = computed(() => {
  return (isCurrentRound.value && isMaxMessagesReached.value) || Boolean(roundInfo.value?.blogUrl)
})

onMounted(async () => {
  await loadRoundInfo()
})

// Gets local storage key to look up if user has dismissed round notice (if message cap exceeded)
// Key specific to each round via round address
const roundAddress = computed(() => (route.params.address as string) || currentRoundAddress.value)
watch(roundAddress, async () => {
  await loadRoundInfo()
})

async function loadRoundInfo() {
  roundInfo.value = null
  isLoading.value = true
  if (roundAddress.value) {
    const routeName = route.name?.toString() || ''
    try {
      if (routeName.startsWith('leaderboard')) {
        const network = getRouteParamValue(route.params.network)
        roundInfo.value = await getLeaderboardRoundInfo(roundAddress.value, network)
      } else {
        roundInfo.value = await getRoundInfo(roundAddress.value, currentRound.value)
      }
    } catch (err) {
      /* eslint-disable-next-line no-console */
      console.warn('Failed to get round information', roundAddress.value, err)
    }
    showNotice.value = !lsGet(lsIsNoticeHiddenKey.value, false)
  }
  isLoading.value = false
}

function toggleNotice() {
  showNotice.value = !showNotice.value
  lsSet(lsIsNoticeHiddenKey.value, !showNotice.value)
}

const isRoundJoinOnlyPhase = computed(() => isCurrentRound.value && appStore.isRoundJoinOnlyPhase)

function formatDate(value: DateTime): string {
  return value.toLocaleString(DateTime.DATETIME_SHORT) || ''
}

function formatAmount(value: bigint | string): string {
  if (!nativeTokenDecimals.value) {
    return ''
  }

  return _formatAmount(value, nativeTokenDecimals.value, 4)
}

function addMatchingFunds(): void {
  if (!currentUser.value) {
    const { open: openWallet, close: closeWallet } = useModal({
      component: WalletModal,
      attrs: {
        onClose() {
          closeWallet()
          if (currentUser.value?.walletAddress) {
            addMatchingFunds()
          }
        },
      },
    })
    openWallet()
    return
  }

  const { open: openMatchingFundModal, close } = useModal({
    component: MatchingFundsModal,
    attrs: {
      onClose() {
        close()
        // Reload matching pool size
        appStore.loadRoundInfo()
        appStore.loadClrFundInfo()
      },
    },
  })

  openMatchingFundModal()
}

const blockExplorer = computed(() => ({
  label: chain.explorerLabel,
  url: `${chain.explorer}/address/${roundInfo.value?.fundingRoundAddress}`,
}))
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.image-wrapper {
  border-radius: 8px;
  background: var(--bg-gradient);
  height: 160px;
  width: 100%;
  display: flex;
  justify-content: center;
}
.image-wrapper img {
  mix-blend-mode: exclusion;
  transform: rotate(15deg);
}
.round {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.round-title-bar {
  display: flex;
  align-items: center;
}
.round-title {
  line-height: 120%;
  margin: 0;
}
.verified-container {
  align-self: flex-end;
}
.verified {
  img {
    filter: var(--img-filter, invert(0.3));
  }
}
.contract-address {
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
  margin-bottom: 0.5rem;
}
.circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
}
.closed {
  width: 12px;
  height: 12px;
  background: var(--bg-light-color);
}
.open-pulse {
  animation: pulse-animation 2s infinite ease-out;
  background: $clr-green;
}
@keyframes pulse-animation {
  0% {
    box-shadow: 0 0 0 0px $idle-color;
  }
  50% {
    box-shadow: 0 0 0 2.5px $clr-green;
  }
  100% {
    box-shadow: 0 0 0 5px $clr-pink;
  }
}
.projects {
  display: flex;
  justify-content: center;
}
.round-info {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1.5rem;
  margin-top: 1rem;
  max-width: 800px;
  @media (max-width: $breakpoint-m) {
    padding: 1rem;
    padding-bottom: 4rem;
  }
}
.round-value-info {
  width: 100%;
  display: grid;
  align-items: center;
  margin-bottom: 3rem;
  border-radius: 0.5rem;
  img {
    opacity: 0.6;
  }
  & > div {
    box-shadow: inset 0px -1px 0px #7375a6;
    &:first-of-type {
      border-radius: 0.5rem 0.5rem 0 0;
    }
    &:last-of-type {
      border-radius: 0 0 0.5rem 0.5rem;
      box-shadow: none;
    }
  }
}
.round-value-info-item {
  display: flex;
  flex: 1 0 auto;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-light-highlight);
  padding: 1rem;
}
.round-info-item {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  justify-content: space-between;
  align-items: flex-start;
  background: var(--bg-light-highlight);
  padding: 1rem;
  border-radius: 0.5rem;
  box-sizing: border-box;
  width: 100%;
  img {
    opacity: 0.6;
  }
}
.round-info-item-top {
  width: 100%;
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}
.round-info-sub-item {
  flex: 1 0 10%;
  background: var(--bg-secondary-highlight);
  padding: 1rem;
  img {
    opacity: 0.6;
  }
}
.round-info-title {
  color: var(--text-color);
  font-size: 14px;
  font-weight: 400;
  line-height: 120%;
  text-transform: uppercase;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.round-info-value {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  .value {
    font-size: 24px;
    font-family: 'Glacial Indifference', sans-serif;
    color: var(--text-color);
    font-weight: 700;
    line-height: 120%;
    &.large {
      font-size: 32px;
      line-height: 120%;
    }
    &.extra {
      font-size: 32px;
      font-family: 'Glacial Indifference', sans-serif;
      color: var(--text-color);
      line-height: 120%;
    }
  }
  .unit {
    color: var(--text-color);
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 16px;
    font-weight: 600;
    text-transform: uppercase;
    line-height: 150%;
    margin: 0 0.5rem;
    &:last-child {
      margin-right: 0;
    }
  }
}
.round-announcement-info {
  .value {
    font-size: 24px;
    font-family: 'Glacial Indifference', sans-serif;
    color: white;
    font-weight: 700;
    line-height: 120%;
    &.large {
      font-size: 32px;
      line-height: 120%;
    }
    &.extra {
      font-size: 32px;
      font-family: 'Glacial Indifference', sans-serif;
      color: white;
      line-height: 120%;
    }
  }
  .unit {
    color: white;
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 16px;
    font-weight: 600;
    text-transform: uppercase;
    line-height: 150%;
    margin: 0 0.5rem;
    &:last-child {
      margin-right: 0;
    }
  }
}
.message {
  color: var(--text-color);
  font-family: 'Glacial Indifference', sans-serif;
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  line-height: 150%;
}
.add-matching-funds-btn {
  display: inline-block;
  margin-left: 5px;
  img {
    height: 1.8em;
    vertical-align: middle;
  }
}
.project-list {
  box-sizing: border-box;
  margin: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: $content-space;
}
/* @media (max-width: 1500px) {
  .round-info-item:nth-child(2n) {
    break-after: always;
  }
  .round-info-title {
    margin-bottom: calc($content-space / 2);
    font-size: 14px;
  }
} */
.add-link {
  display: flex;
  gap: 0.25rem;
  color: $clr-green;
  margin-left: auto;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
}
.add-funds-link {
  font-size: 14px;
}
.status {
  font-size: 16px;
  display: flex;
  align-items: center;
}
.full-width {
  width: 100%;
}
.round-notice {
  background: var(--warning-background);
  border: 1px solid var(--warning-border);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem 1rem;
  color: var(--warning-color);
  font-size: 14px;
  line-height: 150%;
  font-weight: 500;
  .bold-all-caps {
    text-transform: uppercase;
    font-weight: 600;
  }
  .dismiss-btn {
    @include button(var(--warning-color), none, 1px solid var(--warning-color));
    margin: 0 auto;
    width: fit-content;
    padding: 0.25rem 1.25rem;
  }
}
.hidden {
  display: none;
}
.has-tooltip {
  filter: var(--img-filter, invert(0.7));
}
.contract-popover {
  background-color: var(--bg-primary-color);
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 300px;
  padding: 1rem;
  border: solid 1px var(--border-highlight);
  border-radius: 6px;
  box-shadow: 0 6px 30px #0000001a;
}
</style>
