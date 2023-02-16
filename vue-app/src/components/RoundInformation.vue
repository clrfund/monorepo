<template>
  <div class="projects">
    <div class="round-info">
      <div class="image-wrapper">
        <image-responsive title="docking" height="100%" />
      </div>
      <template v-if="roundInfo">
        <div class="round">
          <div class="round-title-bar">
            <h2 class="round-title">{{ $store.getters.operator }}</h2>
            <v-popover class="verified-container">
              <div class="verified">
                <img src="@/assets/verified.svg" />
              </div>
              <template slot="popover">
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
            </v-popover>
          </div>
          <div class="status" v-if="isRoundCancelled">
            <div class="circle closed" />
            {{ $t('roundInfo.div1') }}
          </div>
          <div
            class="status"
            v-else-if="
              isCurrentRound &&
              !$store.getters.isRoundFinalized &&
              !$store.getters.isRoundTallying
            "
          >
            <div class="circle open-pulse" />
            {{ $t('roundInfo.div2') }}
          </div>
          <div v-else class="status">
            <div class="circle closed" />
            {{ $t('roundInfo.div3') }}
          </div>
        </div>
        <div
          :class="{ hidden: !(showNotice && haveNotice) }"
          class="round-notice"
        >
          <span class="bold-all-caps">
            <p>{{ $t('roundInfo.p1') }}</p>
          </span>
          <p>
            {{ $t('roundInfo.p2') }}
          </p>
          <p v-if="isMaxMessagesReached">
            {{ $t('roundInfo.max_messages_reached') }}
          </p>
          <p v-if="blogUrl">
            {{ $t('roundInfo.more') }}
            <links :to="blogUrl">{{ blogUrl }}</links>
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
              <time-left :date="$store.getters.recipientJoinDeadline" />
            </div>
          </div>
          <div
            v-else-if="
              $store.getters.isRoundContributionPhase &&
              !$store.getters.hasUserContributed
            "
            class="round-info-item"
          >
            <div class="full-width">
              <div class="round-info-item-top">
                <div class="round-info-title">{{ $t('roundInfo.div6') }}</div>
                <div
                  v-tooltip="{
                    content: $t('roundInfo.tooltip1'),
                    trigger: 'hover click',
                  }"
                >
                  <img width="16px" src="@/assets/info.svg" />
                </div>
              </div>
            </div>
            <div
              class="round-info-value"
              :title="
                $t('roundInfo.div7') + formatDate(roundInfo.signUpDeadline)
              "
            >
              <time-left :date="roundInfo.signUpDeadline" />
            </div>
          </div>
          <div
            v-else-if="
              $store.getters.isRoundReallocationPhase ||
              $store.getters.canUserReallocate
            "
            class="round-info-item"
          >
            <div class="full-width">
              <div class="round-info-item-top">
                <div class="round-info-title">
                  {{
                    $store.getters.hasUserContributed
                      ? $t('roundInfo.div8_1')
                      : $t('roundInfo.div8_2')
                  }}
                </div>
                <div
                  v-if="$store.getters.hasUserContributed"
                  v-tooltip="{
                    content: $t('roundInfo.tooltip2'),
                    trigger: 'hover click',
                  }"
                >
                  <img width="16px" src="@/assets/info.svg" />
                </div>
                <div
                  v-else-if="!$store.state.currentUser"
                  v-tooltip="{
                    content: $t('roundInfo.tooltip3'),
                    trigger: 'hover click',
                  }"
                >
                  <img width="16px" src="@/assets/info.svg" />
                </div>
                <div
                  v-else
                  v-tooltip="{
                    content: $t('roundInfo.tooltip4'),
                    trigger: 'hover click',
                  }"
                >
                  <img width="16px" src="@/assets/info.svg" />
                </div>
              </div>
              <div class="message" v-if="!$store.getters.hasUserContributed">
                {{ $t('roundInfo.div9') }}
              </div>
              <div
                v-else
                class="round-info-value"
                :title="
                  $t('roundInfo.div10') + formatDate(roundInfo.votingDeadline)
                "
              >
                <div class="round-info-value">
                  <time-left :date="roundInfo.votingDeadline" />
                </div>
              </div>
            </div>
          </div>
          <div
            v-else-if="$store.getters.isRoundTallying"
            class="round-info-item"
          >
            <div class="full-width">
              <div class="round-info-item-top">
                <div class="round-info-title">{{ $t('roundInfo.div11') }}</div>
                <img
                  :v-tooltip="{
                    content: $t('roundInfo.tooltip5'),
                    trigger: 'hover click',
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
          <div
            v-else-if="$store.getters.isRoundFinalized"
            class="round-info-item"
          >
            <div class="full-width">
              <div class="round-info-item-top">
                <div class="round-info-title">{{ $t('roundInfo.div13') }}</div>
                <div
                  v-tooltip="{
                    content: $t('roundInfo.tooltip6'),
                    trigger: 'hover click',
                  }"
                >
                  <img width="16px" src="@/assets/info.svg" />
                </div>
              </div>
              <div class="round-info-value">
                <div class="message">{{ $t('roundInfo.div14') }}</div>
              </div>
            </div>
          </div>
        </template>
        <div class="round-value-info">
          <div class="round-value-info-item">
            <div class="full-width">
              <div class="round-info-item-top">
                <div class="round-info-title">{{ $t('roundInfo.div15') }}</div>
                <div
                  v-tooltip="{
                    content: $t('roundInfo.tooltip7'),
                    trigger: 'hover click',
                  }"
                >
                  <img width="16px" src="@/assets/info.svg" />
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
                  trigger: 'hover click',
                }"
              >
                <img width="16px" src="@/assets/info.svg" />
              </div>
              <div
                v-if="
                  isCurrentRound &&
                  !$store.getters.isRoundFinalized &&
                  !$store.getters.isRoundTallying &&
                  !isRoundCancelled
                "
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
                  {{ $t('roundInfo.div19')
                  }}{{
                    roundInfo.contributors > 1 ? $t('roundInfo.pluralism') : ''
                  }}
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
      </template>
      <loader v-if="isLoading" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Watch } from 'vue-property-decorator'
