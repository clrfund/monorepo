@ -0,0 +1,36 @@
<template>
  <div>
    <round-status-banner />
    <div class="gradient">
      <div class="hero">
        <img src="@/assets/core.png" width="100%" />
        <div class="content" v-if="full">
          <div style="font-size: 64px;">☹</div>
          <h1>Sorry, this round is full</h1>
          <div id="subtitle" class="subtitle">
            The tech we use to protect you from bribery and collusion, MACI, limits the number of projects right now. Unfortunately we've hit the cap and there's no more room on board.
          </div> 
          <div class="subtitle" id="subtitle" style="margin-top: 2rem;">
            We'll be running another round of funding very soon. Follow on Twitter for updates: <a href="https://twitter.com/ethdotorg">@ethdotorg</a>
          </div>
          <div class="btn-container" style="margin-top: 2.5rem;">
            <!-- <router-link to="/join/one" class="btn-primary">Add project</router-link> -->
            <router-link to="/" class="btn-primary">Home</router-link>
            <router-link to="#" class="btn-secondary">More on MACI</router-link>
          </div> 
        </div>
        <div class="content" v-else-if="closed">
          <div style="font-size: 64px;">☹</div>
          <h1>Sorry, the round is closed</h1>
          <div id="subtitle" class="subtitle">
            Our smart contracts are busy tallying contributions so it's too late to get on board.
          </div> 
          <div class="subtitle" id="subtitle" style="margin-top: 2rem;">
            We'll be running another round of funding very soon. Follow on Twitter for updates: <a href="https://twitter.com/ethdotorg">@ethdotorg</a>
          </div>
          <div class="btn-container" style="margin-top: 2.5rem;">
            <!-- <router-link to="/join/one" class="btn-primary">Add project</router-link> -->
            <router-link to="/" class="btn-primary">Home</router-link>
          </div> 
        </div>
        <div class="content" v-else>
          <h1>Join the next funding round</h1>
          <div id="subtitle" class="subtitle">To get on board this round, we’ll need some information about your project and a 0.1 ETH security deposit.</div>
          <div id="info-boxes">
            <div id="apply-callout">
              <div id="countdown-label" class="caps">Time left to join</div>
              <div id="countdown" class="caps">11 days</div>
            </div> 
            <div id="apply-callout">
              <div id="countdown-label" class="caps">Time to complete</div>
              <div id="countdown" class="caps">15 minutes (ish)</div>
            </div> 
          </div>
          <div class="btn-container">
            <button class="btn-secondary" @click="seeCriteria()">See round criteria</button>
            <!-- <router-link to="/join/one" class="btn-primary">Add project</router-link> -->
            <router-link to="/join/project" class="btn-primary">Add project</router-link>
          </div>
        </div> 
      </div>
    </div>
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
  components: { RoundStatusBanner },
})

export default class JoinLanding extends Vue {
  startDate = '03 April' // TODO: use Date() object
  timeRemaining = '17 days' // TODO: startDate - new Date() -> parse to days/hours/minutes accordinging
  full = false
  closed = false
  seeCriteria(): void {
    this.$modal.show(
      CriteriaModal,
      { },
      { width: 500 },
    )
  }
}

</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';


.content {
  position: relative;
  z-index: 1;
  padding: $content-space;
  width: min(100%, 512px);
  margin-left: 2rem;
  margin-top: 4rem;
  @media (max-width: ($breakpoint-m + 1px)) {
    width: 100%;
    margin: 0;
  }
}

h1 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 40px;
  line-height: 120%;
}

.gradient {
  background: $clr-pink-dark-gradient;
}
.hero {
  position: relative;
  display: flex;
  background: linear-gradient(286.78deg, rgba(173, 131, 218, 0) -32.78%, #191623 78.66%);
  height: calc(100vh - 113px);
}

.hero img {
  position: absolute;
  bottom: 0;
  right: -128px;
  mix-blend-mode: exclusion;
  /* width: 100%; */
  width: 88%;
  @media (max-width: ($breakpoint-m + 1px)) {
  right: 0;
  width: 100%;
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