<template>
  <div v-if="project" class="project-page">
    <info
      v-if="previewMode"
      class="info"
      message="This is what your contributors will see when they visit your project page."
    />
    <img
      v-if="previewMode"
      class="project-image"
      :src="project.bannerImageUrl"
      :alt="project.name"
    />
    <div class="about">
      <div class="title-container">
        <div>
          <h1
            class="project-name"
            :title="addressName"
            :project-index="project.index"
          >
            <links v-if="klerosCurateUrl" :to="klerosCurateUrl">{{
              project.name
            }}</links>
            <span v-else> {{ project.name }} </span>
          </h1>
          <p class="text-base tagline">{{ project.tagline }}</p>
          <div class="subtitle">
            <div class="text-body tag">{{ project.category }}</div>
            <div class="text-base team-byline" v-if="!!project.teamName">
              Team: <links to="#team"> {{ project.teamName }}</links>
            </div>
          </div>
        </div>
        <div v-if="!previewMode" class="actions-container">
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
      </div>
      <div class="project-section-container">
        <div class="project-section">
          <p class="text-body">About the project</p>
          <markdown :raw="project.description" />
        </div>
        <div class="project-section">
          <p class="text-body">The problem it solves</p>
          <markdown :raw="project.problemSpace" />
        </div>
        <div class="project-section">
          <p class="text-body">Funding plans</p>
          <markdown :raw="project.plans" />
        </div>
        <div class="project-section">
          <p class="text-body">Recipient address</p>
          <div class="address-container">
            <span>{{ addressName }}</span>
            <div class="copy-div">
              <copy-button
                :value="project.address"
                text="address"
                myClass="project-profile"
                :fixedColor="false"
              />
              <links
                class="explorerLink"
                :to="blockExplorer.url"
                :title="`View on ${blockExplorer.label}`"
                :hideArrow="true"
              >
                <img
                  class="icon"
                  :src="require(`@/assets/${blockExplorer.logo}`)"
                />
              </links>
            </div>
          </div>
        </div>

        <!-- <hr v-if="project.teamName || project.teamDescription" />
      <div
        id="team"
        v-if="project.teamName || project.teamDescription"
        class="team"
      >
        <h2>Team: {{ project.teamName }}</h2>
        <markdown :raw="project.teamDescription" />
      </div> -->
      </div>
      <link-box v-if="previewMode" :project="project" class="mt2" />
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { DateTime } from 'luxon'
import { Project } from '@/api/projects'
import { DEFAULT_CONTRIBUTION_AMOUNT, CartItem } from '@/api/contributions'
import { RoundStatus } from '@/api/round'
import { chain } from '@/api/core'
import { SAVE_CART } from '@/store/action-types'
import { ADD_CART_ITEM } from '@/store/mutation-types'
import { ensLookup } from '@/utils/accounts'
import Info from '@/components/Info.vue'
import Markdown from '@/components/Markdown.vue'
import CopyButton from '@/components/CopyButton.vue'
import LinkBox from '@/components/LinkBox.vue'
import Links from '@/components/Links.vue'
import AddToCartButton from '@/components/AddToCartButton.vue'
import ClaimButton from '@/components/ClaimButton.vue'

@Component({
  components: {
    Markdown,
    Info,
    LinkBox,
    CopyButton,
    Links,
    AddToCartButton,
    ClaimButton,
  },
})
export default class ProjectProfile extends Vue {
  @Prop() project!: Project
  @Prop() klerosCurateUrl!: string | null
  @Prop() previewMode!: boolean

  contributionAmount: number | null = DEFAULT_CONTRIBUTION_AMOUNT
  ens: string | null = null

  async mounted() {
    if (this.project.address) {
      this.ens = await ensLookup(this.project.address)
    }
  }

  get inCart(): boolean {
    const project = this.project
    if (project === null) {
      return false
    }
    const index = this.$store.state.cart.findIndex((item: CartItem) => {
      // Ignore cleared items
      return item.id === project.id && !item.isCleared
    })
    return index !== -1
  }

  hasContributeBtn(): boolean {
    return (
      this.isCurrentRound &&
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
      this.$store.state.currentRound.status !== RoundStatus.Cancelled &&
      this.project !== null &&
      !this.project.isLocked
    )
  }

  contribute() {
    if (!this.contributionAmount) {
      return
    }
    this.$store.commit(ADD_CART_ITEM, {
      ...this.project,
      amount: this.contributionAmount.toString(),
      isCleared: false,
    })
    this.$store.dispatch(SAVE_CART)
  }

