<template>
  <links :to="projectRoute">
    <div class="container">
      <div class="rank">
        <div v-if="isTop3">
          <img v-if="isFirst" src="~@/assets/medal/medal-1.svg" />
          <img v-else-if="isSecond" src="~@/assets/medal/medal-2.svg" />
          <img v-else src="~@/assets/medal/medal-3.svg" />
        </div>
        <div
          class="number"
          :class="{
            first: isFirst,
            second: isSecond,
            third: isThird,
          }"
        >
          {{ rank }}
        </div>
      </div>
      <div class="project-image">
        <img :src="projectImageUrl" :alt="project.name" />
      </div>
      <div class="project-name">
        {{ project.name }}
      </div>
      <div class="funding">
        <div class="amount">{{ formatAmount(project.fundingAmount) }}</div>
        <div class="symbol">{{ tokenSymbol }} funded</div>
      </div>
    </div>
  </links>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

import Links from '@/components/Links.vue'
import { Project } from '@/api/projects'
import { Route } from 'vue-router'
import { BigNumber } from 'ethers'
import { formatAmount } from '@/utils/amounts'

import ClaimButton from '@/components/ClaimButton.vue'

@Component({
  components: {
    Links,
    ClaimButton,
  },
})
export default class LeaderboardListItem extends Vue {
  @Prop() project!: Project
  @Prop() tokenSymbol!: string
  @Prop() tokenDecimals!: number
  @Prop() rank!: number

  get projectRoute(): Partial<Route> {
    return { name: 'project', params: { id: this.project.id } }
  }

  get isTop3() {
    return this.rank <= 3
  }

  get isFirst() {
    return this.rank === 1
  }

  get isSecond() {
    return this.rank === 2
  }

  get isThird() {
    return this.rank === 3
  }

  formatAmount(amount?: BigNumber): string {
    return amount ? formatAmount(amount, this.tokenDecimals, null, 0) : '0'
  }

  get projectImageUrl(): string | null {
    if (typeof this.project.bannerImageUrl !== 'undefined') {
      return this.project.bannerImageUrl
    }
    if (typeof this.project.imageUrl !== 'undefined') {
      return this.project.imageUrl
    }
    return null
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
  display: grid;
  column-gap: 1rem;
  margin-bottom: 10px;
  grid-template-columns: 2rem 2rem 3fr 8rem;
  grid-template-areas: 'rank image name amount';
}

.rank {
  grid-area: rank;
  position: relative;
  width: 2.5rem;
  font-family: Inter;
  font-style: normal;
  font-weight: bold;
  font-size: 1rem;
  color: var(--text-secondary);
  box-sizing: border-box;
  text-align: center;

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }

  .number {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    text-align: center;
    line-height: 2em;

    &.first {
      color: var(--brand-tertiary);
    }
    &.second {
      color: var(--error-color);
    }
    &.third {
      color: var(--bg-light-color);
    }
  }
}

.project-image {
  grid-area: image;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  overflow: hidden;
  justify-self: center;
  box-shadow: 0px 4px 4px 0px 0, 0, 0, 0.25;

  img {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}

.project-name {
  grid-area: name;
  font-weight: 200;
  overflow-wrap: break-word;
  margin-bottom: 1.5rem;
  font-size: 2vw;
  color: var(--text-secondary);

  a {
    color: var(--text-body);
  }

  @media (max-width: $breakpoint-m) {
    font-size: 3vw;
  }
}

.funding {
  grid-area: amount;
  text-align: right;

  .amount {
    font-size: 2vw;
    @media (max-width: $breakpoint-m) {
      font-size: 4vw;
    }
  }

  .symbol {
    font-size: 1vw;
    @media (max-width: $breakpoint-m) {
      font-size: 1.5vw;
    }
  }
}
</style>
