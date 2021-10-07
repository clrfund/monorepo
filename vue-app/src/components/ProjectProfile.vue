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
      <p class="tagline">{{ project.tagline }}</p>
      <div class="subtitle">
        <div class="tag">{{ project.category }} tag</div>
        <div class="team-byline">
          Team: <links to="#team"> {{ project.teamName }}</links>
        </div>
      </div>
      <div class="mobile mb2">
        <div class="input-button" v-if="hasContributeBtn() && !inCart">
          <img class="token-icon" height="24px" src="@/assets/dai.svg" />
          <input
            v-model="contributionAmount"
            class="input"
            name="contributionAmount"
            placeholder="5"
            autocomplete="on"
            onfocus="this.value=''"
          />
          <input
            type="submit"
            class="donate-btn"
            :disabled="!canContribute()"
            @click="contribute()"
            value="Add to cart"
          />
        </div>
        <div class="input-button" v-if="hasContributeBtn() && inCart">
          <button class="donate-btn-full">
            <span>In cart 🎉</span>
          </button>
        </div>
        <claim-button :project="project" />
      </div>
      <div class="project-section">
        <h2>About the project</h2>
        <markdown :raw="project.description" />
      </div>
      <div class="project-section">
        <h2>The problem it solves</h2>
        <markdown :raw="project.problemSpace" />
      </div>
      <div class="project-section">
        <h2>Funding plans</h2>
        <markdown :raw="project.plans" />
      </div>
      <div
        :class="{
          'address-box': project.teamName || project.teamDescription,
          'address-box-no-team': !project.teamName && !project.teamDescription,
        }"
      >
        <div>
          <div class="address-label">Recipient address</div>
          <div class="address">
            {{ addressName }}
          </div>
        </div>
        <div class="copy-div">
          <copy-button
            :value="project.address"
            text="address"
            myClass="project-profile"
            :hasBorder="true"
          />
          <links
            class="explorerLink"
            :to="blockExplorerUrl"
            title="View on Etherscan"
            :hideArrow="true"
          >
            <img class="icon" src="@/assets/etherscan.svg" />
          </links>
        </div>
      </div>
      <hr v-if="project.teamName || project.teamDescription" />
      <div
        id="team"
        v-if="project.teamName || project.teamDescription"
        class="team"
      >
        <h2>Team: {{ project.teamName }}</h2>
        <markdown :raw="project.teamDescription" />
      </div>
    </div>
    <link-box v-if="previewMode" :project="project" class="mt2" />
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { DateTime } from 'luxon'
import { Project } from '@/api/projects'
import { DEFAULT_CONTRIBUTION_AMOUNT, CartItem } from '@/api/contributions'
import { RoundStatus } from '@/api/round'
import { blockExplorer } from '@/api/core'
import { SAVE_CART } from '@/store/action-types'
import { ADD_CART_ITEM } from '@/store/mutation-types'
import { ensLookup } from '@/utils/accounts'
import Info from '@/components/Info.vue'
import Markdown from '@/components/Markdown.vue'
import CopyButton from '@/components/CopyButton.vue'
import LinkBox from '@/components/LinkBox.vue'
import Links from '@/components/Links.vue'
import ClaimButton from '@/components/ClaimButton.vue'

@Component({
  components: { Markdown, Info, LinkBox, CopyButton, Links, ClaimButton },
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

  get blockExplorerUrl(): string {
    return `${blockExplorer}/address/${this.project.address}`
  }

  get addressName(): string {
    return this.ens || this.project.address
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

    .tagline {
      font-size: 1.5rem;
      line-height: 150%;
      margin-top: 0.25rem;
      margin-bottom: 1rem;
      font-family: 'Glacial Indifference', sans-serif;
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

      .team-byline {
        line-height: 150%;
      }
    }

    .project-section {
      margin-bottom: 3rem;
      color: #f7f7f7;
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

      .address {
        display: flex;
        font-family: 'Glacial Indifference', sans-serif;
        font-weight: 600;
        border-radius: 8px;
        align-items: center;
        gap: 0.5rem;
        word-break: break-all;
      }
    }

    .address-box-no-team {
      padding: 1rem;
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

    .team {
      padding: 1rem;
      margin-bottom: 3rem;
      border-radius: 0.25rem;
      background: $bg-secondary-color;
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

  .copy-div {
    display: flex;
    gap: 0.5rem;

    .explorerLink {
      margin: 0;
      padding: 0;
      .icon {
        @include icon(none, $bg-light-color);
        border: 1px solid $text-color;
      }
    }
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
    @include disabledAttribute;
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

  .input {
    background: none;
    border: none;
    color: $bg-primary-color;
    width: 100%;
  }
}
</style>
