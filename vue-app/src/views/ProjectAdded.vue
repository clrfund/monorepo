@ -0,0 +1,36 @@
<template>
  <div>
    <round-status-banner />
    <div class="gradient">
      <img src="@/assets/moon.png" class="moon"/>
      <div class="hero">
        <img src="@/assets/newrings.png"/>
        <div class="content">
          <span class="emoji">🎉</span>
          <div class="flex-title">
            <h1>Project added!</h1>
            <a v-if="txHash" :href="blockExplorerUrl" target="_blank">View on Etherscan ↗</a>
          </div>
          <div class="subtitle">You’re on board this funding round!</div>
          <p>Your project will be added to the next round and be visible in a few minutes. Check back soon to see your live project.</p>
          <div class="contact">
            <div>
              For round updates, be sure to follow us on Twitter:
              <a href="https://twitter.com/ethdotorg" target="_blank">@ethdotorg</a>
            </div>
          </div>
          <div class="btn-container">
            <router-link to="/projects" class="btn-primary">View projects</router-link>
            <router-link to="/" class="btn-secondary">Go home</router-link>
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
import { blockExplorer } from '@/api/core'

@Component({
  name: 'projectAdded',
  metaInfo: { title: 'project added' },
  components: { ProgressBar, RoundStatusBanner },
})
export default class ProjectAdded extends Vue {
  startDate = '03 April' // TODO: use Date() object
  timeRemaining = '17 days' // TODO: startDate - new Date() -> parse to days/hours/minutes accordinging
  
  // TODO: Retrieve hash of transaction. 
  // We route to this component, pass hash as queryParam after submission?
  txHash = '0xfakehashf7261d65be24e7f5cabefba4a659e1e2e13685cc03ad87233ee2713d'
  
  get blockExplorerUrl(): string {
    return `${blockExplorer}${this.txHash}`
  }
}

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
  line-height: 120%;
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
    background: linear-gradient(286.78deg, rgba(173, 131, 218, 0) -32.78%, #191623 78.66%);
    height: calc(100vh - 113px);
    @media (max-width: $breakpoint-m) {
      padding: 2rem 0rem;
    }
    
    img {
      position: absolute;
      bottom: 0;
      right: -128px;
      mix-blend-mode: exclusion;
      width: 88%;
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
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3rem;
        @media (max-width: $breakpoint-m) {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    }
  }
}

.contact {
  background: #191623E6;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 2rem 0rem;
  border: 1px solid black;
  display: flex;
  gap: 0.5rem;  
}

.subtitle {
  font-size: 1.25rem;
}

.icon {
  width: 1rem;
  height: 1rem;
}


</style>