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
              <date-range
                class="round-period"
                v-if="round"
                :start-date="round.startTime"
                :end-date="round.votingDeadline"
              />
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
import { toRoundInfo } from '@/api/round'
import type { LeaderboardProject } from '@/api/projects'
import { toLeaderboardProject } from '@/api/projects'
import { getLeaderboardData } from '@/api/leaderboard'
import { getRouteParamValue } from '@/utils/route'

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

  const address = getRouteParamValue(route.params.address)
  const network = getRouteParamValue(route.params.network)
  const data = await loadLeaderboard(address, network)

  // redirect to projects view if not finalized or no static round data for leaderboard
  if (!data?.projects) {
    router.push({ name: 'round' })
    return
  }

  try {
    projects.value = data.projects
      .filter(project => project.state != 'Removed')
      .map(project => toLeaderboardProject(project))
      .sort((p1: LeaderboardProject, p2: LeaderboardProject) => {
        const diff = p2.allocatedAmount - p1.allocatedAmount
        if (diff === BigInt(0)) return 0
        if (diff > BigInt(0)) return 1
        return -1
      })
  } catch (err) {
    console.log('Error sorting project information', err)
  }

  try {
    round.value = toRoundInfo(data.round, network)
  } catch (e) {
    console.log('Error converting to round info', e)
  }

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

.round-period {
  font-size: 14px;
}
</style>
