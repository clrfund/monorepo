@ -0,0 +1,36 @@
<template>
  <div>
    <div class="gradient">
      <div class="hero">
        <image-responsive title="robot" />
      </div>
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
          You’re on board this funding round! And fully verified for BrightID –
          you’ll never have to do that again.
        </div>
        <p class="text-base">
          You can now start contributing to your favorite projects.
        </p>
        <div class="button-spacing">
          <links to="/projects" class="btn-action">View projects</links>
          <links to="/" class="btn-link">Go home</links>
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
import ImageResponsive from '@/components/ImageResponsive.vue'

@Component({
  components: {
    ProgressBar,
    RoundStatusBanner,
    Links,
    TransactionReceipt,
    ImageResponsive,
  },
})
export default class Verified extends Vue {}
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
    margin-bottom: 3rem;
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
  display: flex;
  justify-content: space-between;
  gap: 1rem;

  a {
    width: 100%;
  }
}
</style>
