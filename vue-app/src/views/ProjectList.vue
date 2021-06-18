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
          <div :class="{
            'filter-btn': true,
            'filter-btn-cart-closed': !!$store.state.currentUser && !$store.state.showCartPanel,
            'filter-btn-cart-open': !!$store.state.currentUser && $store.state.showCartPanel,
          }" @click="handleFilterDropdown">
            <span>
              Filter <span v-if="selectedCategories.length > 0">({{selectedCategories.length}})</span>
            </span>
            <img src="@/assets/chevron-down.svg" alt="Down arrow" id="chevron">
          </div>
          <div class="selector-wrapper" id="category-selector">
            <div
              v-for="(category, idx) of categories"
              :key="idx"
              :class="{
                'category-btn': true,
                'category-btn-selected': selectedCategories.includes(category)
              }"
              @click="handleFilterClick"
            >{{category}} <span v-if="selectedCategories.includes(category)"><img src="@/assets/close.svg"></span></div>
          </div>
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
          <img v-if="search.length > 0" @click="clearSearch" src="@/assets/close.svg" height="20" class="pointer">
        </div>
        <div class="add-project">
          <router-link to="/join" class="btn-primary">Add project</router-link>
        </div>
        <div class="hr" />
      </div>

      <div class="project-list">
        <call-to-action-card v-if="!this.search && this.selectedCategories.length === 0"/>
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

import { getTimeLeft } from '@/utils/dates'

import CallToActionCard from '@/components/CallToActionCard.vue'
import CartWidget from '@/components/CartWidget.vue'
import MatchingFundsModal from '@/components/MatchingFundsModal.vue'
import ProjectListItem from '@/components/ProjectListItem.vue'
import RoundInformation from '@/components/RoundInformation.vue'
import {
  SELECT_ROUND,
  LOAD_ROUND_INFO,
  LOAD_USER_INFO,
  LOAD_CART,
  LOAD_COMMITTED_CART,
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

@Component({
  components: {
    CallToActionCard,
    CartWidget,
    ProjectListItem,
    RoundInformation,
  },
})
export default class ProjectList extends Vue {

  projects: Project[] = []
  search = ''
  isLoading = true
  categories: string[] = ['content', 'research', 'tooling', 'data']
  selectedCategories: string[] = []

  get projectsByCategoriesSelected(): Project[] {
    return this.selectedCategories.length === 0
      ? this.projects
      : this.projects.filter(project => this.selectedCategories.includes((project.category as string).toLowerCase()))
  }

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
    return getTimeLeft(this.$store.state.currentRound.signUpDeadline)
  }

  get reallocationTimeLeft(): TimeLeft {
    return getTimeLeft(this.$store.state.currentRound.votingDeadline)
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

  handleFilterDropdown(): void {
    document.getElementById('chevron')?.classList.toggle('filter-chevron-open')
    document.getElementById('category-selector')?.classList.toggle('show')
  }

  get filteredProjects(): Project[] {
    return this.projectsByCategoriesSelected.filter((project: Project) => {
      if (!this.search) {
        return true
      }
      return project.name.toLowerCase().includes(this.search.toLowerCase())
    })
  }

  handleFilterClick(event): void {
    const selection = event.target.innerText.toLowerCase()
    if (this.selectedCategories.includes(selection)) {
      this.selectedCategories = this.selectedCategories.filter(category => category !== selection)
    } else {
      this.selectedCategories.push(selection)
    }
  }

  clearSearch():  void {
    this.search = ''
  }
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (
    !event.target.matches('.filter-btn') &&
    !event.target.matches('.category-btn') &&
    event.target.id !== 'chevron'
  ) {
    const dropdowns = document.getElementsByClassName('selector-wrapper')
    let i: number
    for (i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i]
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show')
      }
    }
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
  grid-template-areas: "header . add" "hr hr hr" "search search search" "filter filter filter";
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
    position: relative;

    .filter-btn {
      background: none;
      cursor: pointer;
      border: 1px solid $border-color;
      border-radius: 0.75rem;
      width: fit-content; /*  */
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 0.75rem;
      transition: transform 0.1s;
      &:hover {
        opacity: 0.8;
        transform:scale(1.01);
      }
      .filter-chevron-open {
        transform: rotate(180deg);
      }
      @media (max-width: $breakpoint-m) {
        width: auto;
      }
    }
    .filter-btn-cart-closed {
      @media (max-width: $breakpoint-m + $cart-width-closed) {
        width: auto;
      }
    }
    .filter-btn-cart-open {
      @media (max-width: $breakpoint-m + $cart-width-open) {
        width: auto;
      }
    }

    .selector-wrapper {
      display: none;
      position: absolute;
      top: 110%;
      right: 0;
      grid-template-columns: repeat(1, 4fr);
      border: 1px solid $border-color;
      border-radius: 0.75rem;
      overflow: hidden;
      justify-content: space-between;
      width: 100%;
      z-index: 99;
      .category-btn {
        display: grid;
        place-items: center;
        cursor: pointer;
        padding: 0.5rem;
        background: $bg-primary-color;
        text-transform: capitalize;
        &:hover {
          background: $bg-secondary-color;
        }
      }
      .category-btn-selected {
        background: $clr-pink;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        line-height: 0;
        margin: 0;
        justify-content: space-between;
        
        &:hover {
          background: $clr-pink;
        }
      }
      @media (max-width: $breakpoint-s) {
        grid-template-columns: repeat(2, 1fr);
        .category-btn {
          border: none;
          &:nth-child(1) {
            border-right: 1px solid $border-color;
            border-bottom: 1px solid $border-color;
          }
          &:nth-child(2) {
            border-bottom: 1px solid $border-color;
          }
          &:nth-child(3) {
            border-right: 1px solid $border-color;
          }
        }
      }
    }
    .show {
      display: grid;
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
  padding: 2rem;
}



.get-prepared {
  background: $bg-secondary-color;
  border: 1px solid #000000;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  justify-content: space-between;
}

.prep-title {
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 2rem;
    font-weight: 700;
  }

  .prep-title-continue {
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 1.5rem;
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
