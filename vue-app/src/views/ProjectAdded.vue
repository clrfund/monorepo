@ -0,0 +1,36 @@
<template>
  <div>
    <round-status-banner />
    <div class="gradient">
      <div class="hero">
        <img src="@/assets/newrings.png" width="100%" />
        <div class="content">
          <span class="emoji">🎉</span>
          <h1>Project added!</h1>
          <div id="subtitle" class="subtitle">You’re on board this funding round!</div>
          <p>Your project will be added to the next round and be visible in a few minutes. Check back soon to see your live project.</p>
          <div class="contact">
            <div>For round updates, be sure to follow us on Twitter: 
            <a href="https://twitter.com/ethdotorg">@ethdotorg </a></div>
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

@Component({
  name: 'projectAdded',
  metaInfo: { title: 'project added' },
  components: { ProgressBar, RoundStatusBanner },
})
export default class ProjectAdded extends Vue {
  startDate = '03 April' // TODO: use Date() object
  timeRemaining = '17 days' // TODO: startDate - new Date() -> parse to days/hours/minutes accordinging
}

</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

#page > div {
  /* padding: $content-space; */
}

.content {
  position: relative;
  z-index: 1;
  padding: $content-space;
  width: min(100%, 512px);
  margin-left: 2rem;
  margin-top: 3rem;
  @media (max-width: ($breakpoint-m + 1px)) {
    width: 100%;
    margin: 0;
  }
}

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
}
.hero {
  position: relative;
  display: flex;
  background: linear-gradient(286.78deg, rgba(173, 131, 218, 0) -32.78%, #191623 78.66%);
  height: calc(100vh - 113px);
  @media (max-width: ($breakpoint-m + 1px)) {
    padding: 4rem 0rem;
  }
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

.contact {
  background: #191623E6;
  border-radius: 8px;
  padding: 1rem;
  margin: 2rem 0rem;
  border: 1px solid black;
  display: flex;
  gap: 0.5rem;  
}

#subtitle {
  font-size: 20px;
}

.icon {
  width: 1rem;
  height: 1rem;
}


</style>