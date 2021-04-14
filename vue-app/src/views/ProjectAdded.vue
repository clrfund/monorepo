@ -0,0 +1,36 @@
<template>
  <div>
    <round-status-banner />
    <div class="gradient">
      <div class="hero">
        <img src="@/assets/newrings.png" width="100%"/>
        <div class="content">
          <span class="emoji">🎉</span>
          <h1>Project added!</h1>
          <div id="subtitle" class="subtitle">You’re on board this funding round!</div>
          <p>Your project will be added to the next round and be visible in a few minutes. Check back soon to see your live project.</p>
          <div class="btn-container">
            <router-link to="/projects" class="btn-primary">View projects</router-link>
            <router-link to="/" class="btn-secondary">Go home</router-link>
          </div>
          <div class="contact">
            <p style="margin: 0; margin-bottom: 1rem;">Give us a contact email so we can let you know important updates about the round and/or your project.</p>
            <div>
              <label for="contact" class="input-label">Contact email (optional)</label>
            </div>
            <div style="display: flex; gap: 1rem; align-items: center;">
              <input type="email" class="input" id="contact" placeholder="vitalik@ethereum.org" /> 
              <submit class="btn primary">Add email</submit>
            </div>
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
  background: $bg-secondary-color;
  border-radius: 8px;
  padding: 1rem;
  opacity: 0.8;
  margin: 2rem 0rem;
  border: 2px solid $bg-light-color;
}

#subtitle {
  font-size: 20px;
}


.input {
  border-radius: 16px;
  border: 2px solid $button-color;
  background-color: $bg-secondary-color;
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0em;
  &:valid { 
    border: 2px solid $clr-green;
  }
  &:hover { 
    background: $bg-primary-color; 
    border: 2px solid $highlight-color;
    box-shadow: 0px 4px 16px 0px 25,22,35,0.4;
  }
  &:optional {
    border: 2px solid $button-color;
    background-color: $bg-secondary-color;
  }
}
.input.invalid {
  border: 2px solid $error-color; 
}

.input-description {
  margin-top: 0.25rem;
  font-size: 14px;
  font-family: Inter;
  margin-bottom: 0.5rem;
}

.input-label {
  font-family: Inter;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0em;
  text-align: left;
  margin: 0;
}

</style>