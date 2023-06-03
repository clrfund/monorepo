<template>
  <div>
    <loader v-if="isLoading"></loader>
    <div v-else>
      <div class="info" v-if="!round">🤚 {{ $t('leaderboard.no_round') }}</div>
      <div v-else-if="projects">
        <div class="info" v-if="projects.length === 0">😢 {{ $t('leaderboard.no_project') }}</div>
        <template v-else>
          <div class="header">
            <div>
              <h2>{{ $t('leaderboard.header') }}</h2>
            </div>
            <button class="btn-secondary" @click="appStore.toggleLeaderboardView()">
              <div v-if="showSimpleLeaderboard">{{ $t('leaderboard.more') }}</div>
              <div v-else>{{ $t('leaderboard.less') }}</div>
            </button>
          </div>
          <div class="hr" />
          <div class="">
            <div v-if="showSimpleLeaderboard">
              <leaderboard-simple-view
                v-for="(project, index) in projects"
                :project="project"
                :key="project.id"
                :rank="index + 1"
                :round="round"
              ></leaderboard-simple-view>
            </div>
            <div v-else>
              <leaderboard-detail-view :projects="projects" :round="round"></leaderboard-detail-view>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores'
import { useRouter, useRoute } from 'vue-router'
import type { RoundInfo } from '@/api/round'
import type { LeaderboardProject } from '@/api/projects'
import { toLeaderboardProject } from '@/api/projects'
import { getLeaderboardData } from '@/api/leaderboard'

const router = useRouter()
const route = useRoute()

const isLoading = ref(true)
const round = ref<RoundInfo | null>(null)
const projects = ref<LeaderboardProject[] | null>(null)

const appStore = useAppStore()
const { showSimpleLeaderboard } = storeToRefs(appStore)

async function loadLeaderboard(address: string, network: string) {
  const data = await getLeaderboardData(address, network)
  return data
}

onMounted(async () => {
  if (!route.params.address || !route.params.network) {
    router.push({ name: 'rounds' })
    return
  }

  const { address, network } = route.params
  const data = await loadLeaderboard(address as string, network as string)

  // redirect to projects view if not finalized or no static round data for leaderboard
  if (!data?.projects) {
    router.push({ name: 'round' })
    return
  }

  projects.value = data.projects
    .filter(project => project.state != 'Removed')
    .map(project => toLeaderboardProject(project))
    .sort((p1: LeaderboardProject, p2: LeaderboardProject) => p2.allocatedAmount.sub(p1.allocatedAmount))

  round.value = { ...data.round, fundingRoundAddress: data.round.address, network }

  isLoading.value = false
})
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.hr {
  grid-area: hr;
  width: 100%;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 2rem;
}

.info {
  background: var(--bg-secondary-highlight);
  border-radius: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  margin-top: 2rem;
}

.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
</style>
