<template>
  <!-- Reallocate CTA -->
  <div class="get-prepared" v-if="$store.getters.canUserReallocate">
    <span aria-label="thinking face" class="emoji">🤔</span>
    <div>
      <h2 class="prep-title">¿Cambiaste de opinión?</h2>
      <p class="prep-text">
        Aún tienes tiempo para reasignar tus contribuciones.
      </p>
      <div class="btn-action" @click="toggleCartPanel()">Carrito abierto</div>
    </div>
  </div>
  <!-- Round is over notification -->
  <div
    class="get-prepared"
    v-else-if="$store.getters.hasContributionPhaseEnded"
  >
    <span aria-label="hand" class="emoji">🤚</span>
    <div>
      <h2 class="prep-title">Redondeo para contribuciones</h2>
      <p class="prep-text">
        Ya no puedes realizar contribuciones en esta ronda.
      </p>
    </div>
  </div>
  <!-- Get prepared CTA -->
  <div class="get-prepared" v-else-if="showUserVerification">
    <bright-id-widget v-if="hasStartedVerification" :isProjectCard="true" />
    <span v-else aria-label="rocket" class="emoji">🚀</span>
    <div>
      <h2 class="prep-title">¡Prepárate!</h2>
      <p class="prep-text">
        Deberás configurar algunas cosas antes de contribuir. Puedes hacer esto
        en cualquier momento antes o durante la ronda de financiamiento.
      </p>
    </div>
    <links v-if="!hasStartedVerification" to="/verify" class="btn-action"
      >¡Comienza a prepararte!</links
    >
    <links v-else to="/verify/connect" class="btn-action"
      >Continuar la configuración</links
    >
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import BrightIdWidget from '@/components/BrightIdWidget.vue'
import Links from '@/components/Links.vue'

import { TOGGLE_SHOW_CART_PANEL } from '@/store/mutation-types'
import { userRegistryType, UserRegistryType } from '@/api/core'

@Component({
  components: {
    BrightIdWidget,
    Links,
  },
})
export default class CallToActionCard extends Vue {
  get hasStartedVerification(): boolean {
    return (
      this.$store.state.currentUser &&
      this.$store.state.currentUser.brightId &&
      this.$store.state.currentUser.brightId.isLinked
    )
  }

  get showUserVerification(): boolean {
    const { currentUser } = this.$store.state

    return (
      userRegistryType === UserRegistryType.BRIGHT_ID &&
      typeof currentUser?.isRegistered === 'boolean' &&
      !currentUser?.isRegistered
    )
  }

  toggleCartPanel() {
    this.$store.commit(TOGGLE_SHOW_CART_PANEL, true)
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.get-prepared {
  background: $bg-secondary-color;
  border: 1px solid #000000;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  justify-content: space-between;
}

.prep-title {
  font-family: 'Glacial Indifference', sans-serif;
  font-size: 2rem;
  font-weight: 700;
}

.prep-title-continue {
  font-family: 'Glacial Indifference', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
}

.prep-text {
  font-family: Inter;
  font-size: 16px;
  line-height: 150%;
}

.emoji {
  font-size: 32px;
}
</style>
