<template>
  <div class="projects">
    <h1 class="content-heading">Projects</h1>
    <div v-if="currentRound" class="round-info">
      <div class="round-info-item">
        <div class="round-info-title">Current Round:</div>
        <div class="round-info-value" :data-round-address="currentRound.fundingRoundAddress">
          {{ currentRound.roundNumber }}
        </div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Status:</div>
        <div class="round-info-value">{{ currentRound.status }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Contribution Deadline:</div>
        <div class="round-info-value">{{ currentRound.signUpDeadline | formatDate }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Reallocation Deadline:</div>
        <div class="round-info-value">{{ currentRound.votingDeadline | formatDate }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Total Funds:</div>
        <div class="round-info-value">{{ currentRound.totalFunds | formatAmount }} {{ currentRound.nativeTokenSymbol }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Matching Pool:</div>
        <div class="round-info-value">
          {{ currentRound.matchingPool | formatAmount }} {{ currentRound.nativeTokenSymbol }}
          <a
            @click="addMatchingFunds()"
            class="add-matching-funds-btn"
            title="Add matching funds"
          >
            <img src="@/assets/add.svg" >
          </a>
        </div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Contributions:</div>
        <div class="round-info-value">{{ currentRound.contributions | formatAmount }} {{ currentRound.nativeTokenSymbol }}</div>
      </div>
      <div class="round-info-item">
        <div class="round-info-title">Your Contribution:</div>
        <div class="round-info-value">{{ contribution | formatAmount }} {{ currentRound.nativeTokenSymbol }}</div>
      </div>
    </div>
    <div v-if="projects.length > 0" class="project-search">
      <input
        v-model="search"
        class="input"
        name="search"
        placeholder="Search projects..."
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

import { RoundInfo } from '@/api/round'
import { Project, getProjects } from '@/api/projects'

import ProjectListItem from '@/components/ProjectListItem.vue'
import MatchingFundsModal from '@/components/MatchingFundsModal.vue'
import {
  LOAD_ROUND_INFO,
  LOAD_USER_INFO,
  LOAD_CART,
  LOAD_CONTRIBUTOR_DATA,
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
      this.$store.commit(SET_CURRENT_ROUND_ADDRESS, roundAddress)
      ;(async () => {
        await this.$store.dispatch(LOAD_ROUND_INFO)
        if (this.$store.state.currentUser) {
          // Reload user data when switching between rounds
          await this.$store.dispatch(LOAD_USER_INFO)
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

  get contribution(): FixedNumber {
    const contribution = this.$store.state.contribution
    const decimals = this.currentRound?.nativeTokenDecimals
    if (!contribution || !decimals) {
      return FixedNumber.from(0)
    }
    return FixedNumber.fromValue(contribution, decimals)
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
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
}

.round-info-item {
  border-right: $border;
  border-top: $border;
  box-sizing: border-box;
  flex: 0 0 25%;
  overflow: hidden;
  padding: 10px $content-space;

  &:nth-child(4n + 1) {
    padding-left: 0;
  }

  &:nth-child(4n + 0) {
    border-right: none;
  }
}

.round-info-title {
  margin-bottom: 5px;
}

.round-info-value {
  overflow: hidden;
  text-overflow: ellipsis;
}

.add-matching-funds-btn {
  display: inline-block;
  line-height: 1;
  margin-left: 5px;

  img {
    height: 1em;
    vertical-align: bottom;
  }
}

.project-search {
  margin: 20px 0;

  input {
    background-color: $bg-secondary-color;
    border: none;
    border-radius: 20px;
    font-size: 14px;
    padding: 2px 10px;
    width: 100%;
  }
}

.project-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: $content-space;
}

@media (max-width: 1150px) {
  .round-info-item {
    flex: 0 0 50%;

    &:nth-child(2n+1) {
      padding-left: 0;
    }

    &:nth-child(2n) {
      border-right: none;
    }
  }
}
</style>
