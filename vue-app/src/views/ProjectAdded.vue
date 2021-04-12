@ -0,0 +1,36 @@
<template>
  <div id="page">
    <div class="hero">
      <div class="content">
        <progress-bar :currentStep="6" :totalSteps="6" />
        <h1>Project added</h1>
        <div id="subtitle" class="subtitle">You’re on board this funding round!</div>

        <p>Your project will be added to the next round and be visible in a few minutes. Check back soon to see your live project.</p>
        <router-link to="/projects"><button class="btn btn-primary">View project</button></router-link>
        <router-link to="/"><button class="btn btn-shell">Go home</button></router-link>
      </div>
      <img src="@/assets/newrings.png" width="100%"/>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
// import CriteriaModal from '@/components/CriteriaModal.vue'
// import ProgresssBar from '@/components/ProgressBar.vue'

@Component({
  name: 'projectAdded',
  metaInfo: { title: 'project added' },
})

export default class ProjectAdded extends Vue {
  startDate = '03 April' // TODO: use Date() object
  timeRemaining = '17 days' // TODO: startDate - new Date() -> parse to days/hours/minutes accordinging
}

</script>

<style scoped lang="scss">
@import '../styles/vars';

#page > div {
  /* padding: $content-space; */
}

.content {
  padding: $content-space;
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

ol {
  list-style: none;
  counter-reset: li-counter;
  padding-left: 3rem;
}

ol li {
  margin: 0 0 0.5rem 0;
  counter-increment: li-counter;
  position: relative;
  max-width: calc(100vw - (2 * $content-space));
}
ol li::before {
  content: counter(li-counter); 
  position: absolute;
  top: 0.5rem;
  left: -3rem;
  line-height: 2rem;
  width: 2rem;
  height: 2rem;
  font-family: Inter;
  font-style: normal;
  font-weight: bold;
  font-size: 16px;
  line-height: 100%;
  border-radius: 50%;
  color: white;
  background: #2A2736;
  border: 2px solid #9789C4;
  box-sizing: border-box;
  text-align: center;
  vertical-align: middle;
}

.btn {
  padding: 0.5rem 1.5rem;
  margin: 0 auto;
  border-radius: 2rem;
  color: white;
  font-family: Inter;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 150%;
  text-align: center;
  background: none;
  border: none;
}

.btn-shell {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid #FFFFFF;
  margin-bottom: 1rem;
  width: 100%;

}
.btn-hero-primary {
  background: linear-gradient(109.01deg, #9789C4 6.45%, #C72AB9 99.55%);
}

.btn-primary {
  background: #16C8B5;
  width: 100%;
}

.link-primary {
  color: #16C8B5;
}

.link-li {
  color: white;
  text-decoration: underline;
  margin-bottom: 1rem;
  font-size: 16px;
}

.btn-secondary {
  background: $clr-green-gradient;
}

#optimism {
  background: $clr-pink-dark-gradient-bg;
}

#bright-id {
  background: $clr-blue-gradient-bg;
}

.caps {
  text-transform: uppercase;
}

#page > #waiting-banner {
  display: flex;
  height: 48px;
  justify-content: space-between;
  padding: 1rem 2rem;
  align-items: center;
  margin-top: 1rem;
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

#about-2 {
  background: $bg-secondary-color;
}

#about-3 {
  background: $bg-light-color;
}

#subtitle {
  font-size: 20px;
}

#section-how-it-works {
 /* background-image */
}

#btn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

#dai-drip {
  max-width: 100%;
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

#footer {
    max-width: 100vw;
    padding: $content-space;
    > li {
      list-style-type: none;
    }
  }

</style>