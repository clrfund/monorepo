<template>
  <div>
    <div id="page">
      <div id="hero">
        <div class="image-wrapper">
          <image-responsive title="hero" />
        </div>
        <div>
          <div class="hero-content">
            <h1>Send your favorite buidl projects to the moon!</h1>
            <p class="subtitle">
              Every project you contribute to gets a portion of extra funding.
            </p>
            <div class="btn-group">
              <links class="btn-template" id="purple-button" to="/projects"
                >Get started</links
              >
              <div
                class="btn-template"
                id="border-button"
                @click="scrollToHowItWorks"
              >
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
              <h2 id="banner-title">Join the funding round</h2>
              <p class="text-body">
                Add your project to the next funding round. If you're working on
                anything related to public goods, you can join in.
              </p>
              <div class="button-group">
                <links to="/join" class="btn-primary w100">Add project</links>
                <div class="banner-time-frame" v-if="signUpDeadline">
                  <time-left unitClass="none" :date="signUpDeadline" />
                  <h4>to join</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="section-how-it-works">
        <div class="bridge-wrapper desktop-l">
          <image-responsive
            title="bridge"
            class="bridge"
            alt="Image of spaceships funneling through a bridge and getting bigger"
          />
        </div>
        <div id="how-it-works-content">
          <h2>Every donation is amplified by the matching pool.</h2>
          <p class="subtitle">
            This fundraiser rewards projects with the most unique demand, not
            just those with the wealthiest backers.
          </p>
          <h2>How it works</h2>
          <ol class="text-body">
            <li>
              The {{ $store.getters.operator }} and other donors send funds to
              the matching pool smart contract.
            </li>
            <li>
              The round begins and you can donate to as many projects as you
              like.
            </li>
            <li>
              Once the round finishes, the smart contract distributes the
              matching pool funds to projects based primarily on number of
              contributions not contribution value.
            </li>
          </ol>
          <links class="btn-secondary" to="/about/how-it-works">
            <p class="button-margin">How the round works</p></links
          >
        </div>
      </div>
      <div class="section-header">
        <h1>What you'll need</h1>
      </div>
      <div id="what-you-will-need">
        <div class="pre-req">
          <div class="icon-row">
            <img :src="require(`@/assets/${chain.logo}`)" id="chain-icon" />
            <h3>{{ chain.label }} for fast and cheap transaction fees</h3>
          </div>
          <links
            v-if="chain.isLayer2"
            to="/about/layer-2"
            class="btn-template"
            id="btn-chain-id"
          >
            <h4>Get {{ chain.label }} funds</h4>
          </links>
        </div>
        <div class="pre-req" id="bright-id">
          <div class="icon-row">
            <img src="@/assets/bright-id.png" id="bright-id-icon" />
            <h3>BrightID for private, decentralized identity</h3>
          </div>
          <links
            to="/about/sybil-resistance"
            class="btn-template"
            id="btn-bright-id"
          >
            <h4>Set up BrightID</h4>
          </links>
        </div>
      </div>
      <div class="section-header">
        <h1>About</h1>
      </div>
      <div id="about-section">
        <div class="about">
          <h2>It's not about how much...</h2>
          <p class="text-body">
            Using quadratic funding, your contribution counts as a vote.
            Projects with the most contributions at the end of the round get the
            highest amount from the matching pool. That means even a small
            donation can have a massive impact.
          </p>
          <p class="text-body">
            To learn more about the technology behind this fundraiser, check out
            this primer.
          </p>
          <p class="text-body">
            <links to="/about/quadratic-funding">WTF is QF? ↗</links>
          </p>
        </div>
        <div class="about">
          <h2>Protect against bribery</h2>
          <p class="text-body">
            Using MACI, a zero-knowledge technology, it's impossible to prove
            how you contributed. This drives bribers insane because they have no
            idea whether you actually did what they bribed you to do!
          </p>
          <p class="text-body">
            <links to="/about/maci">About MACI ↗</links>
          </p>
        </div>
        <div class="about">
          <h2>Built using the CLR protocol</h2>
          <p class="text-body">
            clr.fund is a protocol for efficiently allocating funds to public
            goods that benefit the Ethereum Network according to the prefences
            of the Ethereum Community.
          </p>
          <p class="text-body">
            <links to="https://forum.clr.fund/">clr.fund forum</links>
          </p>
          <p class="text-body">
            <links to="https://github.com/clrfund/monorepo/"
              >Fork your own CLR</links
            >
          </p>
        </div>
      </div>
      <div id="footer">
        <h2>More</h2>
        <div id="footer-content">
          <div class="link-li text-base">
            <links to="/about">About clr.fund</links>
          </div>
          <div class="link-li text-base">
            <links to="/about/how-it-works">How the round works</links>
          </div>
          <div class="link-li text-base" v-if="chain.isLayer2">
            <links to="/about/layer-2">About {{ chain.label }}</links>
          </div>
          <div class="link-li text-base">
            <links to="/about/maci">About MACI</links>
          </div>
          <div class="link-li text-base">
            <links to="/about/sybil-resistance">About BrightID</links>
          </div>
          <div class="link-li text-base">
            <links to="https://github.com/clrfund/monorepo/">GitHub</links>
          </div>
          <div class="link-li text-base">
            <links to="https://discord.gg/ZnsYPV6dCv">Discord</links>
          </div>
          <div class="link-li text-base">
            <links to="https://forum.clr.fund/">Forum</links>
          </div>
          <div class="link-li text-base">
            <links to="https://ethereum.org/">More on Ethereum</links>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { DateTime } from 'luxon'

