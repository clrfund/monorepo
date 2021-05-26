<template>
  <div class="project-container">
    <div class="projects">        
      <div :class="{
        title: true,
        'title-with-cart-closed': !!$store.state.currentUser && !$store.state.showCartPanel,
        'title-with-cart-open': !!$store.state.currentUser && $store.state.showCartPanel,
      }">
        <div class="header">
          <h2>Projects</h2>
        </div>
        <div class="category-filter">
          <select class="dropdown-btn" id="filter">
            <option selected value="" label="Filter by category" />
            <option value="content">Content</option>
            <option value="researcg">Research</option>
            <option value="tooling">Tooling</option>
            <option value="data">Data</option>
          </select>
        </div>
        <div v-if="projects.length > 0" class="project-search">
          <img src="@/assets/search.svg">
          <input
            v-model="search"
            class="input"
            name="search"
            placeholder="Search projects"
            autocomplete="on"
            onfocus="this.value=''" 
          >
        </div>
        <!-- <div class="action-bar">
        </div> -->
        <div class="add-project">
          <router-link to="/join" class="btn-primary">Add project</router-link>
        </div>
        <div class="hr" />
      </div>
      <!-- <h1 class="content-heading">Projects</h1> -->
      <!-- <div v-if="currentRound" class="round-info">
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
        <div v-if="currentRound.status === 'Reallocating' || currentRound.status === 'Tallying'" class="round-info-item">
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
      <div v-if="isLoading" class="loader"></div> -->
      <div class="project-list">
        <div class="get-prepared" v-if="!this.search">
          <span aria-label="rocket" class="emoji">🚀</span>
          <div>
          <h2 class="prep-title">Get prepared</h2>
          <p class="prep-text">You’ll need to set up a few things before you contribute. You can do this any time before or during the funding round.</p>
          </div>
          <div class="btn-action" style="cursor: pointer;">Start prep</div>
        </div>
        <project-list-item
          v-for="project in filteredProjects"
          :project="project"
          :key="project.id"
        >
        </project-list-item>
      </div>
      <div class="empty-search" v-if="filteredProjects == 0">
        <div>😢 No projects match your search. Try using the filter to narrow down what you're looking for.</div>
      </div>
      <div v-if="!!$store.state.currentUser && $store.state.showCartPanel" class="round-info-container">
        <round-information />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { FixedNumber } from 'ethers'
import { DateTime } from 'luxon'

import { RoundInfo, getCurrentRound, TimeLeft } from '@/api/round'
import { Project, getRecipientRegistryAddress, getProjects } from '@/api/projects'

import ProjectListItem from '@/components/ProjectListItem.vue'
import MatchingFundsModal from '@/components/MatchingFundsModal.vue'
import CartWidget from '@/components/CartWidget.vue'
import RoundInformation from '@/components/RoundInformation.vue'
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

function timeLeft(date: DateTime): TimeLeft {
  const now = DateTime.local()
  if (now >= date) {
    return { days: 0, hours: 0, minutes: 0 }
  }
  const { days, hours, minutes } = date.diff(now, ['days', 'hours', 'minutes'])
  return { days, hours, minutes: Math.ceil(minutes) }
}

