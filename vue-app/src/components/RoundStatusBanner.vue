<template>
  <div id="banner" class="caps">
    <div class="marquee-content">
      <div v-if="$store.getters.isJoinOnlyPhase" class="messsage">
        <span class="label">Comienza el financiamiento 🗓 {{ startDate }}.</span>
        <span v-if="$store.getters.isRecipientRegistryFull" class="label">
          Las solicitudes de proyectos están cerradas.</span
        >
        <span v-if="$store.getters.isRecipientRegistryFillingUp" class="label">
          ¡Apúrate, solo quedan {{ recipientSpacesRemainingString }}!
        </span>
        <span v-if="!$store.getters.isRecipientRegistryFull" class="label">
          Tiempo restante para agregar un proyecto:
          <time-left
            unitClass="none"
            valueClass="none"
            :date="$store.getters.recipientJoinDeadline"
          />
        </span>
      </div>
      <div v-if="$store.getters.isRoundContributionPhase" class="messsage">
        <span
          v-if="$store.getters.isRoundContributionPhaseEnding"
          class="label"
        >
          ⌛️ La ronda se cerrará en
          <time-left
            unitClass="none"
            valueClass="none"
            :date="$store.state.currentRound.signUpDeadline"
          />. ¡Recibe tus contribuciones ahora!
        </span>
        <span v-else class="label"
          >🎉 ¡La ronda está abierta!
          <time-left
            unitClass="none"
            valueClass="none"
            :date="$store.state.currentRound.signUpDeadline"
          />
          queda para contribuir a tus proyectos favoritos
        </span>
      </div>
      <div v-if="$store.getters.isRoundReallocationPhase" class="messsage">
        <span class="label">
          ¡Financiamiento cerrado! Si contribuiste, tienes
          <time-left
            unitClass="none"
            valueClass="none"
            :date="$store.state.currentRound.votingDeadline"
          />
          te queda para cambiar de opinión
        </span>
      </div>
      <div v-if="$store.getters.isRoundTallying" class="messsage">
        <span class="label"
          >🎉 ¡Financiamiento cerrado! Nuestros contratos inteligentes están
          ocupados contando contribuciones ...
        </span>
      </div>
      <div v-if="$store.getters.isRoundFinalized" class="messsage">
        <span class="label"
          >¡Financiamiento cerrado! Las contribuciones están listas para
          reclamar. Dirígete a la página de tu proyecto para reclamar tus
          fondos. <links to="/projects">View projects</links></span
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { formatDate } from '@/utils/dates'
import TimeLeft from '@/components/TimeLeft.vue'
import Links from '@/components/Links.vue'

@Component({ components: { TimeLeft, Links } })
export default class RoundStatusBanner extends Vue {
  get startDate(): string {
    return formatDate(this.$store.state.currentRound?.startTime)
  }

  get recipientSpacesRemainingString(): string {
    const spaces: number = this.$store.getters.recipientSpacesRemaining
    return `${spaces} project space${spaces !== 1 && 's'}`
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

#banner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 100vw;
  background: $bg-primary-color;
  overflow: hidden;
  white-space: nowrap;
}

.marquee-content {
  display: inline-block;
  animation: marquee 20s linear infinite;
  padding-left: 100%;
  margin: 1rem 0;

  @media (max-width: $breakpoint-m) {
    animation: marquee 10s linear infinite;
  }
}

.marquee-content:hover {
  animation-play-state: paused;
}

.label {
  font-family: 'Glacial Indifference', sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  text-align: left;
  margin-right: 1rem;
}

.date {
  margin-right: 2rem;
  padding-right: 1rem;
  text-transform: none;
  line-height: 0;
}

.date {
  margin-right: 2rem;
  padding-right: 1rem;
  text-transform: none;
  line-height: 0;
}

.messsage {
  display: flex;
  align-items: center;
}

/* Transition */

@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}
</style>
