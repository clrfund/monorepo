<template>
  <div
    :class="`grid ${isCartToggledOpen ? 'cart-open' : 'cart-closed'}`"
    v-if="project"
  >
    <img
      class="project-image banner"
      :src="project.bannerImageUrl"
      :alt="project.name"
    />
    <project-profile class="details" :project="project" :previewMode="false" />
    <div class="sticky-column">
      <div class="desktop">
        <add-to-cart-button
          v-if="shouldShowCartInput && hasContributeBtn()"
          :project="project"
        />

        <!-- TODO: EXTRACT INTO COMPONENT: INPUT BUTTON -->
        <button
          v-if="hasClaimBtn()"
          class="btn-primary"
          :disabled="!canClaim()"
          @click="claim()"
        >
          <template v-if="claimed">
            Received {{ formatAmount(allocatedAmount) }} {{ tokenSymbol }}
          </template>
          <template v-else>
            Claim {{ formatAmount(allocatedAmount) }} {{ tokenSymbol }}
          </template>
        </button>
        <button
          class="donate-btn-full"
          v-if="
            $store.getters.hasUserContributed &&
            !$store.getters.canUserReallocate
          "
        >
          <span>Contributed!</span>
        </button>
      </div>
      <link-box :project="project" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { FixedNumber } from 'ethers'

import { getAllocatedAmount, isFundsClaimed } from '@/api/claims'
import { recipientRegistryType } from '@/api/core'
import {
  Project,
  getRecipientRegistryAddress,
  getProject,
} from '@/api/projects'
import { RoundStatus, getCurrentRound } from '@/api/round'
import { Tally } from '@/api/tally'
import ClaimModal from '@/components/ClaimModal.vue'
import Loader from '@/components/Loader.vue'
import ProjectProfile from '@/components/ProjectProfile.vue'
import AddToCartButton from '@/components/AddToCartButton.vue'
import LinkBox from '@/components/LinkBox.vue'
import {
  SELECT_ROUND,
  LOAD_ROUND_INFO,
  LOAD_USER_INFO,
  LOAD_CART,
  LOAD_COMMITTED_CART,
  LOAD_CONTRIBUTOR_DATA,
} from '@/store/action-types'
import { SET_RECIPIENT_REGISTRY_ADDRESS } from '@/store/mutation-types'
import { markdown } from '@/utils/markdown'

@Component({
  metaInfo() {
    return { title: (this as any).project?.name || '' }
  },
  components: { Loader, ProjectProfile, AddToCartButton, LinkBox },
})
export default class ProjectView extends Vue {
  project: Project | null = null
  allocatedAmount: FixedNumber | null = null
  claimed: boolean | null = null
  isLoading = true

  private async checkAllocation(tally: Tally | null) {
    const currentRound = this.$store.state.currentRound
    if (
      !this.project ||
      !currentRound ||
      currentRound.status !== RoundStatus.Finalized ||
      !tally
    ) {
      return
    }
    this.allocatedAmount = await getAllocatedAmount(
      currentRound.fundingRoundAddress,
      currentRound.nativeTokenDecimals,
      tally.results.tally[this.project.index],
      tally.totalVoiceCreditsPerVoteOption.tally[this.project.index]
    )
    this.claimed = await isFundsClaimed(
      currentRound.fundingRoundAddress,
      this.project.id
    )
  }

  async created() {
    const roundAddress =
      this.$store.state.currentRoundAddress || (await getCurrentRound())
    if (
      roundAddress &&
      roundAddress !== this.$store.state.currentRoundAddress
    ) {
      // Select round
      this.$store.dispatch(SELECT_ROUND, roundAddress)
      // Don't wait for round info to improve loading time
      ;(async () => {
        await this.$store.dispatch(LOAD_ROUND_INFO)
        if (this.$store.state.currentUser) {
          // Load user data if already logged in
          this.$store.dispatch(LOAD_USER_INFO)
          this.$store.dispatch(LOAD_CART)
          this.$store.dispatch(LOAD_COMMITTED_CART)
          this.$store.dispatch(LOAD_CONTRIBUTOR_DATA)
        }
      })()
    }
    if (this.$store.state.recipientRegistryAddress === null) {
      const registryAddress = await getRecipientRegistryAddress(roundAddress)
      this.$store.commit(SET_RECIPIENT_REGISTRY_ADDRESS, registryAddress)
    }

    const project = await getProject(
      this.$store.state.recipientRegistryAddress,
      this.$route.params.id
    )
    if (project === null || project.isHidden) {
      // Project not found
      this.$router.push({ name: 'projects' })
      return
    } else {
      this.project = project
    }
    // Wait for tally to load and get claim status
    this.$store.watch((state) => state.tally, this.checkAllocation)
    this.checkAllocation(this.$store.state.tally)
    this.isLoading = false
  }

