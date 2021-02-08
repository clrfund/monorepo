<template>
  <div class="projects">
    <h1 class="content-heading">Projects</h1>
    <div v-if="currentRound" class="round-info">
      <div class="round-info-item">
        <div class="round-info-title">Round</div>
        <div class="round-info-value" :data-round-address="currentRound.fundingRoundAddress">
          <div class="value large">{{ currentRound.roundNumber }}</div>
          <div class="unit">{{ currentRound.status }}</div>
        </div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">
          Matching pool
          <a
            @click="addMatchingFunds()"
            class="add-matching-funds-btn"
            title="Add matching funds"
          >
            <img src="@/assets/add.svg" >
          </a>
        </div>
        <div class="round-info-value">
          <div class="value large">{{ formatIntegerPart(currentRound.matchingPool) }}</div>
          <div class="value large extra">{{ formatFractionalPart(currentRound.matchingPool) }}</div>
          <div class="unit">{{ currentRound.nativeTokenSymbol }}</div>
        </div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Contributions</div>
        <div class="round-info-value">
          <div class="value">{{ formatIntegerPart(currentRound.contributions) }}</div>
          <div class="value extra">{{ formatFractionalPart(currentRound.contributions) }}</div>
          <div class="unit">{{ currentRound.nativeTokenSymbol }}</div>
          <div class="value">{{ currentRound.contributors }}</div>
          <div class="unit">contributors</div>
        </div>
      </div>
      <div v-if="currentRound.status === 'Contributing'" class="round-info-item">
        <div class="round-info-title">Time left to contribute</div>
        <div
          class="round-info-value"
          :title="'Contribution Deadline: ' + formatDate(currentRound.signUpDeadline)"
        >
          <div class="value" v-if="contributionTimeLeft.days > 0">{{ contributionTimeLeft.days }}</div>
          <div class="unit" v-if="contributionTimeLeft.days > 0">days</div>
          <div class="value">{{ contributionTimeLeft.hours }}</div>
          <div class="unit">hours</div>
          <div class="value" v-if="contributionTimeLeft.days === 0">{{ contributionTimeLeft.minutes }}</div>
          <div class="unit" v-if="contributionTimeLeft.days === 0">minutes</div>
        </div>
      </div>
      <div v-if="currentRound.status === 'Reallocating'" class="round-info-item">
        <div class="round-info-title">Time left to reallocate</div>
        <div
          class="round-info-value"
          :title="'Reallocation Deadline: ' + formatDate(currentRound.votingDeadline)"
        >
          <div class="value" v-if="reallocationTimeLeft.days > 0">{{ reallocationTimeLeft.days }}</div>
          <div class="unit" v-if="reallocationTimeLeft.days > 0">days</div>
          <div class="value">{{ reallocationTimeLeft.hours }}</div>
          <div class="unit">hours</div>
          <div class="value" v-if="reallocationTimeLeft.days === 0">{{ reallocationTimeLeft.minutes }}</div>
          <div class="unit" v-if="reallocationTimeLeft.days === 0">minutes</div>
        </div>
      </div>
    </div>
    <div v-if="projects.length > 0" class="project-search">
      <img src="@/assets/search.svg">
      <input
        v-model="search"
        class="input"
        name="search"
        placeholder="Search projects"
        autocomplete="off"
      >
    </div>
    <div class="project-list">
      <project-list-item
        v-for="project in filteredProjects"
        :project="project"
        :key="project.id"
      >
      </project-list-item>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { FixedNumber } from 'ethers'
import { DateTime } from 'luxon'

import { RoundInfo } from '@/api/round'
import { Project, getProjects } from '@/api/projects'

import ProjectListItem from '@/components/ProjectListItem.vue'
import MatchingFundsModal from '@/components/MatchingFundsModal.vue'
import {
  LOAD_ROUND_INFO,
  LOAD_USER_INFO,
  LOAD_CART,
  UNWATCH_CART,
  LOAD_CONTRIBUTOR_DATA,
  UNWATCH_CONTRIBUTOR_DATA,
} from '@/store/action-types'
import { SET_CURRENT_ROUND_ADDRESS } from '@/store/mutation-types'

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

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
}

