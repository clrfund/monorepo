<template>
  <div>
    <round-status-banner />
    <div id="page">
      <div id="hero">
        <img src="@/assets/moon.png" id="moon" />
        <div class="image-wrapper">
          <img src="@/assets/docking.png" />
        </div>
        <div>
          <div class="hero-content">
            <h1>Send your favorite Eth2 projects to the moon!</h1>
            <div id="subtitle" class="subtitle">
              Every project you contribute to gets a portion of extra funding.
            </div>
            <div class="btn-group">
              <links to="/projects" class="btn-action">Go to app</links>
              <div class="btn-white" @click="scrollToHowItWorks">
                How it works
              </div>
            </div>
          </div>
          <div
            class="apply-callout"
            v-if="
              $store.getters.isRoundJoinPhase &&
              !$store.getters.isRecipientRegistryFull
            "
          >
            <div class="column">
              <h2>Join the funding round</h2>
              <p>
                Add your project to the next funding round. If you're working on
                anything related to Eth2, you can join in.
              </p>
              <div class="button-group">
                <links to="/join" class="btn-primary w100">{{
                  joinButtonText
                }}</links>
                <div v-if="signUpDeadline">
                  <time-left unitClass="none" :date="signUpDeadline" />
                  to join
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="section-how-it-works">
        <div class="wormhole-wrapper desktop-l">
          <img
            src="@/assets/wormhole.png"
            alt="Image of spaceships funneling through a wormhole and getting bigger"
            class="wormhole"
          />
        </div>
        <div id="how-it-works-content">
          <h2>Every donation is amplified by the matching pool.</h2>
          <p>
            This fundraiser rewards projects with the most unique demand, not
            just those with the wealthiest backers.
          </p>
          <img
            src="@/assets/wormhole.png"
            alt="Image of spaceships funneling through a wormhole and getting bigger"
          />
          <h2>How it works</h2>
          <ol>
            <li>
              The Ethereum Foundation and other donors send funds to the
              matching pool smart contract.
            </li>
            <li>
              The round begins and you can donate to your favorite projects.
            </li>
            <li>
              Once the round finishes, the smart contract distributes the
              matching pool funds to projects based primarily on number of
              contributions, <strong>not contribution value</strong>.
            </li>
          </ol>
          <links class="btn-secondary" to="/about/how-it-works"
            >How the round works</links
          >
        </div>
      </div>
      <div class="section-header">
        <h2>What you'll need</h2>
      </div>
      <div id="what-you-will-need">
        <div class="pre-req" id="arbitrum">
          <div class="icon-row">
            <img src="@/assets/arbitrum.png" id="arbitrum-icon" />
            <p><b>Arbitrum for fast and cheap transaction fees</b></p>
          </div>
          <links to="https://bridge.arbitrum.io/" class="btn-action"
            >Get Arbitrum funds</links
          >
        </div>
        <div class="pre-req" id="bright-id">
          <div class="icon-row">
            <img src="@/assets/bright-id.png" id="bright-id-icon" />
            <p>
              <b>BrightID for private, decentralized identity verification</b>
            </p>
          </div>
          <links to="https://brightid.org" class="btn-primary"
            >Download BrightID</links
          >
        </div>
      </div>
      <div class="section-header">
        <h2>About</h2>
      </div>
      <div id="about-section">
        <div id="about-1">
          <h2>It's not about how much...</h2>
          <p>
            Using quadratic funding, your contribution counts as a vote.
            Projects with the most votes at the end of the round get the highest
            amount from the matching pool. That means even a small donation can
            have a massive impact.
          </p>
          <p>
            To learn more about the technology behind this fundraiser, check out
            this primer.
          </p>
          <p>
            <links to="https://wtfisqf.com/">WTF is QF?</links>
          </p>
        </div>
        <div id="about-2">
          <h2>Protect against bribery</h2>
          <p>
            Using MACI, a zero-knowledge technology, it's impossible to prove
            how you contributed. This drives bribers insane because they have no
            idea whether you actually did what they bribed you to do!
          </p>
          <links to="/about/maci">About MACI</links>
        </div>
        <div id="about-3">
          <h2>Built using the CLR protocol</h2>
          <p>
            clr.fund is a protocol for efficiently allocating funds to public
            goods that benefit the Ethereum Network according to the prefences
            of the Ethereum Community.
          </p>
          <p><!-- Discussion icon --><links to="#">clr.fund forum</links></p>
          <p><!-- GitHub icon --><links to="#">Fork your own CLR</links></p>
        </div>
      </div>
      <div id="footer">
        <h2>More</h2>
        <div class="link-li">
          <links to="https://github.com/ethereum/clrfund/">GitHub</links>
        </div>
        <div class="link-li">
          <links to="https://ethereum.org/en/eth2/">More on Eth2</links>
        </div>
        <div class="link-li">
          <links to="/about/how-it-works">How the round works</links>
        </div>
        <div class="link-li">
          <links to="/about/layer-2">Learn about Arbitrum</links>
        </div>
        <div class="link-li">
          <links to="/about/maci">Learn about MACI</links>
        </div>
        <div class="link-li">
          <links to="/about/sybil-resistance">Learn about BrightID</links>
        </div>
        <!-- TODO add link - where are we sending people? clr.fund Discord? -->
        <div class="link-li">Provide Feedback</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { DateTime } from 'luxon'

