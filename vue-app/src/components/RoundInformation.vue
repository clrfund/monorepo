<template>
  <div class="projects">
    <div v-if="currentRound" class="round-info">
      <div class="image-wrapper">
            <img src="@/assets/docking.png" height="100%" />
          </div>
          <div class="round">
            <div style="display: flex; align-items: center;">
              <h2 style="line-height: 120%; margin: 0;">Eth2 CLR</h2>
              <div class="verified"><a style="" href="https://etherescan.io/:address"><img src="@/assets/verified.svg" /></a> </div>
            </div>
            <div class="status"> 
              <div class="circle pulse open" /> Open
            </div>
          </div>
      <div v-if="currentRound.status === 'Reallocating' || currentRound.status === 'Tallying'" class="round-info-item">
        <div>
          <div class="round-info-title" style="margin-bottom: 0.5rem;">Time left to reallocate</div>
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
      <div v-if="currentRound.status === 'Contributing'" class="round-info-item">
        <div class="round-info-title" style="margin-bottom: 0.5rem;">Time left to contribute</div>
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
      <!-- <div class="round-info-item">
        <div class="round-info-title">Round 0</div>
        <div class="round-info-value" :data-round-address="currentRound.fundingRoundAddress">
          <div class="value large">{{ currentRound.roundNumber }}</div>
          <div class="unit">{{ currentRound.status }}</div>
        </div>
      </div> -->
      <div v-if="currentRound" class="round-value-info">
        <div class="round-value-info-item">
          <div>
            <div class="round-info-title" style="margin-bottom: 0.5rem;">
              Total in round
            </div>
            <div class="round-info-value">
              <div class="value large">{{ formatIntegerPart(currentRound.contributions) + formatIntegerPart(currentRound.matchingPool) }}</div>
              <div class="value extra">{{ formatFractionalPart(currentRound.contributions) + formatFractionalPart(currentRound.matchingPool) }}</div>
              <div class="unit">{{ currentRound.nativeTokenSymbol }}</div>
            </div>
          </div>
        </div>
        <div class="round-info-sub-item">
          <div>
            <div class="round-info-title" style="margin-bottom: 0.5rem;">
              Matching pool
              <a 
              style="margin-bottom: 0;"
              @click="addMatchingFunds()"
              title="Add matching funds"
              >
                <img src="@/assets/more.svg" />
              </a>
            </div>
            <div class="round-info-value">
              <div class="value">{{ formatIntegerPart(currentRound.matchingPool) }}</div>
              <div class="value">{{ formatFractionalPart(currentRound.matchingPool) }}</div>
              <div class="unit">{{ currentRound.nativeTokenSymbol }}</div>
            </div>
          </div>
        </div>
        <div class="round-info-sub-item">
          <div>
            <div class="round-info-title" style="margin-bottom: 0.5rem;">
              Contributions total
            </div>
            <div class="round-info-value">
              <div class="value">{{ formatIntegerPart(currentRound.contributions) }}</div>
              <div class="value extra">{{ formatFractionalPart(currentRound.contributions) }}</div>
              <div class="unit">{{ currentRound.nativeTokenSymbol }}</div>
            </div>
          </div>
        </div>
        <div class="round-info-sub-item">
            <div>
              <div class="round-info-title" style="margin-bottom: 0.5rem;">
                Contributors
                <a 
                  style="margin-bottom: 0;"
                  @click="addMatchingFunds()"
                  title="Add matching funds"
                >
                  <img src="@/assets/more.svg"/>
                </a>
              </div>
              <div class="round-info-value">
                <div class="value">{{ currentRound.contributors }}</div>
                <div class="unit">legends</div>
              </div>
            </div>
        </div>
      </div>
    </div>
    <div v-if="isLoading" class="loader"></div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { FixedNumber } from 'ethers'
import { DateTime } from 'luxon'

import { RoundInfo, getCurrentRound } from '@/api/round'
import { Project, getRecipientRegistryAddress, getProjects } from '@/api/projects'

import ProjectListItem from '@/components/ProjectListItem.vue'
import MatchingFundsModal from '@/components/MatchingFundsModal.vue'
import {
  SELECT_ROUND,
  LOAD_ROUND_INFO,
  LOAD_USER_INFO,
  LOAD_CART,
  LOAD_CONTRIBUTOR_DATA,
} from '@/store/action-types'
import {
  SET_RECIPIENT_REGISTRY_ADDRESS,
} from '@/store/mutation-types'

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
  name: 'round-info',
  metaInfo: { title: 'Round' },
  components: {
    ProjectListItem,
  },
})
export default class RoundInformation extends Vue {

  projects: Project[] = []
  search = ''
  isLoading = true

  async created() {
    const roundAddress = this.$route.params.address || this.$store.state.currentRoundAddress || await getCurrentRound()
    if (roundAddress && roundAddress !== this.$store.state.currentRoundAddress) {
      // Select round and (re)load round info
      this.$store.dispatch(SELECT_ROUND, roundAddress)
      await this.$store.dispatch(LOAD_ROUND_INFO)
      if (this.$store.state.currentUser) {
        // Load user data if already logged in
        this.$store.dispatch(LOAD_USER_INFO)
        this.$store.dispatch(LOAD_CART)
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
      this.currentRound?.votingDeadline.toSeconds(),
    )
    const visibleProjects = projects.filter(project => {
      return (!project.isHidden && !project.isLocked)
    })
    shuffleArray(visibleProjects)
    this.projects = visibleProjects
  }

  get currentRound(): RoundInfo | null {
    return this.$store.state.currentRound
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

.open{
  background: $clr-green;
}

.circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.pulse {
  animation: pulse-animation 2s infinite ease-out;
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


.round-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
  margin-top: 1rem;

}

.round-value-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
    margin-bottom: 3rem;
  
}

.round-value-info-item {
  display: flex;
  flex: 1 0 10%;
  justify-content: space-between;
  align-items: center;
  background: $bg-light-color;
  padding: 1rem;
  border-radius: 0.5rem;
  border-radius: 0.5rem 0.5rem 0rem 0rem;
  box-shadow: inset 0px -1px 0px #7375A6; 
}

.round-info-item {
  display: flex;
  flex-direction: column;
  flex: 1 0 10%;
  justify-content: space-between;
  align-items: flex-start;
  background: $bg-light-color;
  padding: 1rem;
  border-radius: 0.5rem;
}

.round-info-sub-item {
  flex: 1 0 10%;
  background: $bg-secondary-color;
  padding: 1rem;
  box-shadow: inset 0px -1px 0px #7375A6; 
  &:last-child {
      border-radius: 0 0 0.5rem 0.5rem;
      box-shadow: none; 
    }
}

.round-info-title {
  color: white;
  font-size: 16px;
  font-weight: 400;
  line-height: 120%;
  text-transform: uppercase;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.round-info-value {
  display: flex;
  flex-direction: row;
  align-items: flex-end;

  .value {
    font-size: 24px;
    font-family:'Glacial Indifference', sans-serif;
    color: white;
    font-weight: 700;
    line-height: 120%;

    &.large {
      font-size: 32px;
      line-height: 120%;
    }

    &.extra {
      font-size: 32px;
      font-family:'Glacial Indifference', sans-serif;
      color: white;
      line-height: 120%;
    }
  }

  .unit {
    color: white;
    font-family:'Glacial Indifference', sans-serif;
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
    font-size: 14px;
  }
}
</style>
