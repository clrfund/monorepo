<template>
  <div>
    <round-status-banner v-if="currentRound" />
    <div class="gradient">
      <img src="@/assets/moon.png" class="moon" />
      <div class="hero">
        <image-responsive title="newrings" />
        <div class="content">
          <span class="emoji">🎉</span>
          <div class="flex-title">
            <h1>{{ $t('projectAdded.h1') }}</h1>
            <transaction-receipt :hash="hash" />
          </div>
          <div class="subtitle">{{ $t('projectAdded.div1') }}</div>
          <ul>
            <li>
              {{ $t('projectAdded.li1') }}
              <links to="/about/how-it-works/recipients">{{ $t('projectAdded.link1') }}</links>
            </li>
            <li>{{ $t('projectAdded.li2') }}</li>
            <li>
              {{ $t('projectAdded.li3') }}
            </li>
          </ul>
          <div class="mt2 button-spacing">
            <template v-if="isOptimisticRecipientRegistry">
              <links v-if="recipientId" :to="`/recipients/${recipientId}`" class="btn-primary">{{
                $t('projectAdded.link2')
              }}</links>
            </template>
            <links v-else to="/projects" class="btn-primary">{{ $t('projectAdded.linkProjects') }}</links>
            <links to="/" class="btn-secondary">{{ $t('projectAdded.link3') }}</links>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import TransactionReceipt from '@/components/TransactionReceipt.vue'
import Links from '@/components/Links.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'

import { useAppStore } from '@/stores'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { isOptimisticRecipientRegistry } from '@/api/core'
import { getRecipientIdByHash } from '@/api/projects'

const route = useRoute()
const appStore = useAppStore()
const { currentRound } = storeToRefs(appStore)
const hash = computed(() => route.params.hash as string)

const recipientId = ref('')

onMounted(async () => {
  const id = await getRecipientIdByHash(hash.value)
  if (id) {
    recipientId.value = id
  }
})
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.emoji {
  font-size: 40px;
}

h1 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 40px;
  line-height: 150%;
  margin: 0;
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

li {
  font-size: 16px;
  line-height: 30px;
}

ul {
  padding-left: 1.5rem;
}

.gradient {
  background: var(--bg-primary-color);
  position: relative;

  .moon {
    position: absolute;
    top: 1rem;
    right: 1rem;
    mix-blend-mode: exclusion;
  }
  .hero {
    bottom: 0;
    display: flex;
    background: var(--bg-primary-color);
    height: calc(100vh - 113px);
    @media (max-width: $breakpoint-m) {
      padding: 2rem 0rem;
      padding-bottom: 16rem;
    }

    img {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 66%;
      @media (max-width: $breakpoint-m) {
        right: 0;
        width: 100%;
      }
    }

    .content {
      position: relative;
      z-index: 1;
      padding: $content-space;
      width: min(100%, 512px);
      margin-left: 2rem;
      margin-top: 3rem;
      @media (max-width: $breakpoint-m) {
        width: 100%;
        margin: 0;
      }

      .flex-title {
        display: flex;
        gap: 0.5rem;
        align-items: left;
        margin-bottom: 3rem;
        margin-top: 1.5rem;
        flex-wrap: wrap;
        flex-direction: column;

        img {
          width: 1rem;
          height: 1rem;
          position: relative;
          right: 0;
        }
      }
    }
  }
}

.subtitle {
  font-size: 1.25rem;
}

.icon {
  width: 1rem;
  height: 1rem;
  position: relative;
}

.button-spacing {
  height: 6.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
