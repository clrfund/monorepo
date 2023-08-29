<template>
  <div>
    <round-status-banner v-if="currentRound" />
    <div id="page">
      <div id="hero">
        <img src="@/assets/moon.png" id="moon" />
        <div class="image-wrapper">
          <image-responsive title="docking" alt="Image of docking spaceship" />
        </div>
        <div>
          <div class="hero-content">
            <h1>{{ $t('landing.hero.title') }}</h1>
            <div id="subtitle" class="subtitle">
              {{ $t('landing.hero.subtitle') }}
            </div>
            <div class="btn-group">
              <links v-if="leaderboardRoute" class="btn-action" :to="leaderboardRoute">
                {{ $t('landing.button.leaderboard') }}
              </links>
              <links v-else-if="appUrl" class="btn-action" :to="appUrl">
                {{ $t('landing.button.getStarted') }}
              </links>
              <div class="btn-info" @click="scrollToHowItWorks">
                {{ $t('landing.hero.info') }}
              </div>
            </div>
          </div>
          <div class="apply-callout" v-if="isRoundJoinPhase && !isRecipientRegistryFull">
            <div class="column">
              <h2>{{ $t('landing.callout.title') }}</h2>
              <p>
                {{ $t('landing.callout.paragraph') }}
              </p>
              <div class="button-group">
                <links to="/join" class="btn-primary w100">{{ $t('landing.callout.action') }}</links>
                <div v-if="recipientJoinDeadline">
                  <time-left unitClass="none" :date="recipientJoinDeadline" />
                  {{ $t('landing.callout.deadline') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="section-how-it-works">
        <div class="wormhole-wrapper desktop-l">
          <image-responsive
            title="wormhole"
            class="wormhole"
            alt="Image of spaceships funneling through a wormhole and getting bigger"
          />
        </div>
        <div id="how-it-works-content">
          <h2>{{ $t('landing.how.title') }}</h2>
          <p>
            {{ $t('landing.how.paragraph') }}
          </p>
          <image-responsive
            title="wormhole"
            alt="Image of spaceships funneling through a wormhole and getting bigger"
          />
          <h2>{{ $t('landing.how.subtitle') }}</h2>
          <ol>
            <li>
              {{ $t('landing.how.list-1', { operator: operator }) }}
            </li>
            <li>
              {{ $t('landing.how.list-2') }}
            </li>
            <li>
              {{ $t('landing.how.list-3') }}
              <strong>{{ $t('landing.how.list-3-strong') }}.</strong>
            </li>
          </ol>
          <links class="btn-secondary" to="/about/how-it-works">{{ $t('landing.how.action') }}</links>
        </div>
      </div>
      <div class="section-header">
        <h2>{{ $t('landing.req.title') }}</h2>
      </div>
      <div id="what-you-will-need">
        <div class="pre-req">
          <div class="icon-row">
            <img :src="chainIconUrl" id="chain-icon" />
            <p>
              <b>{{ $t('landing.req.chain', { chain: chain.label }) }}</b>
            </p>
          </div>
          <links v-if="chain.isLayer2" to="/about/layer-2" class="btn-action">
            {{ $t('landing.req.chain-cta', { chain: chain.label }) }}
          </links>
        </div>
        <div v-if="isBrightIdRequired" class="pre-req" id="bright-id">
          <div class="icon-row">
            <img src="@/assets/bright-id.png" id="bright-id-icon" />
            <p>
              <b>{{ $t('landing.req.bright') }}</b>
            </p>
          </div>
          <links to="/about/sybil-resistance" class="btn-primary">{{ $t('landing.req.bright-cta') }}</links>
        </div>
      </div>
      <div class="section-header">
        <h2>{{ $t('landing.about.title') }}</h2>
      </div>
      <div id="about-section">
        <div id="about-1">
          <h2>{{ $t('landing.about.subtitle-1') }}</h2>
          <p>
            {{ $t('landing.about.paragraph-1') }}
          </p>
          <p>
            <links to="/about/quadratic-funding">{{ $t('landing.about.link-1') }}</links>
          </p>
        </div>
        <div id="about-2">
          <h2>{{ $t('landing.about.subtitle-2') }}</h2>
          <p>
            {{ $t('landing.about.paragraph-2') }}
          </p>
          <links to="/about/maci">{{ $t('landing.about.link-2') }}</links>
        </div>
        <div id="about-3">
          <h2>{{ $t('landing.about.subtitle-3') }}</h2>
          <p>
            {{ $t('landing.about.paragraph-3') }}
          </p>
          <links to="/about">{{ $t('landing.about.link-3') }}</links>
        </div>
      </div>
      <div id="footer">
        <h2>{{ $t('landing.footer.title') }}</h2>
        <div class="link-li">
          <links to="/about">{{ $t('landing.footer.link-1') }}</links>
        </div>
        <div class="link-li">
          <links to="/about/how-it-works">{{ $t('landing.footer.link-2') }}</links>
        </div>
        <div class="link-li" v-if="chain.isLayer2">
          <links to="/about/layer-2">{{ $t('landing.footer.link-3', { chain: chain.label }) }}</links>
        </div>
        <div class="link-li">
          <links to="/about/maci">{{ $t('landing.footer.link-4') }}</links>
        </div>
        <div class="link-li">
          <links to="/about/sybil-resistance">{{ $t('landing.footer.link-5') }}</links>
        </div>
        <div class="link-li">
          <links to="https://github.com/clrfund/monorepo/">{{ $t('landing.footer.link-6') }}</links>
        </div>
        <div class="link-li">
          <links to="https://discord.gg/ZnsYPV6dCv">{{ $t('landing.footer.link-7') }}</links>
        </div>
        <div class="link-li">
          <links to="https://twitter.com/clrfund">Twitter</links>
        </div>
        <div class="link-li">
          <links to="https://blog.clr.fund/">{{ $t('landing.footer.link-blog') }} </links>
        </div>
        <div class="link-li">
          <links to="https://forum.clr.fund/">{{ $t('landing.footer.link-8') }}</links>
        </div>
        <div class="link-li">
          <links to="https://ethereum.org/">{{ $t('landing.footer.link-9') }}</links>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { chain, leaderboardRounds, isBrightIdRequired } from '@/api/core'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import Links from '@/components/Links.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'
import { useAppStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { getAssetsUrl } from '@/utils/url'
import { isSameAddress } from '@/utils/accounts'

const appStore = useAppStore()
const {
  operator,
  isRoundJoinPhase,
  recipientJoinDeadline,
  isRecipientRegistryFull,
  currentRound,
  currentRoundAddress,
  isAppReady,
} = storeToRefs(appStore)

function scrollToHowItWorks() {
  document.getElementById('section-how-it-works')?.scrollIntoView({ behavior: 'smooth' })
}
const chainIconUrl = getAssetsUrl(chain.logo)

const leaderboardRoute = computed(() => {
  if (!isAppReady.value) {
    return null
  }

  const roundAddress = currentRoundAddress.value || ''
  const leaderboard = leaderboardRounds.find(round => isSameAddress(round.address, roundAddress))
  return leaderboard ? { name: 'leaderboard', params: { network: leaderboard.network, address: roundAddress } } : null
})

const appUrl = computed(() => {
  return isAppReady.value && currentRoundAddress.value ? `/projects` : null
})
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
.link-li {
  text-decoration: underline;
  margin-bottom: 1rem;
  font-size: 16px;
}
#bright-id {
  background: var(--bright-id-bg);
}
#chain-icon,
#bright-id-icon {
  box-sizing: border-box;
  height: 4rem;
  width: auto;
  border-radius: 1rem;
}
#bright-id-icon {
  padding: 0.5rem;
  background: var(--bright-id-icon-bg);
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
  background: var(--bg-gradient);
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
    gap: 1rem;
    @media (max-width: $breakpoint-l) {
      flex-direction: column;
    }
  }
  .apply-callout {
    background: var(--bg-transparent);
    border: 2px solid $highlight-color;
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
  background: var(--brand-tertiary);
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
  background: var(--bg-light-color);
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
  background: var(--bg-how-it-works);
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
    background: var(--bg-light-color);
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

.pre-req {
  @media (min-width: $breakpoint-l) {
    max-width: 32rem;
  }
}
</style>
