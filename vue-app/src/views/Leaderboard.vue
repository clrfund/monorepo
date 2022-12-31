<template>
  <div>
    <loader v-if="isLoading"></loader>
    <div v-else>
      <div class="info" v-if="!isRoundFinalized">
        🤚 The round is not finalized, please check back later
      </div>
      <div class="info" v-else-if="projects.length === 0">
        😢 {{ $t('leaderboard.no_project') }}
      </div>
      <div v-else>
        <div class="header">
          <div>
            <h2>{{ $t('leaderboard.header') }}</h2>
          </div>
          <button class="btn-secondary" @click="toggleView()">
            <div v-if="isSimpleView">{{ $t('leaderboard.more') }}</div>
            <div v-else>{{ $t('leaderboard.less') }}</div>
          </button>
        </div>
        <div class="hr" />
        <div class="">
          <div v-if="isSimpleView">
            <leaderboard-simple-view
              v-for="(project, index) in projects"
              :project="project"
              :key="project.id"
              :rank="index + 1"
              :round="round"
            ></leaderboard-simple-view>
          </div>
          <div v-else>
            <leaderboard-detail-view
              :projects="projects"
              :round="round"
            ></leaderboard-detail-view>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import LeaderboardDetailView from '@/components/LeaderboardDetailView.vue'
import LeaderboardSimpleView from '@/components/LeaderboardSimpleView.vue'
import Loader from '@/components/Loader.vue'
import { TOGGLE_LEADERBOARD_VIEW } from '@/store/mutation-types'
import { LeaderboardProject } from '@/api/projects'
import { RoundInfo, RoundStatus } from '@/api/round'
import { LOAD_ROUNDS } from '@/store/action-types'

@Component({
  name: 'leaderboard',
  components: { LeaderboardSimpleView, LeaderboardDetailView, Loader },
})
export default class Leaderboard extends Vue {
  isLoading = true
  round: RoundInfo | null = null
  projects: LeaderboardProject[] = []

  get isSimpleView(): boolean {
    return this.$store.state.showSimpleLeaderboard
  }

  private async loadRound(address: string) {
    if (!this.$store.state.rounds) {
      await this.$store.dispatch(LOAD_ROUNDS)
    }

    const round = await this.$store.state.rounds.getRound(address)

    this.round = await round.getRoundInfo()
    this.projects = await round.getLeaderboardProjects()
  }

  async created() {
    const { address } = this.$route.params

    await this.loadRound(address)
    this.isLoading = false
  }

  get isRoundFinalized(): boolean {
    return this.round?.status === RoundStatus.Finalized
  }

  toggleView(): void {
    this.$store.commit(TOGGLE_LEADERBOARD_VIEW)
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.hr {
  grid-area: hr;
  width: 100%;
  border-bottom: 1px solid $border-light;
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
}
</style>