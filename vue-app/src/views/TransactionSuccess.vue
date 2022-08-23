<template>
  <div>
    <div class="gradient">
      <div class="hero">
        <image-responsive title="robot" />
      </div>
      <div class="content">
        <span class="emoji">🎉</span>
        <div class="flex-title">
          <h1 v-if="$route.params.type === 'reallocation'">
            {{ formatContribution() }}
            {{ currentRound.nativeTokenSymbol }} reallocated!
          </h1>

          <h1 v-else-if="$route.params.type === 'contribution'">
            You just contributed!
          </h1>
        </div>
        <p v-if="$route.params.type === 'reallocation'" class="subtitle">
          Your choices have been updated! You can update your choices again any
          time in the next
          <time-left
            valueClass="subtitle"
            unitClass="subtitle"
            :date="currentRound.votingDeadline"
          />.
        </p>
        <p v-else-if="$route.params.type === 'contribution'" class="subtitle">
          Thanks for contributing to the Ethereum ecosystem. If you change your
          mind, you have
          <time-left
            valueClass="subtitle"
            unitClass="subtitle"
            :date="currentRound.votingDeadline"
          />
          to reallocate your contributions.
        </p>
        <transaction-receipt
          v-if="$route.params.hash"
          :hash="$route.params.hash"
        />
        <div class="button-spacing">
          <div class="btn-action" @click="redirectToProjects()">OK</div>
        </div>
      </div>
    </div>
  </div>
  <!-- <div class="container">
    <div class="image-wrapper">
      <image-responsive title="robot" />
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
            Thanks for contributing to the Ethereum ecosystem. If you change
            your mind, you have
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
          <div class="btn-info" @click="redirectToProjects()">OK</div>
        </div>
      </div>
    </div>
  </div> -->
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

.emoji {
  font-size: 7rem;
}

h1 {
  margin-top: 1.5rem;
}

.gradient {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  background: $clr-green;

  .hero {
    position: fixed;
    bottom: -4rem;
    right: -12rem;
    height: 100%;
    width: 100%;
    mix-blend-mode: luminosity;

    @media (max-width: $breakpoint-m) {
      width: 100%;
      padding-bottom: 0rem;
    }

    img {
      position: absolute;
      bottom: 0;
      right: calc(-700px + 50vw);
      mix-blend-mode: luminosity;
      max-width: 88%;
      max-height: 100%;

      @media (max-width: $breakpoint-m) {
        right: 1rem;
        width: 100%;
      }
    }
  }
}

.content {
  position: relative;
  z-index: 1;
  padding: $content-space;
  width: min(100%, 512px);
  margin-left: 2rem;
  margin-top: 6rem;
  color: $clr-white;

  @media (max-width: $breakpoint-m) {
    width: 100%;
    margin: 0;
  }

  .flex-title {
    display: flex;
    gap: 0.5rem;
    align-items: left;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    flex-direction: column;

    img {
      width: 1rem;
      height: 1rem;
      position: relative;
      right: 0;
    }
  }
}

.icon {
  width: 1rem;
  height: 1rem;
  position: relative;
}

.button-spacing {
  margin-top: 3rem;
  max-width: 120px;
  gap: 1rem;

  a {
    width: 100%;
  }
}
</style>