import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import Links from '@/components/Links.vue'

@Component({
  components: { RoundStatusBanner, TimeLeft, Links },
})
export default class Landing extends Vue {
  get signUpDeadline(): DateTime {
    return this.$store.state.currentRound?.signUpDeadline
  }

  get joinButtonText(): string {
    return this.$store.getters.isRoundContributionPhase
      ? 'Join Round'
      : 'Join Next Round'
  }

  scrollToHowItWorks() {
    document
      .getElementById('section-how-it-works')
      ?.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

#page {
  background: $bg-primary-color;
}

#page > div {
  padding: $content-space (2 * $content-space);
  @media (max-width: $breakpoint-m) {
    padding: $content-space;
  }
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
  margin: 1rem 0;
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
  margin: 0 0 2rem 0;
  counter-increment: li-counter;
  position: relative;
}
ol li::before {
  content: counter(li-counter);
  position: absolute;
  top: 0.125rem; /* adjusts circle up and down */
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
  background: #2a2736;
  border: 2px solid #9789c4;
  box-sizing: border-box;
  text-align: center;
  padding-top: 0.375rem;
  /* vertical-align: baseline; */
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-right: 1rem;
  align-items: center;
  @media (max-width: $breakpoint-m) {
    flex-direction: column-reverse;
    align-items: flex-start;
    width: 100%;
    margin: 0.5rem 0;
  }
}

.btn-hero-primary {
  background: linear-gradient(109.01deg, #9789c4 6.45%, #c72ab9 99.55%);
}

.btn-primary {
  background: #16c8b5;
}

.link-primary {
  color: #16c8b5;
}

.link-li {
  color: white;
  text-decoration: underline;
  margin-bottom: 1rem;
  font-size: 16px;
}

#arbitrum {
  background: $clr-pink-dark-gradient-bg;
}

#bright-id {
  background: $clr-blue-gradient-bg;
}

#arbitrum-icon,
#bright-id-icon {
  box-sizing: border-box;
  height: 4rem;
  width: auto;
  border-radius: 1rem;
}

#bright-id-icon {
  padding: 0.5rem;
  background: black;
}

.pre-req,
#about-1,
#about-2,
#about-3 {
  padding: $content-space;
  flex: 1;
}

#page > #what-you-will-need,
#page > #about-section {
  display: flex;
  gap: 2 * $content-space;
  @media (max-width: $breakpoint-l) {
    flex-direction: column;
    padding: 0rem;
    gap: 0;
  }
}

