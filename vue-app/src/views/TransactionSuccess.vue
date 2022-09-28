<template>
  <div class="container">
    <div class="image-wrapper">
      <image-responsive title="docking" />
    </div>
    <div id="banner">
      <div class="banner-content">
        <span class="desktop"
          >Join us at the<links :to="partyUrl">
            Quadratic Funding Community Par-tay</links
          ></span
        >
        <span class="mobile"
          >Join us at the<links :to="partyUrl">
            QF Community Par-tay</links
          ></span
        >
      </div>
    </div>
    <div class="dropshadow">
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
import Links from '@/components/Links.vue'

// Utils
import { formatAmount } from '@/utils/amounts'
import { DateTime } from 'luxon'

@Component({
  components: { TransactionReceipt, TimeLeft, ImageResponsive, Links },
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

  get partyUrl(): string {
    return 'https://docs.google.com/forms/d/1I1lV0h7p_ygvQOClq_Ipg0B7rY8wGfAtR_Z1Zk_NHaE/viewform?edit_requested=true'
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
  position: relative;
}

.image-wrapper {
  position: absolute;
  height: 100vh;
  background: var(--bg-gradient);
  width: 100%;
  display: flex;
  justify-content: center;
}

.image-wrapper .docking {
  height: 95%;
  transform: rotate(15deg);
  @media (max-width: $breakpoint-m) {
    transform: translateX(-6em) translateY(3em) rotate(15deg);
  }
}

.dropshadow {
  position: relative;
  @include gradientBackground(
    180deg,
    rgba(var(--shadow-dark-rgb), 0.4),
    56.5%,
    rgba(var(--shadow-light-rgb), 0),
    75.75%
  );
  height: 80vh;
}

.content {
  padding-top: 4rem;
  width: 500px;
  margin: 0 2.5rem;
  @media (max-width: $breakpoint-m) {
    margin: auto;
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
}

.button-wrapper {
  display: inline-block;
  margin-left: 10px;
}
</style>
