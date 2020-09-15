<template>
  <div class="project">
    <router-link class="content-heading" to="/">⟵ All projects</router-link>
    <div v-if="project" class="project-page">
      <img class="project-image" :src="project.imageUrl" :alt="project.name">
      <h2 class="project-name">{{ project.name }}</h2>
      <button
        class="btn contribute-btn"
        :disabled="!canContribute()"
        @click="contribute()"
      >
        Contribute
      </button>
      <button
        class="btn claim-btn"
        :disabled="!canClaim()"
        @click="claim()"
      >
        Claim
      </button>
      <div class="project-description">{{ project.description }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'


import { getClaimedAmount } from '@/api/claims'
import { CART_MAX_SIZE } from '@/api/contributions'
import { Project, getProject } from '@/api/projects'
import { RoundInfo, RoundStatus } from '@/api/round'
import ClaimModal from '@/components/ClaimModal.vue'
import { ADD_CART_ITEM } from '@/store/mutation-types'

@Component({
  name: 'ProjectView',
})
export default class ProjectView extends Vue {

  project: Project | null = null
  claimedFunds: boolean | null = null

  private async checkClaim(round: RoundInfo) {
    if (!this.project || !round) {
      return
    }
    const claimedAmount = await getClaimedAmount(
      round.fundingRoundAddress,
      this.project.address,
    )
    this.claimedFunds = claimedAmount !== null
  }

  async created() {
    const project = await getProject(this.$route.params.address)
    if (project !== null) {
      this.project = project
    } else {
      // Project not found
      this.$router.push({ name: 'home' })
      return
    }
    // Wait for round info to load and get claim status
    this.$store.watch(
      (state) => state.currentRound,
      this.checkClaim,
    )
    this.checkClaim(this.$store.state.currentRound)
  }

  canContribute() {
    return this.$store.state.cart.length < CART_MAX_SIZE
  }

  contribute() {
    this.$store.commit(ADD_CART_ITEM, { ...this.project, amount: 0 })
  }

  canClaim(): boolean {
    const currentRound = this.$store.state.currentRound
    return (
      currentRound &&
      currentRound.status === RoundStatus.Finalized &&
      this.$store.state.account &&
      this.claimedFunds === false
    )
  }

  claim() {
    this.$modal.show(
      ClaimModal,
      { project: this.project },
      {
        clickToClose: false,
        height: 'auto',
        width: 450,
      },
      {
        closed: () => {
          this.checkClaim(this.$store.state.currentRound)
        },
      },
    )
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.project-image {
  border: $border;
  border-radius: 20px;
  display: block;
  height: 300px;
  object-fit: cover;
  text-align: center;
  width: 100%;
}

.project-name {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 40px;
  letter-spacing: -0.015em;
  margin: $content-space 0;
}

.contribute-btn,
.claim-btn {
  margin: 0 $content-space $content-space 0;
  width: 300px;
}

.project-description {
  font-size: 20px;
}
</style>
