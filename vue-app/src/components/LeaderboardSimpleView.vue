<template>
  <div class="content">
    <links
      :to="{
        name: 'leaderboard-project',
        params: { id: project.id, address: round.fundingRoundAddress, network: round.network },
      }"
    >
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
        <div class="desktop project-image">
          <img v-if="projectImageUrl" :src="projectImageUrl" :alt="project.name" />
        </div>
        <div class="project-name">
          {{ project.name }}
        </div>
        <div class="funding">
          <div class="amount">~{{ formatAllocationAmount(project.allocatedAmount) }}</div>
          <div class="symbol">
            {{
              $t('leaderboardSimpleView.funded', {
                tokenSymbol,
              })
            }}
          </div>
        </div>
      </div>
    </links>
  </div>
</template>

<script setup lang="ts">
import type { LeaderboardProject } from '@/api/projects'
import type { RoundInfo } from '@/api/round'
import { formatAmount } from '@/utils/amounts'

interface Props {
  project: LeaderboardProject
  round: RoundInfo
  rank: number
}

const props = defineProps<Props>()

const isTop3 = computed(() => {
  return props.rank <= 3
})

const isFirst = computed(() => {
  return props.rank === 1
})

const isSecond = computed(() => {
  return props.rank === 2
})

const isThird = computed(() => {
  return props.rank === 3
})

function formatAllocationAmount(amount?: bigint): string {
  const tokenDecimals = props.round.nativeTokenDecimals
  return amount ? formatAmount(amount, tokenDecimals, null, 0) : '0'
}

const projectImageUrl = computed(() => {
  if (typeof props.project.imageUrl !== 'undefined') {
    return props.project.imageUrl
  }

  return null
})

const tokenSymbol = computed(() => {
  return props.round.nativeTokenSymbol
})
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.content {
  :hover {
    background-color: var(--bg-secondary-color);
  }
}

.container {
  display: flex;
  column-gap: 1rem;
  margin-bottom: 10px;
  flex-direction: row;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: var(--text-body);
  font-size: 1rem;

  @media (max-width: $breakpoint-m) {
    column-gap: 5px;
  }
}

.rank {
  position: relative;
  width: 2.5rem;
  font-family: Inter;
  font-style: normal;
  font-weight: bold;
  font-size: 1rem;
  color: var(--text-secondary);
  box-sizing: border-box;
  text-align: center;
  flex: 0 0 auto;

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
    line-height: 1.8em;
    background: transparent;

    &.first {
      color: $rank-1-color;
    }
    &.second {
      color: $rank-2-color;
    }
    &.third {
      color: $rank-3-color;
    }
  }
}

.project-image {
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  overflow: hidden;
  justify-self: center;
  box-shadow:
    0px 4px 4px 0px 0,
    0,
    0,
    0.25;
  flex: 0 0 auto;
  border: 2px solid var(--border-color);

  img {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}

.project-name {
  font-weight: 200;
  font-size: 1.5rem;
  overflow-wrap: break-word;
  margin-bottom: 1.5rem;
  color: var(--text-body);
  flex: 1 1 auto;
}

.funding {
  text-align: right;

  .amount {
    white-space: nowrap;
    font-family: 'Lucida Console', 'Courier New', monospace;
    font-size: 1.5rem;
  }

  .symbol {
    font-size: 0.7rem;
    white-space: nowrap;
  }
}
</style>