import { chain } from '@/api/core'
import { ChainInfo } from '@/plugins/Web3/constants/chains'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import Links from '@/components/Links.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'

@Component({
  components: { RoundStatusBanner, TimeLeft, Links, ImageResponsive },
})
export default class Landing extends Vue {
  get signUpDeadline(): DateTime {
    return this.$store.state.currentRound?.signUpDeadline
  }

  scrollToHowItWorks() {
    document
      .getElementById('section-how-it-works')
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  get chain(): ChainInfo {
    return chain
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

#page {
  background: var(--bg-primary-color);
}

#page > div {
  padding: $content-space (2 * $content-space);
  @media (max-width: $breakpoint-m) {
    padding: $content-space;
  }
}

.home-content {
  display: flex;
  flex-direction: column;
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
  color: var(--text-secondary);
  background: var(--bg-circle);
  border: 2px solid var(--link-color);
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

.banner-time-frame {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  @media (max-width: $breakpoint-m) {
    flex-direction: column;
  }
}

.link-li {
  text-decoration: underline;
  margin-bottom: 1rem;
}

.link-li > a {
  color: $clr-purple !important;
}

#bright-id {
  background: $clr-green;
}

#chain-icon,
#bright-id-icon {
  box-sizing: border-box;
  height: 6rem;
  width: auto;
  border-radius: 1rem;
}

.pre-req,
.about {
  padding: $content-space;
  flex: 1;
  color: $clr-white;
}

.about > p > a {
  text-decoration: underline;
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
  background: var(--bg-landing-about);
}

#page > .section-header {
  background: var(--bg-landing-about);
}

#hero {
  position: relative;
  overflow: hidden;
  background: var(--bg-landing-banner);
  padding: 0;
  min-height: 639px; /* This is the height when adding in the callout */
  display: flex;
  flex-flow: wrap;

  @media (max-width: $breakpoint-m) {
    flex-flow: column;
  }

  .image-wrapper img {
    position: absolute;
    mix-blend-mode: luminosity;
    width: 80%;
    max-width: 960px;
    height: auto;
    transform: rotate(25deg);
    top: 120px;
    right: -120px;
    @media (max-width: $breakpoint-m) {
      width: auto;
      height: 100%;
      right: -100px;
    }
  }

  .hero-content {
    position: relative;
    max-width: 50%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    @media (max-width: $breakpoint-m) {
      max-width: 880px;
      margin: -2rem;
      padding: 2rem;
      @include gradientBackground(
        182.34deg,
        rgba(var(--shadow-dark-rgb), 0.4),
        81%,
        rgba(var(--shadow-light-rgb), 0),
        89.75%
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
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    @media (max-width: $breakpoint-l) {
      flex-direction: column;
    }
  }

  #purple-button {
    background: $clr-purple;
    width: 100%;
  }

  #border-button {
    background: $clr-dark-violet;
    border: 2px solid $clr-white;
    width: 100%;
  }

  .apply-callout {
    background: var(--bg-transparent);
    border: 2px solid var(--bg-btn-primary);
    box-sizing: border-box;
    border-radius: 8px;
    padding: 1.75rem;
    margin: 3rem 0;
    position: relative;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    gap: 1rem;
    .column {
      flex: 1;
    }

    #banner-title {
      margin: 0;
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
  background: $clr-purple;
  @media (max-width: $breakpoint-l) {
    border-radius: 0;
  }
}

#btn-chain-id {
  background: $clr-green;
}

#btn-bright-id {
  background: $clr-dark-violet;
}

.icon-row {
  display: flex;
  align-items: center;
  gap: $content-space;
  @media (max-width: $breakpoint-m) {
    flex-direction: column;
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
  margin-top: 0.5rem;
}

.about {
  background: $clr-dark-violet;
  border-radius: 0.5rem;
  @media (max-width: $breakpoint-l) {
    border-radius: 0;
  }
  a {
    color: var(--link-color);
  }
}

#about-1 {
  @media (max-width: $breakpoint-l) {
    background: none;
  }
}

#about-2 {
  @media (max-width: $breakpoint-l) {
    background: var(--bg-secondary-color);
  }
}

#about-3 {
  @media (max-width: $breakpoint-l) {
    background: var(--bg-light-color);
  }
}

#subtitle {
  font-size: 20px;
  margin-bottom: 1.5rem;
}

#section-how-it-works {
  background: var(--bg-landing-hiw);
  display: grid;
  grid-template-columns: 3fr 2fr;
  grid-template-rows: repeat(2, auto);
  grid-template-areas: 'image content' 'image .';
  @media (max-width: $breakpoint-l) {
    display: flex;
  }
  .bridge-wrapper {
    grid-area: image;
    position: relative;
    width: 100%;
    align-items: center;
    .bridge {
      max-height: 830px;
      max-width: 1550px;
      position: absolute;
      width: calc(95vw - 8rem);
      height: auto;
      aspect-ratio: 16/9;
      mix-blend-mode: luminosity;
    }
  }
  #how-it-works-content {
    min-width: 546px;
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--bg-landing-hiw-card);
    border: 1px solid $clr-gray;
    /* width: 40%; */
    border-radius: 1rem;
    padding: 2rem;
    & > img {
      display: none;
    }
    @media (max-width: $breakpoint-l) {
      min-width: 100px;
      width: 100%;
      background: none;
      & > img {
        display: inline-block;
        align-self: center;
        width: 100%;
      }
    }
  }
}

.button-margin {
  padding: 0;
  margin: 0;
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
  max-height: 320px;
  background: var(--bg-footer);
  padding: $content-space;
  > li {
    list-style-type: none;
  }
}

#footer-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}
</style>