import Component from 'vue-class-component'
import { BigNumber, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'

import { RoundInfo } from '@/api/round'
import { chain } from '@/api/core'

import { lsGet, lsSet } from '@/utils/localStorage'
import { formatAmount } from '@/utils/amounts'
import ProjectListItem from '@/components/ProjectListItem.vue'
import MatchingFundsModal from '@/components/MatchingFundsModal.vue'
import Loader from '@/components/Loader.vue'
import WalletModal from '@/components/WalletModal.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import Links from '@/components/Links.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'
import { LOAD_ROUNDS, LOAD_ROUND_INFO } from '@/store/action-types'

@Component({
  components: {
    ProjectListItem,
    Loader,
    WalletModal,
    TimeLeft,
    Links,
    ImageResponsive,
  },
})
export default class RoundInformation extends Vue {
  isLoading = true
  roundInfo: RoundInfo | null = null
  blogUrl: string | null = null
  showNotice = false

  async created() {
    await this.loadRoundInfo()
  }

  get isRoundCancelled(): boolean {
    return this.$store.getters.isRoundCancelled(this.roundInfo)
  }

  get isMaxMessagesReached(): boolean {
    if (!this.roundInfo) {
      return false
    }

    return this.roundInfo.maxMessages <= this.roundInfo.messages
  }

  get haveNotice(): boolean {
    return (
      (this.isCurrentRound && this.isMaxMessagesReached) ||
      this.blogUrl !== null
    )
  }

  // Gets local storage key to look up if user has dismissed round notice (if message cap exceeded)
  // Key specific to each round via round address
  get lsIsNoticeHiddenKey(): string {
    return `${this.roundInfo?.fundingRoundAddress}.is-notice-hidden`
  }

  get roundAddress(): string | null {
    return this.$route.params?.address || this.$store.state.currentRoundAddress
  }

  @Watch('roundAddress')
  async loadRoundInfo() {
    this.roundInfo = null
    this.isLoading = true
    if (this.roundAddress) {
      if (!this.$store.state.rounds) {
        await this.$store.dispatch(LOAD_ROUNDS)
      }

      const round = await this.$store.state.rounds.getRound(this.roundAddress)
      if (round) {
        this.roundInfo = await round.getRoundInfo(
          this.$store.state.currentRound
        )

        this.blogUrl = round.blogUrl
        this.showNotice = !lsGet(this.lsIsNoticeHiddenKey, false)
      }
    }
    this.isLoading = false
  }

  toggleNotice() {
    this.showNotice = !this.showNotice
    lsSet(this.lsIsNoticeHiddenKey, !this.showNotice)
  }

  get formatTotalInRound(): string {
    if (!this.roundInfo) {
      return ''
    }

    const { contributions, matchingPool } = this.roundInfo
    const totalInRound = contributions.addUnsafe(matchingPool)

    return this.formatAmount(totalInRound)
  }

  get isCurrentRound(): boolean {
    const roundAddress = this.roundInfo?.fundingRoundAddress || ''
    return this.$store.getters.isCurrentRound(roundAddress)
  }

  get isRoundJoinOnlyPhase(): boolean {
    return this.isCurrentRound && this.$store.getters.isRoundJoinOnlyPhase
  }

  formatIntegerPart(value: FixedNumber): string {
    if (value._value === '0.0') {
      return '0'
    }
    const integerPart = value.toString().split('.')[0]
    return integerPart + (value.round(0) === value ? '' : '.')
  }

  formatFractionalPart(value: FixedNumber): string {
    return value._value === '0.0' ? '' : value.toString().split('.')[1]
  }

  formatDate(value: DateTime): string {
    return value.toLocaleString(DateTime.DATETIME_SHORT) || ''
  }

  formatAmount(value: BigNumber | FixedNumber | string): string {
    return formatAmount(value, this.roundInfo?.nativeTokenDecimals, 4)
  }

  addMatchingFunds(): void {
    if (!this.$store.state.currentUser) {
      return this.$modal.show(
        WalletModal,
        {},
        { width: 400, top: 20 },
        {
          // If closed but no user was connected in the event, then this will be closing the WalletModal
          // and dont do anythign else. If closed and a user was connected, call the addMatchingFunds method
          // again to pop open the MatchingFundsModal after the WalletModal.
          closed: () => {
            if (this.$store.state.currentUser) {
              this.addMatchingFunds()
            }
          },
        }
      )
    }

    return this.$modal.show(
      MatchingFundsModal,
      {},
      {},
      {
        closed: () => {
          // Reload matching pool size
          this.$store.dispatch(LOAD_ROUND_INFO)
        },
      }
    )
  }

  get blockExplorer(): { label: string; url: string } {
    return {
      label: chain.explorerLabel,
      url: `${chain.explorer}/address/${this.roundInfo?.fundingRoundAddress}`,
    }
  }
}
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
  background: var(--bg-secondary-color);
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
    box-shadow: inset 0px -1px 0px var(--bg-secondary-color);
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
    margin-bottom: $content-space / 2;
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
  filter: invert(0.7);
}
</style>
