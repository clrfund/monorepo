@ -0,0 +1,36 @@
<template>
  <div>
    <round-status-banner />
    <div id="hero" style="display: flex;">
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
        <button class="btn-secondary" @click="seeCriteria()">See round criteria</button>
        <router-link to="/join/one" class="btn-primary">Add project</router-link>
      </div>
      <img src="@/assets/newrings.png" width="100%"/>
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
  padding: $content-space;
  background: $bg-primary-color;
}

h1 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 40px;
  line-height: 120%;
}

.hero {
  background: $clr-pink-dark-gradient;
}

.hero img {
    mix-blend-mode: exclusion;
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