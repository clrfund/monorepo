<template>
  <div class="projects">
    <div class="round-info">
      <div class="image-wrapper">
        <img src="@/assets/docking.png" height="100%" />
      </div>
      <template v-if="currentRound">
        <div class="round">
          <div style="display: flex; align-items: center">
            <h2 style="line-height: 120%; margin: 0">Eth2 CLR</h2>
            <v-popover offset="16">
              <div class="verified">
                <img src="@/assets/verified.svg" />
              </div>
              <template slot="popover">
                <div
                  style="text-overflow: ellipsis; width: 100%; overflow: hidden"
                >
                  {{ currentRound.fundingRoundAddress }}
                </div>
                <a
                  :href="
                    'https://etherscan.io/address/' +
                    currentRound.fundingRoundAddress
                  "
                  target="_blank"
                  rel="noopener"
                  >View on Etherscan</a
                >
              </template>
            </v-popover>
          </div>
          <!-- TODO add logic to status -->
          <div class="status">
            <div class="circle open-pulse" />
            Open
          </div>
        </div>
        <div class="round-info-item" v-if="$store.getters.isRoundJoinOnlyPhase">
          <div style="width: 100%">
            <div style="width: 100%; display: flex; gap: 0.5rem">
              <div class="round-info-title">⏱️ Round opening</div>
            </div>
          </div>
          <div class="round-info-value">
            <div class="value">{{ joinTimeLeft.days }}</div>
            <div class="unit">days</div>
            <div class="value">{{ joinTimeLeft.hours }}</div>
            <div class="unit">hours</div>
          </div>
        </div>
        <div
          v-else-if="
            $store.getters.isRoundContributionPhase &&
            !$store.getters.hasUserContributed
          "
          class="round-info-item"
        >
          <div style="width: 100%">
            <div style="width: 100%; display: flex; gap: 0.5rem">
              <div class="round-info-title">Time left to contribute</div>
              <img
                v-tooltip="{
                  content:
                    'During this phase, you can contribute to your favourite projects.',
                  trigger: 'hover click',
                }"
                width="16px"
                src="@/assets/info.svg"
              />
            </div>
          </div>
          <div
            class="round-info-value"
            :title="
              'Contribution Deadline: ' +
              formatDate(currentRound.signUpDeadline)
            "
          >
            <div class="value" v-if="contributionTimeLeft.days > 0">
              {{ contributionTimeLeft.days }}
            </div>
            <div class="unit" v-if="contributionTimeLeft.days > 0">days</div>
            <div class="value">{{ contributionTimeLeft.hours }}</div>
            <div class="unit">hours</div>
            <div class="value" v-if="contributionTimeLeft.days === 0">
              {{ contributionTimeLeft.minutes }}
            </div>
            <div class="unit" v-if="contributionTimeLeft.days === 0">
              minutes
            </div>
          </div>
        </div>
        <div
          v-else-if="
            $store.getters.isRoundReallocationPhase ||
            $store.getters.canUserReallocate
          "
          class="round-info-item"
        >
          <div style="width: 100%">
            <div style="width: 100%; display: flex; gap: 0.5rem">
              <div class="round-info-title">
                {{
                  $store.getters.hasUserContributed
                    ? 'Time left to reallocate'
                    : 'Round status'
                }}
              </div>
              <img
                v-if="$store.getters.hasUserContributed"
                v-tooltip="{
                  content: `During this phase, you can add/remove projects and change your contribution amounts. You can't make a contribution or increase your overall total.`,
                  trigger: 'hover click',
                }"
                width="16px"
                src="@/assets/info.svg"
              />
              <img
                v-else-if="!this.$store.state.currentUser"
                v-tooltip="{
                  content: `If you've contributed, you can add/remove projects and change your contribution amounts. Please connect your wallet.`,
                  trigger: 'hover click',
                }"
                width="16px"
                src="@/assets/info.svg"
              />
              <img
                v-else
                v-tooltip="{
                  content: `This round has closed for new contributions.`,
                  trigger: 'hover click',
                }"
                width="16px"
                src="@/assets/info.svg"
              />
            </div>
            <div class="message" v-if="!$store.getters.hasUserContributed">
              Closed for contributions
            </div>
            <div
              v-else
              class="round-info-value"
              :title="
                'Reallocation Deadline: ' +
                formatDate(currentRound.votingDeadline)
              "
            >
              <div class="round-info-value">
                <div class="value" v-if="reallocationTimeLeft.days > 0">
                  {{ reallocationTimeLeft.days }}
                </div>
                <div class="unit" v-if="reallocationTimeLeft.days > 0">
                  days
                </div>
                <div class="value">{{ reallocationTimeLeft.hours }}</div>
                <div class="unit">hours</div>
                <div class="value" v-if="reallocationTimeLeft.days === 0">
                  {{ reallocationTimeLeft.minutes }}
                </div>
                <div class="unit" v-if="reallocationTimeLeft.days === 0">
                  minutes
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="$store.getters.isRoundTallying" class="round-info-item">
          <div style="width: 100%">
            <div style="width: 100%; display: flex; gap: 0.5rem">
              <div class="round-info-title" style="margin-bottom: 0.5rem">
                Round status
              </div>
              <img
                v-tooltip="{
                  content: `Our smart contracts are busy figuring out final contribution amounts.`,
                  trigger: 'hover click',
                }"
                width="16px"
                src="@/assets/info.svg"
              />
            </div>
            <div class="round-info-value">
              <div class="message">Tallying all contributions</div>
            </div>
          </div>
        </div>
        <div
          v-else-if="$store.getters.isRoundFinalized"
          class="round-info-item"
        >
          <div style="width: 100%">
            <div style="width: 100%; display: flex; gap: 0.5rem">
              <div class="round-info-title" style="margin-bottom: 0.5rem">
                Round status
              </div>
              <img
                v-tooltip="{
                  content: `If you're a project owner you can now claim your funds!`,
                  trigger: 'hover click',
                }"
                width="16px"
                src="@/assets/info.svg"
              />
            </div>
            <div class="round-info-value">
              <div class="message">Contributions are ready to claim 🎉</div>
            </div>
          </div>
        </div>
        <div class="round-value-info">
          <div class="round-value-info-item">
            <div style="width: 100%">
              <div style="width: 100%; display: flex; gap: 0.5rem">
                <div class="round-info-title">Total in round</div>
                <img
                  v-tooltip="{
                    content: `This total includes the funds in the matching pool and all contributions from the community.`,
                    trigger: 'hover click',
                  }"
                  width="16px"
                  src="@/assets/info.svg"
                />
              </div>
              <div class="round-info-value">
                <div class="value large">{{ formatTotalInRound }}</div>
                <div class="unit">{{ currentRound.nativeTokenSymbol }}</div>
              </div>
            </div>
          </div>
          <div class="round-info-sub-item">
            <div style="width: 100%; display: flex; gap: 0.5rem">
              <div class="round-info-title">Matching pool</div>
              <img
                v-tooltip="{
                  content:
                    'These are the funds that will be distributed to all the projects based on the contributions they receive from the community.',
                  trigger: 'hover click',
                }"
                width="16px"
                src="@/assets/info.svg"
              />
              <div v-tooltip="'Add matching funds'" class="add-link">
                <a style="margin: 0" @click="addMatchingFunds()">
                  <img style="width: 16px" src="@/assets/add.svg" />
                </a>
                <a @click="addMatchingFunds()" class="add-funds-link">
                  Add funds
                </a>
              </div>
            </div>

            <div class="round-info-value">
              <div class="value">
                {{ formatIntegerPart(currentRound.matchingPool) }}
              </div>
              <div class="value">
                {{ formatFractionalPart(currentRound.matchingPool) }}
              </div>
              <div class="unit">{{ currentRound.nativeTokenSymbol }}</div>
            </div>
          </div>
          <div class="round-info-sub-item">
            <div>
              <div class="round-info-title">Contributions total</div>
              <div class="round-info-value">
                <div class="value">
                  {{ formatIntegerPart(currentRound.contributions) }}
                </div>
                <div class="value">
                  {{ formatFractionalPart(currentRound.contributions) }}
                </div>
                <div class="unit">{{ currentRound.nativeTokenSymbol }}</div>
              </div>
            </div>
          </div>
          <div class="round-info-sub-item">
            <div>
              <div class="round-info-title">Contributors</div>
              <div class="round-info-value">
                <div class="value">{{ currentRound.contributors }}</div>
                <div class="unit">
                  legend{{ currentRound.contributors !== 1 ? 's' : '' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="!currentRound && !isLoading">
        <div class="round-info-item">
          <div style="width: 100%">
            <div style="width: 100%; display: flex; gap: 0.5rem">
              <div class="round-info-title">No scheduled round</div>
            </div>
          </div>
          <div class="round-info-value">
            We haven't yet scheduled a funding round. Stay tuned!
          </div>
        </div>
      </template>
      <loader v-if="isLoading" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'

import { RoundInfo, getCurrentRound, TimeLeft } from '@/api/round'
import {
  Project,
  getRecipientRegistryAddress,
  getProjects,
} from '@/api/projects'

import { getTimeLeft } from '@/utils/dates'
import { formatAmount } from '@/utils/amounts'
import ProjectListItem from '@/components/ProjectListItem.vue'
import MatchingFundsModal from '@/components/MatchingFundsModal.vue'
import Loader from '@/components/Loader.vue'
import {
  SELECT_ROUND,
  LOAD_ROUND_INFO,
  LOAD_USER_INFO,
  LOAD_CART,
  LOAD_COMMITTED_CART,
  LOAD_CONTRIBUTOR_DATA,
} from '@/store/action-types'
import { SET_RECIPIENT_REGISTRY_ADDRESS } from '@/store/mutation-types'

const SHUFFLE_RANDOM_SEED = Math.random()

function random(seed: number, i: number): number {
  // Like Math.random() but seedable
  const s = Math.sin(seed * i) * 10000
  return s - Math.floor(s)
}

function shuffleArray(array: any[]) {
  // Shuffle array using the Durstenfeld algo
  // More info: https://stackoverflow.com/a/12646864/1868395
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random(SHUFFLE_RANDOM_SEED, i) * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

@Component({
  components: {
    ProjectListItem,
    Loader,
  },
})
export default class RoundInformation extends Vue {
  projects: Project[] = []
  search = ''
  isLoading = true

  async created() {
    const roundAddress =
      this.$route.params.address ||
      this.$store.state.currentRoundAddress ||
      (await getCurrentRound())
    if (
      roundAddress &&
      roundAddress !== this.$store.state.currentRoundAddress
    ) {
      // Select round and (re)load round info
      this.$store.dispatch(SELECT_ROUND, roundAddress)
      await this.$store.dispatch(LOAD_ROUND_INFO)
      if (this.$store.state.currentUser) {
        // Load user data if already logged in
        this.$store.dispatch(LOAD_USER_INFO)
        this.$store.dispatch(LOAD_CART)
        this.$store.dispatch(LOAD_COMMITTED_CART)
        this.$store.dispatch(LOAD_CONTRIBUTOR_DATA)
      }
    }
    if (this.$store.state.recipientRegistryAddress === null) {
      const registryAddress = await getRecipientRegistryAddress(roundAddress)
      this.$store.commit(SET_RECIPIENT_REGISTRY_ADDRESS, registryAddress)
    }
    await this.loadProjects()
    this.isLoading = false
  }

  private async loadProjects() {
    const projects = await getProjects(
      this.$store.state.recipientRegistryAddress,
      this.currentRound?.startTime.toSeconds(),
      this.currentRound?.votingDeadline.toSeconds()
    )
    const visibleProjects = projects.filter((project) => {
      return !project.isHidden && !project.isLocked
    })
    shuffleArray(visibleProjects)
    this.projects = visibleProjects
  }

  get currentRound(): RoundInfo | null {
    return this.$store.state.currentRound
  }

  get joinTimeLeft(): TimeLeft {
    return getTimeLeft(this.$store.getters.recipientJoinDeadline)
  }

  get contributionTimeLeft(): TimeLeft {
    return getTimeLeft(this.$store.state.currentRound.signUpDeadline)
  }

  get reallocationTimeLeft(): TimeLeft {
    return getTimeLeft(this.$store.state.currentRound.votingDeadline)
  }

  get formatTotalInRound(): string {
    const { currentRound } = this.$store.state
    const totalInRound = currentRound.contributions.addUnsafe(
      currentRound.matchingPool
    )

    return this.formatAmount(totalInRound)
  }

  get filteredProjects(): Project[] {
    return this.projects.filter((project: Project) => {
      if (!this.search) {
        return true
      }
      return project.name.toLowerCase().includes(this.search.toLowerCase())
    })
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

  formatAmount(value: BigNumber): string {
    const decimals = this.$store.state.currentRound.nativeTokenDecimals
    return formatAmount(value, decimals)
  }

  addMatchingFunds(): void {
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
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.image-wrapper {
  border-radius: 8px;
  background: $clr-pink-dark-gradient;
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

.circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.open-pulse {
  animation: pulse-animation 2s infinite ease-out;
  background: $clr-green;
}

@keyframes pulse-animation {
  0% {
    box-shadow: 0 0 0 0px $bg-primary-color;
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
  background: $bg-light-color;
  padding: 1rem;
}

.round-info-item {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  justify-content: space-between;
  align-items: flex-start;
  background: $bg-light-color;
  padding: 1rem;
  border-radius: 0.5rem;
  box-sizing: border-box;
  width: 100%;

  img {
    opacity: 0.6;
  }
}

.round-info-sub-item {
  flex: 1 0 10%;
  background: $bg-secondary-color;
  padding: 1rem;

  img {
    opacity: 0.6;
  }
}

.round-info-title {
  color: white;
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
  color: white;
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

.project-search {
  border: $border;
  border-radius: 30px;
  box-sizing: border-box;
  display: flex;
  margin: 20px 0;
  min-width: 300px;
  padding: 8px 15px;
  width: 33%;

  img {
    margin-right: 10px;
  }

  input {
    background-color: transparent;
    border: none;
    font-size: 14px;
    padding: 0;
    width: 100%;

    &::placeholder {
      opacity: 1;
    }
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
  align-items: center;
  gap: 0.25rem;
  color: $clr-green;
  &:hover {
    opacity: 0.8;
  }
}

.add-funds-link {
  margin-bottom: 0.25rem;
  font-size: 14px;
  color: $clr-green;
}

.status {
  font-size: 16px;
  display: flex;
  align-items: center;
}
</style>