  get blockExplorer(): { label: string; url: string; logo: string } {
    return {
      label: chain.explorerLabel,
      url: `${chain.explorer}/address/${this.project.address}`,
      logo: chain.explorerLogo,
    }
  }

  get addressName(): string {
    return this.ens || this.project.address
  }

  get isCurrentRound(): boolean {
    const roundAddress =
      this.$route.params.address || this.$store.state.currentRoundAddress
    return this.$store.getters.isCurrentRound(roundAddress)
  }

  get shouldShowCartInput(): boolean {
    const { isRoundContributionPhase, canUserReallocate } = this.$store.getters
    return (
      this.isCurrentRound && (isRoundContributionPhase || canUserReallocate)
    )
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.project-page {
  h2 {
    font-size: 20px;
  }

  hr {
    border: 0;
    border-bottom: 0.5px solid $button-disabled-text-color;
    margin-bottom: 3rem;
  }

  .info {
    margin-bottom: 1.5rem;
  }

  .project-image {
    border-radius: 0.25rem;
    display: block;
    height: 20rem;
    object-fit: cover;
    text-align: center;
    width: 100%;
    margin-bottom: 2rem;
  }

  .content {
    display: flex;
    gap: 3rem;
    margin-top: 4rem;
  }

  .about {
    padding-bottom: 0;

    .title-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;

      @media (max-width: $breakpoint-xl) {
        flex-direction: column;
        margin-bottom: 3rem;
      }

      .actions-container {
        max-width: 320px;
        width: 100%;

        @media (max-width: $breakpoint-xl) {
          max-width: calc(100vw - 1.5rem);
        }
      }
    }

    .project-name {
      font-weight: bold;
      margin: 0;

      a {
        color: var(--text-color);
      }
    }

    .tagline {
      margin-top: 0.25rem;
      margin-bottom: 1rem;
      font-size: 1.125rem;
    }

    .subtitle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 3rem;
      @media (max-width: $breakpoint-l) {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .tag {
        color: $clr-white;
        background: $clr-purple;
        border-radius: 4px;
        padding: 0.25rem 0.75rem;
        font-size: 18px;
      }

      .team-byline {
        font-size: 18px;

        a {
          color: $clr-purple;
        }
      }
    }

    .project-section-container {
      display: flex;
      flex-direction: column;
      gap: 3rem;
    }

    .project-section {
      border: 1px solid $clr-dark-gray;
      border-radius: 20px;
      padding: 2rem 2.5rem;

      p {
        color: $clr-dark-white;
      }

      .markdown {
        background: transparent;
        color: var(--text-color);

        ::v-deep {
          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            padding: 0;
          }
          p {
            padding: 0;
            font-family: 'Work Sans';
            font-style: normal;
            font-weight: 600;
            font-size: 18px;
            line-height: 140%;
          }
        }
      }
    }

    .address-box {
      padding: 1rem;
      margin-bottom: 3rem;
      border-radius: 0.5rem;
      box-shadow: var(--box-shadow);
      background: var(--bg-address-box);
      display: flex;
      align-items: center;
      justify-content: space-between;

      @media (max-width: $breakpoint-m) {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }

      .address-label {
        font-size: 14px;
        margin: 0;
        font-weight: 400;
        margin-bottom: 0.25rem;
        text-transform: uppercase;
      }
    }

    .address-box-no-team {
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: var(--box-shadow);
      background: var(--bg-address-box);
      display: flex;
      align-items: center;
      justify-content: space-between;

      @media (max-width: $breakpoint-l) {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }
    }

    .team {
      padding: 1rem;
      margin-bottom: 3rem;
      border-radius: 0.25rem;
      background: var(--bg-secondary-color);
      @media (max-width: $breakpoint-l) {
        margin-bottom: 0;
      }

      h2 {
        font-size: 24px;
        font-weight: 400;
        font-family: 'Glacial Indifference', sans-serif;
        margin-top: 0;
      }
    }
  }

  .sticky-column {
    position: sticky;
    top: 2rem;
    align-self: start;
    gap: 1rem;
    display: flex;
    flex-direction: column;

    .button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      justify-content: center;
    }
  }

  .address-container {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    color: var(--text-color);
    padding: 0;
    font-family: 'Work Sans';
    font-style: normal;
    font-weight: 600;
    font-size: 18px;
    line-height: 140%;
  }

  .copy-div {
    display: flex;
    gap: 0.5rem;

    .explorerLink {
      margin: 0;
      padding: 0;
      .icon {
        @include icon(none, var(--explorer-hover));
        filter: var(--img-filter, invert(0.7));
      }
    }
  }
}
</style>
