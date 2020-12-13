<template>
  <div class="project">
    <a
      class="content-heading"
      @click="goBackToList()"
    >
        ⟵ All projects
    </a>
    <div v-if="project" class="project-page">
      <img class="project-image" :src="project.imageUrl" :alt="project.name">
      <h2 class="project-name" :title="project.address">
        <a
          v-if="klerosCurateUrl"
          :href="klerosCurateUrl"
          target="_blank"
          rel="noopener"
        >{{ project.name }}</a>
        <span v-else>{{ project.name }}</span>
      </h2>
      <button
        v-if="hasRegisterBtn()"
        class="btn register-btn"
        :disabled="!canRegister()"
        @click="register()"
      >
        Register
      </button>
      <button
        v-if="hasContributeBtn() && !inCart"
        class="btn contribute-btn"
        :disabled="!canContribute()"
        @click="contribute()"
      >
        Contribute
      </button>
      <button
        v-if="hasContributeBtn() && inCart"
        class="btn btn-inactive in-cart"
      >
        <img src="@/assets/checkmark.svg" />
        <span>In cart</span>
      </button>
      <button
        v-if="hasClaimBtn()"
        class="btn claim-btn"
        :disabled="!canClaim()"
        @click="claim()"
      >
        <template v-if="claimed">
          Received {{ formatAmount(allocatedAmount) }} {{ tokenSymbol }}
        </template>
        <template v-else>
          Claim {{ formatAmount(allocatedAmount)  }} {{ tokenSymbol }}
        </template>
      </button>
      <div class="project-description">{{ project.description }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { FixedNumber } from 'ethers'
import { DateTime } from 'luxon'

import { getAllocatedAmount, isFundsClaimed } from '@/api/claims'
import { DEFAULT_CONTRIBUTION_AMOUNT, CART_MAX_SIZE, CartItem } from '@/api/contributions'
import { recipientRegistryType } from '@/api/core'
import { Project, getProject } from '@/api/projects'
import { TcrItemStatus } from '@/api/recipient-registry-kleros'
import { RoundStatus } from '@/api/round'
import { Tally } from '@/api/tally'
import ClaimModal from '@/components/ClaimModal.vue'
import KlerosGTCRAdapterModal from '@/components/KlerosGTCRAdapterModal.vue'
import { ADD_CART_ITEM } from '@/store/mutation-types'

@Component({
  name: 'ProjectView',
  metaInfo() {
    return { title: (this as any).project?.name || '' }
  },
})
export default class ProjectView extends Vue {

  project: Project | null = null
  allocatedAmount: FixedNumber | null = null
  claimed: boolean | null = null

  private async checkAllocation(tally: Tally | null) {
    const currentRound = this.$store.state.currentRound
    if (!this.project || !currentRound || currentRound.status !== RoundStatus.Finalized || !tally) {
      return
    }
    this.allocatedAmount = await getAllocatedAmount(
      currentRound.fundingRoundAddress,
      currentRound.nativeTokenDecimals,
      tally.results.tally[this.project.index],
      tally.totalVoiceCreditsPerVoteOption.tally[this.project.index],
    )
    this.claimed = await isFundsClaimed(
      currentRound.fundingRoundAddress,
      this.project.index,
    )
  }

  async created() {
    const project = await getProject(this.$route.params.id)
    if (project !== null) {
      this.project = project
    } else {
      // Project not found
      this.$router.push({ name: 'projects' })
      return
    }
    // Wait for tally to load and get claim status
    this.$store.watch(
      (state) => state.tally,
      this.checkAllocation,
    )
    this.checkAllocation(this.$store.state.tally)
  }

  goBackToList(): void {
    const roundAddress = this.$store.state.currentRound?.fundingRoundAddress
    if (roundAddress) {
      this.$router.push({ name: 'round', params: { address: roundAddress }})
    } else {
      this.$router.push({ name: 'projects' })
    }
  }

  get klerosCurateUrl(): string | null {
    if (recipientRegistryType === 'kleros') {
      return this.project?.extra?.tcrItemUrl || null
    }
    return null
  }

  get tokenSymbol(): string {
    const currentRound = this.$store.state.currentRound
    return currentRound ? currentRound.nativeTokenSymbol : ''
  }

  get inCart(): boolean {
    const project = this.project
    if (project === null) {
      return false
    }
    const index = this.$store.state.cart.findIndex((item: CartItem) => {
      return item.id === project.id
    })
    return index !== -1
  }

  hasRegisterBtn(): boolean {
    return (
      recipientRegistryType === 'kleros' &&
      this.project?.index === 0 &&
      this.project?.extra.tcrItemStatus === TcrItemStatus.Registered
    )
  }

  canRegister(): boolean {
    return this.hasRegisterBtn() && this.$store.state.currentUser
  }

  register() {
    this.$modal.show(
      KlerosGTCRAdapterModal,
      { project: this.project },
      {
        clickToClose: false,
        height: 'auto',
        width: 450,
      },
      {
        closed: async () => {
          this.project = await getProject(this.$route.params.id)
        },
      },
    )
  }

  hasContributeBtn(): boolean {
    return (
      this.$store.state.currentRound &&
      this.project !== null &&
      this.project.index !== 0
    )
  }

  canContribute(): boolean {
    return (
      this.hasContributeBtn() &&
      this.$store.state.currentUser &&
      DateTime.local() < this.$store.state.currentRound.votingDeadline &&
      this.project !== null &&
      !this.project.isRemoved &&
      this.$store.state.cart.length < CART_MAX_SIZE
    )
  }

  contribute() {
    this.$store.commit(ADD_CART_ITEM, {
      ...this.project,
      amount: DEFAULT_CONTRIBUTION_AMOUNT.toString(),
    })
  }

  hasClaimBtn(): boolean {
    const currentRound = this.$store.state.currentRound
    return (
      currentRound &&
      currentRound.status === RoundStatus.Finalized &&
      this.project !== null &&
      this.project.index !== 0 &&
      this.allocatedAmount !== null &&
      this.claimed !== null
    )
  }

  canClaim(): boolean {
    return (
      this.hasClaimBtn() &&
      this.$store.state.currentUser &&
      this.claimed === false
    )
  }

  formatAmount(value: FixedNumber | null): string {
    const decimals = 6
    return value ? value.toUnsafeFloat().toFixed(decimals) : ''
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
          this.checkAllocation(this.$store.state.tally)
        },
      },
    )
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.content-heading {
  color: $text-color;
}

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

  a {
    color: $text-color;
  }
}

.contribute-btn,
.in-cart,
.register-btn,
.claim-btn {
  margin: 0 $content-space $content-space 0;
  width: 300px;
}

.project-description {
  font-size: 20px;
  line-height: 30px;
}
</style>