function timeLeft(date: DateTime): TimeLeft {
  const now = DateTime.local()
  if (now >= date) {
    return { days: 0, hours: 0, minutes: 0 }
  }
  const { days, hours, minutes } = date.diff(now, ['days', 'hours', 'minutes'])
  return { days, hours, minutes: Math.ceil(minutes) }
}

@Component({
  name: 'project-list',
  metaInfo: { title: 'Projects' },
  components: {
    ProjectListItem,
  },
})
export default class ProjectList extends Vue {

  projects: Project[] = []
  search = ''

  roundWatcherStop?: Function

  get currentRound(): RoundInfo | null {
    return this.$store.state.currentRound
  }

  created() {
    const roundAddress = this.$route.params.address || null
    if (roundAddress && roundAddress !== this.$store.state.currentRoundAddress) {
      // Change current round and reload round info
      this.$store.dispatch(UNWATCH_CART)
      this.$store.dispatch(UNWATCH_CONTRIBUTOR_DATA)
      this.$store.commit(SET_CURRENT_ROUND_ADDRESS, roundAddress)
      ;(async () => {
        await this.$store.dispatch(LOAD_ROUND_INFO)
        if (this.$store.state.currentUser) {
          // Reload user data when switching between rounds
          this.$store.dispatch(LOAD_USER_INFO)
          this.$store.dispatch(LOAD_CART)
          this.$store.dispatch(LOAD_CONTRIBUTOR_DATA)
        }
      })()
    }

    // Wait for round info to load and get project list
    this.roundWatcherStop = this.$store.watch(
      (state) => state.currentRound?.fundingRoundAddress,
      this.loadProjects,
    )
    this.loadProjects()
  }

  beforeDestroy() {
    if (this.roundWatcherStop) {
      this.roundWatcherStop()
    }
  }

  private async loadProjects() {
    const projects = await getProjects(
      this.currentRound?.startBlock,
      this.currentRound?.endBlock,
    )
    const visibleProjects = projects.filter(project => {
      return (!project.isHidden && !project.isLocked)
    })
    shuffleArray(visibleProjects)
    this.projects = visibleProjects
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

  get contributionTimeLeft(): TimeLeft {
    return timeLeft(this.$store.state.currentRound.signUpDeadline)
  }

  get reallocationTimeLeft(): TimeLeft {
    return timeLeft(this.$store.state.currentRound.votingDeadline)
  }

  addMatchingFunds(): void {
    if (!this.$store.state.currentUser) {
      return
    }
    this.$modal.show(
      MatchingFundsModal,
      { },
      { },
      {
        closed: () => {
          // Reload matching pool size
          this.$store.dispatch(LOAD_ROUND_INFO)
        },
      },
    )
  }

  get filteredProjects(): Project[] {
    return this.projects.filter((project: Project) => {
      if (!this.search) {
        return true
      }
      return project.name.toLowerCase().includes(this.search.toLowerCase())
    })
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.round-info {
  border-bottom: $border;
  border-top: $border;
  display: flex;
  flex-wrap: wrap;
  margin: 0 (-$content-space);
  padding: 20px $content-space;
  gap: $content-space;
}

.round-info-item {
  display: flex;
  flex: 1 0 10%;
  flex-direction: column;
  justify-content: space-between;
}

.round-info-title {
  color: $text-secondary-color;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  margin-bottom: $content-space;
  text-transform: uppercase;
  white-space: nowrap;
}

.round-info-value {
  align-items: baseline;
  display: flex;
  flex-direction: row;
  line-height: 30px;

  .value {
    font-size: 32px;

    &.large {
      font-size: 44px;
    }

    &.extra {
      color: $text-secondary-color;
    }
  }

  .unit {
    color: #91A4C8;
    font-size: 12px;
    font-weight: 600;
    margin: 0 10px;
    text-transform: uppercase;

    &:last-child {
      margin-right: 0;
    }
  }
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: $content-space;
}

@media (max-width: 1500px) {
  .round-info-item:nth-child(2n) {
    break-after: always;
  }

  .round-info-title {
    margin-bottom: $content-space / 2;
  }
}
</style>
