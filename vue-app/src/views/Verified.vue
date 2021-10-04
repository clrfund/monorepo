@ -0,0 +1,36 @@
<template>
  <div>
    <round-status-banner />
    <!-- TODO: add confetti -->
    <div class="gradient">
      <img src="@/assets/moon.png" class="moon" />
      <div class="hero">
        <img src="@/assets/newrings.png" />
        <div class="content">
          <span class="emoji">🎉</span>
          <div class="flex-title">
            <h1>Ready to contribute!</h1>
            <transaction-receipt
              v-if="$route.params.hash"
              :hash="$route.params.hash"
            />
          </div>
          <div class="subtitle">
            You’re on board this funding round! And fully verified for BrightID
            – you’ll never have to do that again.
          </div>
          <p>You can now start contributing to your favorite projects.</p>
          <div class="mt2 button-spacing">
            <links to="/projects" class="btn-primary">View projects</links>
            <links to="/" class="btn-secondary">Go home</links>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import ProgressBar from '@/components/ProgressBar.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import Links from '@/components/Links.vue'
import TransactionReceipt from '@/components/TransactionReceipt.vue'

@Component({
  components: { ProgressBar, RoundStatusBanner, Links, TransactionReceipt },
})
export default class Verified extends Vue {}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.emoji {
  font-size: 40px;
}

h1 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 40px;
  line-height: 150%;
  margin: 0;
}

h2 {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 24px;
  letter-spacing: -0.015em;
}

p {
  font-size: 16px;
  line-height: 30px;
}

li {
  font-size: 16px;
  line-height: 30px;
}

ul {
  padding-left: 1.5rem;
}

.gradient {
  background: $clr-pink-dark-gradient;
  position: relative;

  .moon {
    position: absolute;
    top: 1rem;
    right: 1rem;
    mix-blend-mode: exclusion;
  }
  .hero {
    bottom: 0;
    display: flex;
    background: linear-gradient(
      286.78deg,
      rgba(173, 131, 218, 0) -32.78%,
      #191623 78.66%
    );
    height: calc(100vh - 113px);
    @media (max-width: $breakpoint-m) {
      padding: 2rem 0rem;
      padding-bottom: 16rem;
    }

    img {
      position: absolute;
      bottom: 0;
      right: 0;
      mix-blend-mode: exclusion;
      width: 66%;
      @media (max-width: $breakpoint-m) {
        right: 0;
        width: 100%;
      }
    }

    .content {
      position: relative;
      z-index: 1;
      padding: $content-space;
      width: min(100%, 512px);
      margin-left: 2rem;
      margin-top: 3rem;
      @media (max-width: $breakpoint-m) {
        width: 100%;
        margin: 0;
      }

      .flex-title {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-bottom: 3rem;
        margin-top: 1.5rem;
        flex-wrap: wrap;
        max-width: 600px; // Max width to allow for flex wrap
      }
    }
  }
}

.subtitle {
  font-size: 1.25rem;
}

.icon {
  width: 1rem;
  height: 1rem;
  position: relative;
}

.button-spacing {
  height: 6.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
