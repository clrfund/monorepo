<template>
  <div class="container">
    <div class="image-wrapper">
      <img
        src="@/assets/docking/docking_w1080.png"
        sizes="(max-width: 1440px) 100vw, 1440px"
        srcset="
          ../assets/docking/docking_w360.png   360w,
          ../assets/docking/docking_w720.png   720w,
          ../assets/docking/docking_w1080.png 1080w,
          ../assets/docking/docking_w1440.png 1440w,
          ../assets/docking/docking_w2160.png 2160w,
          ../assets/docking/docking_w2880.png 2880w
        "
      />
      <img class="money" src="@/assets/money.gif" />
      <img class="money" src="@/assets/confetti.gif" />
    </div>
    <div class="dropshadow">
      <div class="content">
        <span class="contributed-icon">🎉</span>
        <p
          v-if="$route.params.type === 'reallocation'"
          class="contributed-header"
        >
          {{ formatContribution() }}
          {{ currentRound.nativeTokenSymbol }} reallocated!
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
              :date="currentRound.votingDeadline"
            />.
          </p>
          <p
            v-else-if="$route.params.type === 'contribution'"
            class="contributed-content"
          >
            Thanks for contributing to the Eth2 ecosystem. If you change your
            mind, you have
            <time-left
              valueClass="contributed-content-bold"
              unitClass="contributed-content-bold"
              :date="currentRound.votingDeadline"
            />
            to reallocate your contributions.
          </p>
          <div class="receipt" v-if="$route.params.hash">
            <transaction-receipt :hash="$route.params.hash" />
          </div>
          <div class="input-button">
            <button class="contributed-button" @click="redirectToProjects()">
              <span>OK</span>
            </button>
          </div>
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

// Utils
import { formatAmount } from '@/utils/amounts'

@Component({
  components: { TransactionReceipt, TimeLeft },
})
export default class TransactionSuccess extends Vue {
  get contribution(): BigNumber | null {
    return this.$store.state.contribution
  }

  get currentRound(): RoundInfo | null {
    return this.$store.state.currentRound
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

.container {
  position: relative;
}

.image-wrapper {
  position: fixed;
  height: 100vh;
  background: $clr-pink-dark-gradient;
  width: 100%;
  display: flex;
  justify-content: center;
}

.image-wrapper .docking {
  height: 95%;
  mix-blend-mode: exclusion;
  transform: rotate(15deg);
  @media (max-width: $breakpoint-m) {
    transform: translateX(-6em) translateY(3em) rotate(15deg);
  }
}

.image-wrapper .money {
  position: fixed;
  width: 100%;
  mix-blend-mode: exclusion;
}

.dropshadow {
  position: relative;
  background: linear-gradient(
    171.34deg,
    rgba(0, 0, 0, 0.4) 56.5%,
    rgba(196, 196, 196, 0) 75.75%
  );
}

.content {
  padding-top: 4rem;
  width: 500px;
  margin: 0 2.5rem;

  @media (max-width: $breakpoint-s) {
    margin: auto;
    width: 300px;
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
  color: $text-color;
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

.input-button {
  background: #f7f7f7;
  border-radius: 2rem;
  border: 2px solid $bg-primary-color;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: black;
  padding: 0.125rem;
  margin-bottom: 1rem;
  z-index: 100;
}

.contributed-button {
  background: $bg-primary-color;
  color: white;
  border-radius: 32px;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  line-height: 150%;
  border: none;
  width: 100%;
  text-align: center;
  box-shadow: 0px 4px 4px 0px 0, 0, 0, 0.25;
  z-index: 1;
  cursor: pointer;
  &:hover {
    background: $bg-light-color;
  }
}
</style>
