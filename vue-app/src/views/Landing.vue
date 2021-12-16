<template>
  <div>
    <round-status-banner />
    <div id="page">
      <div id="hero">
        <img src="@/assets/moon.png" id="moon" />
        <div class="image-wrapper">
          <image-responsive title="docking" />
        </div>
        <div>
          <div class="hero-content">
            <h1>Manda tu proyecto de BUIDL favorito hasta la luna!</h1>
            <div id="subtitle" class="subtitle">
              Cada proyecto al que contribuyas obtiene una porción extra de
              financiamiento.
            </div>
            <div class="btn-group">
              <links to="/projects" class="btn-action">Ir al app</links>
              <div class="btn-white" @click="scrollToHowItWorks">
                Así Funciona
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
              <h2>Únete a la ronda de financiamiento</h2>
              <p>
                Agrega tu proyecto a la siguiente ronda de financiamiento. Si
                estás trabajando algo relacionado a fondos públicos, puedes
                unirte.
              </p>
              <div class="button-group">
                <links to="/join" class="btn-primary w100">{{
                  joinButtonText
                }}</links>
                <div v-if="signUpDeadline">
                  <time-left unitClass="none" :date="signUpDeadline" />
                  para unirte
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
          <h2>Cada donación se amplifica con contrapartida.</h2>
          <p>
            Esta recaudación de fondos recompensa los proyectos con la mayor
            demanda de usuarios, no solo aquellos con los patrocinadores más
            ricos.
          </p>
          <image-responsive
            title="wormhole"
            alt="Image of spaceships funneling through a wormhole and getting bigger"
          />
          <h2>Así Funciona</h2>
          <ol>
            <li>
              {{ operator }} y otros donantes envían fondos a un contract de
              pool de donaciones.
            </li>
            <li>
              La ronda de financiamiento inicia y puedes donar a cuantos
              proyectos quieras.
            </li>
            <li>
              Una vez termina la ronda, el contrato inteligente distribuye los
              fondos del pool de donaciones a los proyectos basado en el número
              de contribuyentes y <strong>no en la cantidad donada</strong>.
            </li>
          </ol>
          <links class="btn-secondary" to="/about/how-it-works"
            >Cómo funciona la ronda</links
          >
        </div>
      </div>
      <div class="section-header">
        <h2>Lo que necesitas</h2>
      </div>
      <div id="what-you-will-need">
        <div class="pre-req">
          <div class="icon-row">
            <img :src="require(`@/assets/${chain.logo}`)" id="chain-icon" />
            <p>
              <b>{{ chain.label }} para transacciones rápidas y baratas</b>
            </p>
          </div>
          <links
            :to="chain.isLayer2 ? '/about/layer-2' : chain.bridge"
            class="btn-action"
          >
            Obtén {{ chain.label }}
          </links>
        </div>
        <!--        <div class="pre-req" id="bright-id">-->
        <!--          <div class="icon-row">-->
        <!--            <img src="@/assets/bright-id.png" id="bright-id-icon" />-->
        <!--            <p>-->
        <!--              <b>BrightID for private, decentralized identity verification</b>-->
        <!--            </p>-->
        <!--          </div>-->
        <!--          <links to="https://brightid.org" class="btn-primary"-->
        <!--            >Download BrightID</links-->
        <!--          >-->
        <!--        </div>-->
      </div>
      <div class="section-header">
        <h2>Acerca</h2>
      </div>
      <div id="about-section">
        <div id="about-1">
          <h2>No se trata de cuanto...</h2>
          <p>
            Usando financiamiento cuadráticos, tu contribución cuenta como un
            voto. Los proyectos con la mayor cantidad de contribuciones al final
            de la ronda obtienen la mayor cantidad del fondo de contrapartida.
            Eso significa que incluso una pequeña donación puede tener un
            impacto enorme.
          </p>
          <p>
            <links to="/about/quadratic-funding"
              >Acerca de financiamiento cuadrático</links
            >
          </p>
        </div>
        <div id="about-2">
          <h2>Protégete contra el soborno</h2>
          <p>
            Con MACI, una tecnología de conocimiento cero, es imposible
            demostrar cómo una persona contribuyó. ¡Esto vuelve locos a los
            sobornadores porque no tienen idea de si realmente hiciste lo que te
            sobornaron para que hicieras!
          </p>
          <links to="/about/maci">Acerca de MACI</links>
        </div>
        <div id="about-3">
          <h2>Construido usando el protocolo CLR</h2>
          <p>
            clr.fund es un protocolo para la asignación eficiente de fondos a
            bienes públicos que benefician a la Red Ethereum de acuerdo con las
            preferencias de la Comunidad Ethereum.
          </p>
          <links to="/about">Acerca de clr.fund</links>
        </div>
      </div>
      <div id="footer">
        <h2>Más</h2>
        <div class="link-li">
          <links to="/about">Acerca de clr.fund</links>
        </div>
        <div class="link-li">
          <links to="/about/how-it-works">Como funciona la ronda</links>
        </div>
        <div class="link-li" v-if="chain.isLayer2">
          <links to="/about/layer-2">Acerca de {{ chain.label }}</links>
        </div>
        <div class="link-li">
          <links to="/about/maci">Acerca de MACI</links>
        </div>
        <!--        <div class="link-li">-->
        <!--          <links to="/about/sybil-resistance">Acerca de BrightID</links>-->
        <!--        </div>-->
        <div class="link-li">
          <links to="https://github.com/clrfund/monorepo/">GitHub</links>
        </div>
        <div class="link-li">
          <links to="https://discord.gg/ZnsYPV6dCv">Discord</links>
        </div>
        <div class="link-li">
          <links to="https://forum.clr.fund/">Foro</links>
        </div>
        <div class="link-li">
          <links to="https://ethereum.org/">Más sobre Ethereum</links>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { DateTime } from 'luxon'

import { operator } from '@/api/core'
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

  get joinButtonText(): string {
    return this.$store.getters.isRoundContributionPhase
      ? 'Join Round'
      : 'Join Next Round'
  }

  get operator(): string {
    return operator
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

#bright-id {
  background: $clr-blue-gradient-bg;
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
  background: $clr-pink-dark-gradient-bg;
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