@Component({
  components: {
    ProjectListItem,
    CartWidget,
    RoundInformation,
  },
})
export default class ProjectList extends Vue {

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
    return value._value === '0.0' ? '' : value.round(2).toString().split('.')[1]
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

.project-container {
  display: flex;
  @media (max-width: $breakpoint-m) {
    flex-direction: column-reverse;
    padding-bottom: 4rem;
  }
}

.round-info-container {
  /* Shows <round-information/> at the bottom if cart open, and screen between $breakpoint-m
     and $breakpoint-l (while the left sidebar would be hidden, and no mobile tabs yet) */
  display: none;
  @media (max-width: $breakpoint-l) {
    display: flex;
    margin: 0 (-$content-space);
    padding: 20px $content-space;
  }
  @media (max-width: $breakpoint-m - 1px) {
    display: none;
  }
  
}

.projects {
  flex: 1;
}

/* Project grid layouts by breakpoints */
/* For use with .title, .title-with-cart-closed, .title-with-cart-open classes */
@mixin project-grid-defaults {
  grid-template-columns: 1fr repeat(3, auto);
  grid-template-areas: "header filter search add" "hr hr hr hr";
}
@mixin project-grid-xl {
  grid-template-columns: auto 1fr 1.5fr auto;
  grid-template-areas: "header . . add" "hr hr hr hr" "filter . search search";
}
@mixin project-grid-l {
  grid-template-columns: auto 1fr auto;
  grid-template-areas: "header . add" "hr hr hr" "search search search" "filter . .";
}
@mixin project-grid-m {
  grid-template-columns: 1fr;
  grid-template-areas: "header" "hr" "search" "filter" "add";
}

.title {
  display: grid;
  @include project-grid-defaults();
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  
  /* Default breakpoints when user is not logged in, thus no cart */
  /* See below for adjustments when cart is present */
  @media (max-width: $breakpoint-xl) {
    @include project-grid-xl();
  }
  @media (max-width: $breakpoint-l) {
    @include project-grid-l();
  }
  @media (max-width: $breakpoint-m) {
    @include project-grid-m();
  }

  .header {
    grid-area: header;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-right: auto;
    @media (max-width: $breakpoint-m) {
      h2 {
        margin-bottom: 1rem;
      }
    }
    h2 {
      line-height: 130%;
      margin: 0;
    }
  }

  .add-project {
    grid-area: add;
  }

  .category-filter {
    grid-area: filter;
    #filter {
      font-size: 16px;
      background: none;
      color: white;
      font-weight: 600;
      /* border: none; */
      margin: 0;
      &:hover {
        background: $bg-secondary-color;
      }
    }
    @media (max-width: $breakpoint-xl) {
      margin-right: auto;
    }
  }

  .project-search {
    grid-area: search;
    border-radius: 16px;
    border: 2px solid $button-color;
    background-color: $bg-secondary-color;
    padding: 0.5rem 1rem;
    display: flex;
    font-size: 16px;
    font-family: Inter;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0em;
    @media (max-width: $breakpoint-m) {
      margin-top: 0.5rem;
    }
    width: auto;
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

  .hr {
    grid-area: hr;
    width: 100%;
    border-bottom: 1px solid rgba(115,117,166,1);
  }
}

.title-with-cart-closed {
  /* Nudges right edge of "title bar" inward when the cart
  toggle button is present. Only as issue when cart is closed,
  AND the user is logged in. */
  @media (min-width: $breakpoint-m + 1px) {
    // Desktop only
    margin-right: 1rem;
  }
  /* Adjusts breakpoints for when cart is present but closed */
  @media (max-width: $breakpoint-xl + $cart-width-closed) {
    @include project-grid-xl();
  }
  @media (max-width: $breakpoint-l + $cart-width-closed) {
    @include project-grid-l();
  }
  @media (max-width: $breakpoint-m + $cart-width-closed) {
    @include project-grid-m();

  }
}

.title-with-cart-open {
  /* Adjusts breakpoints for when cart is present and open */
  @media (max-width: $breakpoint-xl + $cart-width-open) {
    @include project-grid-xl();
  }
  @media (max-width: $breakpoint-l + $cart-width-open) {
    @include project-grid-l();
  }
  @media (max-width: $breakpoint-m + $cart-width-open) {
    @include project-grid-m();
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

.project-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: $content-space;
  z-index: 0;
  padding-bottom: 4rem;
}

.empty-search {
  background: $bg-secondary-color;
  border-radius: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 2rem;
}

.get-prepared {
  background: $bg-secondary-color;
  border: 1px solid #000000;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  &:hover {
    transform: scale(1.01);
    box-shadow: 0px 4px 4px 0px 0,0,0,0.25;
  }
}

.prep-title {
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 2rem;
    font-weight: 700;
  }

.prep-text {
  font-family: Inter;
  font-size: 16px;
  line-height: 150%;
}

.emoji {
  font-size: 32px;
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