#page > .section-header {
  padding-bottom: 0;
}

#hero {
  position: relative;
  overflow: hidden;
  background: $clr-pink-dark-gradient;
  padding: 0;
  min-height: 639px; /* This is the height when adding in the callout */
  display: flex;
  flex-flow: wrap;

  @media (max-width: $breakpoint-m) {
    flex-flow: column;
  }

  .image-wrapper img {
    position: absolute;
    mix-blend-mode: exclusion;
    width: 70%;
    max-width: 880px;
    height: auto;
    transform: rotate(15deg);
    /* top: -20px; */
    right: 0;
    @media (max-width: $breakpoint-m) {
      width: auto;
      height: 100%;
      right: -100px;
    }
  }

  .hero-content {
    position: relative;
    max-width: 40%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    @media (max-width: $breakpoint-m) {
      max-width: 880px;
      margin: -2rem;
      padding: 2rem;
      background: linear-gradient(
        182.34deg,
        rgba(0, 0, 0, 0.4) 81%,
        rgba(196, 196, 196, 0) 89.75%
      );
    }
  }

  #moon {
    position: absolute;
    top: 0;
    right: 0;
    mix-blend-mode: exclusion;
  }

  .btn-group {
    display: flex;
    gap: 1rem;
    @media (max-width: $breakpoint-l) {
      flex-direction: column;
    }
  }

  .apply-callout {
    background: #191623e6;
    border: 2px solid #9789c4;
    box-sizing: border-box;
    border-radius: 8px;
    padding: 1rem;
    margin: 3rem 0;
    position: relative;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    gap: 1rem;
    .column {
      flex: 1;
    }
    @media (max-width: $breakpoint-m) {
      display: flex;
      gap: 0.5rem;
    }
  }
}

.pre-req {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  flex-direction: column;
  border-radius: 1rem;

  @media (max-width: $breakpoint-l) {
    border-radius: 0;
  }
}

.icon-row {
  display: flex;
  gap: $content-space;
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
  margin-top: 0.5rem;
}

#about-1,
#about-2,
#about-3 {
  background: $bg-light-color;
  border-radius: 0.5rem;
  @media (max-width: $breakpoint-l) {
    border-radius: 0;
  }
}

#about-1 {
  @media (max-width: $breakpoint-l) {
    background: none;
  }
}

#about-2 {
  @media (max-width: $breakpoint-l) {
    background: $bg-secondary-color;
  }
}

#about-3 {
  @media (max-width: $breakpoint-l) {
    background: $bg-light-color;
  }
}

#subtitle {
  font-size: 20px;
  margin-bottom: 1.5rem;
}

#section-how-it-works {
  background: $clr-purple-gradient-bg;
  display: grid;
  grid-template-columns: 3fr 2fr;
  grid-template-rows: repeat(2, auto);
  grid-template-areas: 'image content' 'image .';
  @media (max-width: $breakpoint-l) {
    display: flex;
  }
  .wormhole-wrapper {
    grid-area: image;
    position: relative;
    display: flex;
    width: 100%;
    align-items: center;
    .wormhole {
      width: 100%;
      height: auto;
      aspect-ratio: 16/9;
      mix-blend-mode: exclusion;
    }
  }
  #how-it-works-content {
    position: relative;
    display: flex;
    flex-direction: column;
    background: $bg-light-color;
    /* width: 40%; */
    border-radius: 1rem;
    padding: 2rem;
    & > img {
      display: none;
    }
    @media (max-width: $breakpoint-l) {
      width: 100%;
      border-radius: 0;
      padding: 0;
      background: none;
      & > img {
        display: inline-block;
        align-self: center;
        width: 100%;
      }
    }
  }
}

.w100 {
  width: 100%;
  @media (min-width: $breakpoint-m) {
    width: fit-content;
  }
}

#btn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

#footer {
  max-width: 100vw;
  padding: $content-space;
  > li {
    list-style-type: none;
  }
}
</style>
