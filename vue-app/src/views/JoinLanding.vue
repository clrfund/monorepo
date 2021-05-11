@ -0,0 +1,36 @@
<template>
  <div>
    <div class="gradient">
      <div class="hero">
        <img src="@/assets/core.png" width="100%" />
      </div>
    </div>  
    <round-status-banner />
    <div class="content">
      <h1>Join the next funding round</h1>
      <div id="subtitle" class="subtitle">We’ll need some information about your project and a 0.1 ETH security deposit.</div>
      <div id="info-boxes">
        <div id="apply-callout">
          <div id="countdown-label" class="caps">Joining close</div>
          <div id="countdown" class="caps">11 days</div>
        </div> 
        <div id="apply-callout">
          <div id="countdown-label" class="caps">Time to complete</div>
          <div id="countdown" class="caps">15 minutes (ish)</div>
        </div> 
      </div>
      <div class="btn-container">
        <button class="btn-secondary" @click="toggleCriteria()">See round criteria</button>
        <!-- <router-link to="/join/one" class="btn-primary">Add project</router-link> -->
        <router-link to="/join/project" class="btn-primary">Add project</router-link>
      </div>
    </div>
    <criteria-modal v-if="showCriteriaPanel" :toggleCriteria="toggleCriteria" />
  </div>  
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import CriteriaModal from '@/components/CriteriaModal.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'

@Component({
  name: 'join',
  metaInfo: { title: 'Join' },
  components: { RoundStatusBanner, CriteriaModal },
})

export default class JoinLanding extends Vue {
  startDate = '03 April' // TODO: use Date() object
  timeRemaining = '17 days' // TODO: startDate - new Date() -> parse to days/hours/minutes accordinging
  showCriteriaPanel = false

  toggleCriteria(): void {
    this.showCriteriaPanel = !this.showCriteriaPanel
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

h1 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 40px;
  line-height: 120%;
}

.gradient {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  background: $clr-pink-dark-gradient;
}

.hero {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  display: flex;
  background: linear-gradient(286.78deg, rgba(173, 131, 218, 0) -32.78%, #191623 78.66%);
  @media (max-width: ($breakpoint-m)) {
    width: 100%;
    padding-bottom: 0rem;
  }
}

.hero img {
  position: absolute;
  bottom: 0;
  right: -128px;
  mix-blend-mode: exclusion;
  width: 88%;
  @media (max-width: ($breakpoint-m)) {
    right: 0;
    width: 100%;
  }
}

.content {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  padding: $content-space;
  width: min(100%, 512px);
  margin-left: 2rem;
  margin-top: 4rem;
  @media (max-width: ($breakpoint-m)) {
    width: 100%;
    margin: 0;
    padding-bottom: 10rem;
  }
}

#countdown {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 32px;
  letter-spacing: -0.015em;
}

#countdown-label {
  font-family: Glacial Indifference;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 21px;
  letter-spacing: 6px;
  text-align: left;
  margin-bottom: 0.5rem;
}


#subtitle {
  font-size: 20px;
}

#apply-callout {
  background: $bg-transparent;
  border: 2px solid #9789C4;
  box-sizing: border-box;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  &:first-of-type {
    margin-top: 2rem;
  }
}

#info-boxes {
  margin-bottom: 2rem; 
}

</style>