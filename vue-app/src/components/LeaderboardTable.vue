<template>
  <div>
    <div class="info">
      <span class="icon" aria-label="info icon">ℹ</span>
      The funding column below shows the total amount awarded to each project
      calculated using the quadratic funding formula, &alpha;(V)&sup2; + (1-
      &alpha;)D; where V is the votes, D is the donations and &alpha; is the
      quadratic funding ratio calculated based on the matching pool size and
      total donation amount. Note: for simplicity, votes shown below have not
      been adjusted by the precision factor and voice credit factor which are
      used to manage precision loss and MACI limitation.
    </div>

    <table>
      <thead>
        <tr>
          <th class="right">#</th>
          <th class="left">Project</th>
          <th class="right">Votes</th>
          <th>
            <div class="row">
              <div>Donations</div>
              <img :src="require(`@/assets/${tokenLogo}`)" :alt="tokenSymbol" />
            </div>
          </th>
          <th>
            <div class="row">
              <div>Funding</div>
              <img :src="require(`@/assets/${tokenLogo}`)" :alt="tokenSymbol" />
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          @click="gotoProject(project.id)"
          v-for="(project, index) in projects"
          :key="project.id"
          class="project"
          :class="{
            first: isFirst(index),
            second: isSecond(index),
            third: isThird(index),
          }"
        >
          <td class="right">
            {{ index + 1 }}
          </td>
          <td class="project-name">
            {{ project.name }}
          </td>
          <td class="right">{{ getVotes(project.index) }}</td>
          <td class="right">~{{ getDonation(project.index) }}</td>
          <td class="right">~{{ formatAmount(project.fundingAmount) }}</td>
        </tr>
      </tbody>
    </table>
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

  gotoProject(id: string): void {
    this.$router.push({ name: 'project', params: { id } })
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

tbody {
  tr:hover {
    background-color: var(--bg-light-highlight);
  }
  color: var(--text-body);
}
.project {
  font-weight: normal;
  font-size: 14px;
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

.project-name {
  overflow-wrap: break-word;
}

.right {
  text-align: right;
}

.left {
  text-align: left;
}

table {
  width: 100%;
  border-collapse: collapse;
}

td,
th {
  padding: 5px;
  vertical-align: top;
}

th {
  img {
    display: inline;
    width: 14px;
  }
  background-color: var(--bg-light-highlight);
}

.inline {
  display: inline-block;
}

.row {
  display: flex;
  column-gap: 5px;
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
}

.icon {
  font-size: 24px;
  padding: 0.5rem;
  @media (max-width: $breakpoint-m) {
    padding: 0.5rem 0rem;
  }
}
</style>
