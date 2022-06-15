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
        <claim-button :project="project" />
        <p
          v-if="
            $store.getters.hasUserContributed &&
            !$store.getters.canUserReallocate
          "
        >
          ✔️ You have contributed to this project!
        </p>
      </div>
      <link-box :project="project" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { FixedNumber } from 'ethers'

import {
  Project,
  getRecipientRegistryAddress,
  getProject,
} from '@/api/projects'
import { getCurrentRound } from '@/api/round'
import Loader from '@/components/Loader.vue'
import ProjectProfile from '@/components/ProjectProfile.vue'
import AddToCartButton from '@/components/AddToCartButton.vue'
import LinkBox from '@/components/LinkBox.vue'
import ClaimButton from '@/components/ClaimButton.vue'
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
  components: { Loader, ProjectProfile, AddToCartButton, LinkBox, ClaimButton },
})
export default class ProjectView extends Vue {
  project: Project | null = null
  allocatedAmount: FixedNumber | null = null
  claimed: boolean | null = null
  isLoading = true

  async created() {
    //TODO: update to take factory address as a parameter, default to env. variable
    const roundAddress =
      this.$store.state.currentRoundAddress || (await getCurrentRound())
    if (
      roundAddress &&
      roundAddress !== this.$store.state.currentRoundAddress
    ) {
      // Select round
      //TODO: SELECT_ROUND action also commits SET_CURRENT_FACTORY_ADDRESS on this action, should be passed optionally and default to env variable
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
    this.isLoading = false
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
