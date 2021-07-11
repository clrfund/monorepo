<template>
  <div>
    <div class="image-wrapper">
      <img src="@/assets/docking.png" />
    </div>
    <div class="content">
      <span class="contributed-icon">🎉</span>
      <p
        v-if="$route.params.type === 'reallocation'"
        class="contributed-header"
      >
        {{ formatContribution() }}
        {{ $store.state.currentRound.nativeTokenSymbol }} reallocated!
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
          Your choices have been updated! You can update your choices again any
          time in the next
          <span class="contributed-content-bold"
            >{{ reallocationTimeLeft.days }} days
            {{ reallocationTimeLeft.hours }} hours</span
          >.
        </p>
        <p
          v-else-if="$route.params.type === 'contribution'"
          class="contributed-content"
        >
          Thanks for contributing to the Eth2 ecosystem. If you change your
          mind, you have
          <span class="contributed-content-bold"
            >{{ reallocationTimeLeft.days }} days
            {{ reallocationTimeLeft.hours }} hours</span
          >
          to reallocate your contributions.
        </p>
        <div class="receipt">
          <transaction-receipt :hash="`${$route.params.hash}`" />
        </div>
        <div class="input-button">
          <button class="contributed-button" @click="redirectToProjects()">
            <span>OK</span>
          </button>
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
import { RoundInfo, TimeLeft } from '@/api/round'

// Components
import TransactionReceipt from '@/components/TransactionReceipt.vue'

// Utils
import { formatAmount } from '@/utils/amounts'
import { getTimeLeft } from '@/utils/dates'

@Component({
  components: { TransactionReceipt },
})
export default class TransactionSuccess extends Vue {
  get contribution(): BigNumber | null {
    return this.$store.state.contribution
  }

  get currentRound(): RoundInfo | null {
    return this.$store.state.currentRound
  }

  get reallocationTimeLeft(): TimeLeft | string {
    return this.currentRound
      ? getTimeLeft(this.currentRound.votingDeadline)
      : ''
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

.image-wrapper {
  position: fixed;
  height: 100vh;
  background: $clr-pink-dark-gradient;
  width: 100%;
  display: flex;
  justify-content: center;
  margin: -2.5em;
  @media (max-width: $breakpoint-m) {
    margin: -2em;
  }
}

.image-wrapper img {
  height: 95%;
  mix-blend-mode: exclusion;
  transform: translateX(-6em) translateY(3em) rotate(15deg);
}

.content {
  position: fixed;
  height: 100%;
  padding-top: 4rem;
  margin-right: 2.5rem;
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
  width: 230px;
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