  goBackToList(): void {
    const roundAddress = this.$store.state.currentRound?.fundingRoundAddress
    if (roundAddress) {
      this.$router.push({ name: 'round', params: { address: roundAddress } })
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

  get isCartToggledOpen(): boolean {
    return this.$store.state.showCartPanel
  }

  get shouldShowCartInput(): boolean {
    const { isRoundContributionPhase, canUserReallocate } = this.$store.getters
    return isRoundContributionPhase || canUserReallocate
  }

  hasContributeBtn(): boolean {
    return (
      this.$store.state.currentRound &&
      this.project !== null &&
      this.project.index !== 0
    )
  }

  hasClaimBtn(): boolean {
    const currentRound = this.$store.state.currentRound
    return (
      currentRound &&
      currentRound.status === RoundStatus.Finalized &&
      this.project !== null &&
      this.project.index !== 0 &&
      this.project.isHidden === false &&
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
      {},
      {
        closed: () => {
          this.checkAllocation(this.$store.state.tally)
        },
      }
    )
  }

  get descriptionHtml(): string {
    return markdown.render(this.project?.description || '')
  }
}
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
  top: 2rem;
  display: flex;
  flex-direction: column;
  align-self: start;
  gap: 1rem;
  @media (max-width: $breakpoint-l) {
    margin-bottom: 3rem;
  }
}

.back-button {
  color: $text-color;
  text-decoration: underline;
  &:hover {
    transform: scale(1.01);
  }
}

.tagline {
  font-size: 1.5rem;
  line-height: 150%;
  margin-top: 0.25rem;
  margin-bottom: 1rem;
  font-family: 'Glacial Indifference', sans-serif;
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

.project-section {
  margin-bottom: 3rem;
  color: #f7f7f7;
}

.team {
  padding: 1rem;
  margin-bottom: 3rem;
  border-radius: 0.25rem;
  background: $bg-secondary-color;
}

.team h2 {
  font-size: 16px;
  font-weight: 400;
  font-family: 'Glacial Indifference', sans-serif;
}

.address-box {
  padding: 1rem;
  margin-bottom: 3rem;
  border-radius: 0.5rem;
  box-shadow: $box-shadow;
  background: $clr-blue-gradient;
  display: flex;
  align-items: center;
  justify-content: space-between;
  @media (max-width: $breakpoint-l) {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}

.team-byline {
  line-height: 150%;
}

.admin-box {
  background: $bg-primary-color;
  padding: 1.5rem;
  min-width: 320px;
  border-radius: 16px;
  border: 1px solid $error-color;
}

.project-name {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 2.5rem;
  letter-spacing: -0.015em;
  margin: 0;

  a {
    color: $text-color;
  }
}

.tag {
  padding: 0.5rem 0.75rem;
  background: $bg-light-color;
  color: $button-disabled-text-color;
  font-family: 'Glacial Indifference', sans-serif;
  width: fit-content;
  border-radius: 4px;
}

.contribute-btn,
.in-cart,
.claim-btn {
  width: 100%;
}

.input-button {
  background: #f7f7f7;
  border-radius: 2rem;
  border: 2px solid $bg-primary-color;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: black;
  padding: 0.125rem;
  z-index: 100;
}

.donate-btn {
  padding: 0.5rem 1rem;
  background: $bg-primary-color;
  color: white;
  border-radius: 32px;
  font-size: 16px;
  font-family: Inter;
  border: none;
  cursor: pointer;
  box-shadow: 0px 4px 4px 0px 0, 0, 0, 0.25;
}

.donate-btn-full {
  background: $bg-primary-color;
  color: white;
  border-radius: 32px;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  line-height: 150%;
  border: none;
  width: 100%;
  text-align: center;
  box-shadow: 0px 4px 4px 0px 0, 0, 0, 0.25;
  z-index: 1;
}

.input-button {
  background: #f7f7f7;
  border-radius: 2rem;
  border: 2px solid $bg-primary-color;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: black;
  padding: 0.125rem;
  z-index: 100;
}

.input {
  background: none;
  border: none;
  color: $bg-primary-color;
  width: 100%;
}

.project-description {
  font-size: 1rem;
  line-height: 150%;
  word-wrap: break-word;

  ::v-deep {
    &:first-child {
      margin-top: 0;
    }
  }
}

.address {
  font-family: 'Glacial Indifference', sans-serif;
  /*   padding: 1rem;
  background: $bg-secondary-color; */
  /* border: 1px solid #000; */
  border-radius: 8px;
  display: flex;
  align-items: center;
  /* justify-content: space-between; */
  gap: 0.5rem;
  font-weight: 600;
}

.address-label {
  font-size: 14px;
  margin: 0;
  font-weight: 400;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}

.nav-area {
  grid-area: navi;
}

.nav-bar {
  display: inherit;
  position: sticky;
  bottom: 0;
  right: 0;
  left: 0;
  padding: 1.5rem;
  background: $bg-primary-color;
  border-radius: 32px 32px 0 0;
  box-shadow: $box-shadow;
}

.project-page h2 {
  font-size: 20px;
}

.project-page hr {
  border: 0;
  border-bottom: 0.5px solid $button-disabled-text-color;
  margin-bottom: 3rem;
}
</style>
