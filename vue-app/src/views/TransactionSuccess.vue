<template>
  <div class="container">
    <div class="hero">
      <image-responsive title="docking" />
      <div class="content">
        <span class="contributed-icon">🎉</span>
        <p
          v-if="$route.params.type === 'reallocation'"
          class="contributed-header"
        >
          {{ formatContribution() }}
          {{ nativeTokenSymbol }} reallocated!
        </p>
        <p
          v-else-if="$route.params.type === 'contribution'"
          class="contributed-header"
        >
          You just contributed!
        </p>
        <div>
          <p
            v-if="$route.params.type === 'reallocation'"
            class="contributed-content"
          >
            Your choices have been updated! You can update your choices again
            any time in the next
            <time-left
              valueClass="contributed-content-bold"
              unitClass="contributed-content-bold"
              :date="votingDeadline"
            />.
          </p>
          <p
            v-else-if="$route.params.type === 'contribution'"
            class="contributed-content"
          >
            Thanks for contributing to the Ethereum ecosystem. If you change
            your mind, you have
            <time-left
              valueClass="contributed-content-bold"
              unitClass="contributed-content-bold"
              :date="votingDeadline"
            />
            to reallocate your contributions.
          </p>
          <div class="receipt" v-if="$route.params.hash">
            <transaction-receipt :hash="$route.params.hash" />
          </div>
          <div class="btn-info" @click="redirectToProjects()">OK</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Libraries
import { BigNumber } from 'ethers'
import Vue from 'vue'
import Component from 'vue-class-component'

// API
import { RoundInfo } from '@/api/round'

// Components
import TransactionReceipt from '@/components/TransactionReceipt.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'

// Utils
import { formatAmount } from '@/utils/amounts'
import { DateTime } from 'luxon'

@Component({
  components: { TransactionReceipt, TimeLeft, ImageResponsive },
})
export default class TransactionSuccess extends Vue {
  get contribution(): BigNumber | null {
    return this.$store.state.contribution
  }

  get currentRound(): RoundInfo | null {
    return this.$store.state.currentRound
  }

  get nativeTokenSymbol(): string {
    return this.currentRound?.nativeTokenSymbol || ''
  }

  get votingDeadline(): DateTime | null {
    return this.currentRound?.votingDeadline || null
  }

  formatContribution() {
    return this.contribution ? formatAmount(this.contribution, 18) : ''
  }

  redirectToProjects() {
    this.$router.push({ name: 'projects' })
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.hero {
  bottom: 0;
  display: flex;
  background: var(--bg-gradient-hero);
  height: calc(100vh - 113px);

  img {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 66%;
    @media (max-width: $breakpoint-m) {
      right: 0;
      width: 100%;
    }
  }
}

.content {
  padding-top: 4rem;
  width: 500px;
  margin: 0 2.5rem;
  z-index: 1;
  @media (max-width: $breakpoint-m) {
    margin: 0 auto;
    width: 80%;
  }
}

.contributed-icon {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 80px;
  line-height: 120%;
}

.contributed-header {
  font-family: 'Glacial Indifference', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 120%;
  margin-right: 0.5rem;
  color: var(--text-color);
}

.contributed-content {
  font-family: 'Inter', 'sans-serif';
  font-style: normal;
  font-weight: normal;
  line-height: 150%;
}

.contributed-content-bold {
  font-weight: bold;
}

.receipt {
  margin: 16px 0;
}

.banner-content {
  padding: 0.5rem;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  .mobile {
    font-weight: normal;
  }

  a {
    color: #ff641f;
  }
}
</style>
