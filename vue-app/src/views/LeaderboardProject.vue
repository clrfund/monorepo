<template>
  <div>
    <loader v-if="isLoading"></loader>
    <div :class="`grid ${showCartPanel ? 'cart-open' : 'cart-closed'}`" v-if="project">
      <img class="project-image banner" :src="project.bannerImageUrl" :alt="project.name" />
      <project-profile class="details" :project="project" :previewMode="false" />
      <div class="sticky-column">
        <div class="desktop">
          <claim-button v-if="showClaimButton" :project="project" />
        </div>
        <link-box :project="project" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import type { Project } from '@/api/projects'
import ProjectProfile from '@/components/ProjectProfile.vue'
import LinkBox from '@/components/LinkBox.vue'

import { useMeta } from 'vue-meta'
import { useRoute, useRouter } from 'vue-router'
import { operator } from '@/api/core'
import { getLeaderboardProject } from '@/api/projects'
import { getRouteParamValue } from '@/utils/route'
import { useAppStore } from '@/stores'

const appStore = useAppStore()
const { isAppReady, showCartPanel } = storeToRefs(appStore)

const route = useRoute()
const router = useRouter()

const roundAddress = ref<string>('')
const project = ref<Project | null>(null)
const isLoading = ref(true)

onMounted(async () => {
  const network = getRouteParamValue(route.params.network)
  const address = getRouteParamValue(route.params.address)
  const projectId = getRouteParamValue(route.params.id)
  if (!projectId) {
    if (network && address) {
      router.push({ name: 'leaderboard', params: { network, address } })
    } else {
      router.push({ name: 'rounds' })
    }
    return
  }
  roundAddress.value = address

  const _project = await getLeaderboardProject(roundAddress.value, projectId, network)
  if (_project === null) {
    // Project not found
    router.push({ name: 'projects' })
    return
  } else {
    project.value = _project
  }
  isLoading.value = false
})

useMeta(
  computed(() => {
    return {
      title: project.value ? operator + ' - ' + project.value.name : operator,
    }
  }),
)

const showClaimButton = computed(() => isAppReady.value && appStore.isCurrentRound(roundAddress.value))
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

@mixin project-grid() {
  display: grid;
  grid-template-columns: 1fr clamp(320px, 24%, 440px);
  grid-template-rows: repeat(2, auto);
  grid-template-areas: 'banner banner' 'details actions';
  grid-column-gap: 2rem;
  grid-row-gap: 3rem;
}
@mixin project-grid-mobile() {
  grid-template-columns: 1fr;
  grid-template-rows: repeat(3, auto);
  grid-template-areas: 'banner' 'details' 'actions';
  padding-bottom: 6rem;
}
.grid.cart-open {
  @include project-grid();
  @media (max-width: $breakpoint-xl) {
    @include project-grid-mobile();
  }
}
.grid.cart-closed {
  @include project-grid();
  @media (max-width: $breakpoint-m) {
    @include project-grid-mobile();
  }
}
.banner {
  grid-area: banner;
}
.sticky-column {
  grid-area: actions;
  position: sticky;
  top: 6rem;
  display: flex;
  flex-direction: column;
  align-self: start;
  gap: 1rem;
  @media (max-width: $breakpoint-l) {
    margin-bottom: 3rem;
  }
}
.project-image {
  border-radius: 4px;
  display: block;
  height: 320px;
  object-fit: cover;
  text-align: center;
  width: 100%;
}
.content {
  display: flex;
  gap: 3rem;
  margin-top: 4rem;
}
</style>
