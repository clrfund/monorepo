<template>
  <!-- Reallocate CTA -->
  <div class="get-prepared" v-if="canUserReallocate">
    <span aria-label="thinking face" class="emoji">🤔</span>
    <div>
      <h2 class="prep-title">{{ $t('callToActionCard.h2_1') }}</h2>
      <p class="prep-text">
        {{ $t('callToActionCard.p1') }}
      </p>
      <div class="btn-action" @click="toggleCartPanel()">
        {{ $t('callToActionCard.div1') }}
      </div>
    </div>
  </div>
  <!-- Round is over notification -->
  <div class="get-prepared" v-else-if="hasContributionPhaseEnded">
    <span aria-label="hand" class="emoji">🤚</span>
    <div>
      <h2 class="prep-title">{{ $t('callToActionCard.h2_2') }}</h2>
      <p class="prep-text">
        {{ $t('callToActionCard.p2') }}
      </p>
    </div>
  </div>
  <!-- Get prepared CTA -->
  <div class="get-prepared" v-else-if="showUserVerification">
    <bright-id-widget v-if="hasStartedVerification" :isProjectCard="true" />
    <span v-else aria-label="rocket" class="emoji">🚀</span>
    <div>
      <h2 class="prep-title">{{ $t('callToActionCard.h2_3') }}</h2>
      <p class="prep-text">
        {{ $t('callToActionCard.p3') }}
      </p>
    </div>
    <links v-if="!hasStartedVerification" to="/verify" class="btn-action">{{ $t('callToActionCard.link1') }}</links>
    <links v-else to="/verify/connect" class="btn-action">{{ $t('callToActionCard.link2') }}</links>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import BrightIdWidget from '@/components/BrightIdWidget.vue'
import Links from '@/components/Links.vue'

import { userRegistryType, UserRegistryType } from '@/api/core'
import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { canUserReallocate, hasContributionPhaseEnded } = storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const hasStartedVerification = computed(
  () => currentUser.value && currentUser.value.brightId && currentUser.value.brightId.isVerified,
)
const showUserVerification = computed(() => {
  return (
    userRegistryType === UserRegistryType.BRIGHT_ID &&
    typeof currentUser.value?.isRegistered === 'boolean' &&
    !currentUser.value.isRegistered
  )
})

const toggleCartPanel = () => {
  appStore.toggleShowCartPanel(true)
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.get-prepared {
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-strong);
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
