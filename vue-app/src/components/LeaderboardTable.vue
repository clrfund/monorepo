<template>
  <div>
    <div class="info">
      <div class="icon" aria-label="info icon">ℹ</div>
      <div class="message">
        The funding amount is the total amount awarded to each project
        calculated using the quadratic funding formula, &alpha;(V)&sup2; + (1-
        &alpha;)D; where V is the votes, D is the donations and &alpha; is the
        quadratic funding ratio calculated based on the matching pool size and
        total donation amount. Note: for simplicity, votes shown below have not
        been adjusted by the precision factor and voice credit factor which are
        used to manage precision loss and MACI limitation.
      </div>
    </div>

    <div class="content">
      <div class="card desktop">
        <div class="rank">#</div>
        <div class="project">Project</div>
        <div class="votes">Votes</div>
        <div class="donation heading">
          <div>Donation</div>
          <div class="desktop symbol">
            <img :src="require(`@/assets/${tokenLogo}`)" :alt="tokenSymbol" />
          </div>
        </div>
        <div class="funding heading">
          <div>Funding</div>
          <div class="desktop symbol">
            <img :src="require(`@/assets/${tokenLogo}`)" :alt="tokenSymbol" />
          </div>
        </div>
      </div>
      <div v-for="(project, index) in projects" :key="project.id">
        <links :to="projectRoute(project.id)">
          <div
            class="card"
            :class="{
              first: isFirst(index),
              second: isSecond(index),
              third: isThird(index),
            }"
          >
            <div class="rank">
              {{ index + 1 }}
            </div>
            <div class="project">
              {{ project.name }}
            </div>
            <div class="votes">
              <span class="mobile">Votes: </span>
              <span>{{ getVotes(project.index) }}</span>
            </div>
            <div class="donation">
              <span class="mobile">Donation: </span>
              <span>~{{ getDonation(project.index) }}</span>
              <div class="mobile symbol">
                <img
                  :src="require(`@/assets/${tokenLogo}`)"
                  :alt="tokenSymbol"
                />
              </div>
            </div>
            <div class="funding">
              <span class="mobile">Funding: </span>
              <span class="amount">
                ~{{ formatAmount(project.fundingAmount) }}
              </span>
              <div class="mobile symbol">
                <img
                  :src="require(`@/assets/${tokenLogo}`)"
                  :alt="tokenSymbol"
                />
              </div>
            </div>
          </div>
        </links>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

import Links from '@/components/Links.vue'
import Info from '@/components/Info.vue'
import { Project } from '@/api/projects'
import { BigNumber } from 'ethers'
import { formatAmount } from '@/utils/amounts'
import { getTokenLogo } from '@/utils/tokens'
import { Route } from 'vue-router'

@Component({
  components: {
    Links,
    Info,
  },
})
export default class LeaderboardTable extends Vue {
  @Prop() projects!: Project[]
  @Prop() tokenSymbol!: string
  @Prop() tokenDecimals!: number
  @Prop() votes!: string[]
  @Prop() donations!: string[]
  @Prop() voiceCreditFactor!: BigNumber

  projectRoute(id: string): Partial<Route> {
    return { name: 'project', params: { id } }
  }

  isFirst(index: number) {
    return index === 0
  }

  isSecond(index: number) {
    return index === 1
  }

  isThird(index: number) {
    return index === 2
  }

  getVotes(index: number): string {
    return formatAmount(this.votes[index])
  }

  getDonation(index: number): string {
    const donation = BigNumber.from(this.donations[index]).mul(
      this.voiceCreditFactor
    )
    return formatAmount(donation, this.tokenDecimals, null, 0)
  }

  formatAmount(amount?: BigNumber): string {
    return amount ? formatAmount(amount, this.tokenDecimals, null, 0) : '0'
  }

  get tokenLogo(): string {
    return getTokenLogo(this.tokenSymbol)
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.content {
  font-weight: normal;
  font-weight: 300;
  line-height: 140%;
}

.first {
  color: var(--brand-tertiary);
}
.second {
  color: var(--error-color);
}
.third {
  color: var(--bg-light-color);
}

.info {
  background-color: var(--bg-transparent);
  border: 1px solid $highlight-color;
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 16px;
  font-family: Inter;
  line-height: 150%;
  font-weight: 500;
  display: flex;
  align-items: center;
  font-weight: 300;
  margin-bottom: 2rem;
  gap: 0.5rem;

  @media (max-width: $breakpoint-m) {
    flex-direction: column;
    padding-bottom: 1rem;
    align-items: flex-start;
  }

  .message {
    flex: 1 1 auto;
    text-align: justify;
  }

  .icon {
    font-size: 24px;
    padding: 0.5rem;
    flex: 0 0 auto;
    @media (max-width: $breakpoint-m) {
      padding: 0.5rem 0rem;
    }
  }
}

a {
  .card:hover {
    background: var(--bg-secondary-highlight);
  }
  color: var(--text-body);
}

.card {
  display: grid;
  gap: 1rem;
  text-align: start;
  align-content: start;
  grid-template-columns: auto 3fr 1fr 1fr 1fr;
  grid-template-areas: 'rank project votes donation funding';
  padding: 1rem;

  &.desktop {
    background: var(--bg-light-highlight);
  }

  @media (max-width: $breakpoint-m) {
    grid-template-columns: 1fr;
    gap: 1rem;
    grid-template-areas:
      'rank'
      'project'
      'funding'
      'donation'
      'votes';

    border: 1px solid $highlight-color;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }

  .rank {
    grid-area: rank;
    font-size: 1rem;

    @media (max-width: $breakpoint-m) {
      font-size: 1.5rem;
    }
  }

  .project {
    grid-area: project;
  }

  .funding {
    grid-area: funding;
    text-align: right;
    flex: 1 1 auto;
    @media (max-width: $breakpoint-m) {
      .amount {
        font-size: 1.6rem;
      }
    }
  }

  .donation {
    grid-area: donation;
    text-align: right;
    .mobile {
      img {
        margin-left: 8px;
      }
    }
  }

  .votes {
    grid-area: votes;
    text-align: right;

    @media (max-width: $breakpoint-m) {
      margin-right: 23px;
    }
  }
}

.heading {
  display: flex;
  justify-content: end;
  align-content: end;
  gap: 5px;
}

.symbol {
  display: inline;
  img {
    width: 14px;
  }
}
</style>
