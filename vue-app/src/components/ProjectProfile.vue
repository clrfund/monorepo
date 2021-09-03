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
        :title="project.address"
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
            {{ project.address }}
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
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { DateTime } from 'luxon'
import { FixedNumber } from 'ethers'
import { Tally } from '@/api/tally'
import { getAllocatedAmount, isFundsClaimed } from '@/api/claims'
import { Project } from '@/api/projects'
import Info from '@/components/Info.vue'
import Markdown from '@/components/Markdown.vue'
import CopyButton from '@/components/CopyButton.vue'
import { DEFAULT_CONTRIBUTION_AMOUNT, CartItem } from '@/api/contributions'
import { RoundStatus } from '@/api/round'
import { blockExplorer } from '@/api/core'
import { SAVE_CART } from '@/store/action-types'
import { ADD_CART_ITEM } from '@/store/mutation-types'
import ClaimModal from '@/components/ClaimModal.vue'
import LinkBox from '@/components/LinkBox.vue'
import Links from '@/components/Links.vue'

@Component({ components: { Markdown, Info, LinkBox, CopyButton, Links } })
export default class ProjectProfile extends Vue {
  allocatedAmount: FixedNumber | null = null
  contributionAmount: number | null = DEFAULT_CONTRIBUTION_AMOUNT
  claimed: boolean | null = null
  @Prop() project!: Project
  @Prop() klerosCurateUrl!: string | null
  @Prop() previewMode!: boolean

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
      this.project.index
    )
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

  get blockExplorerUrl(): string {
    return `${blockExplorer}/address/${this.project.address}`
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
