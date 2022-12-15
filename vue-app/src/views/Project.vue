<template>
  <div class="project-container" v-if="project">
    <img
      class="project-image banner"
      :src="project.bannerImageUrl"
      :alt="project.name"
    />
    <project-profile class="details" :project="project" :previewMode="false" />
    <link-box :project="project" />
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
    if (!!this.$route.params.address && !this.$route.params.id) {
      // missing project id, redirect back to rounds
      this.$router.push({ name: 'rounds', params: this.$route.params })
      return
    }

    //TODO: update to take factory address as a parameter, default to env. variable
    const currentRoundAddress =
      this.$store.state.currentRoundAddress || (await getCurrentRound())

    const roundAddress = this.$route.params.address || currentRoundAddress

    const registryAddress = await getRecipientRegistryAddress(roundAddress)
    const project = await getProject(registryAddress, this.$route.params.id)
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

  get isCurrentRound(): boolean {
    const { currentRoundAddress } = this.$store.state
    const roundAddress = this.$route.params.address || currentRoundAddress
    return this.$store.getters.isCurrentRound(roundAddress)
  }

  get shouldShowCartInput(): boolean {
    const { isRoundContributionPhase, canUserReallocate } = this.$store.getters
    return (
      (this.isCurrentRound && isRoundContributionPhase) || canUserReallocate
    )
  }

  hasContributeBtn(): boolean {
    return (
      this.isCurrentRound && this.project !== null && this.project.index !== 0
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

.project-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 0 1.5rem 0 0;

  @media (max-width: $breakpoint-xl) {
    padding: 0 0.75rem;
    max-width: calc(100vw - 1.5rem);
    margin-bottom: 3rem;
  }
}

.banner {
  grid-area: banner;
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
