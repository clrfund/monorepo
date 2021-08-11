<template>
  <div
    :class="{
      'bright-id-widget-container': true,
      'bright-id-profile-widget': !isProjectCard,
    }"
  >
    <div class="row">
      <div v-if="isVerified">
        <icon-status
          v-bind:happy="true"
          logo="brightid.svg"
          secondaryLogo="checkmark.svg"
        />
      </div>
      <div v-else>
        <icon-status
          v-bind:sad="true"
          logo="brightid.svg"
          secondaryLogo="close-black.svg"
        />
      </div>
      <h2>BrightID setup</h2>
      <p>{{ getCurrentStep }} / 4</p>
    </div>
    <div class="progress">
      <div
        :class="{
          half: isVerified || isSponsored,
          quarter: isLinked,
          'three-quarters': isVerified && isSponsored,
          full: isRegistered,
        }"
      />
    </div>
    <div v-if="!isProjectCard" class="setup-container">
      <div class="row">
        <div v-if="isLinked">
          <div v-if="isRegistered">
            <a href="/#/projects"
              >Start contributing
              <span role="img" aria-label="party emoji">🎉</span></a
            >
          </div>
          <div v-else>
            <a href="/#/verify/" @click="toggleProfile">Continue setup</a>
          </div>
        </div>
        <a href="/#/verify/" @click="toggleProfile" v-else>Start setup</a>
        <tooltip
          position="left"
          :content="
            isVerified
              ? 'You\'re a verified human on BrightID!'
              : 'Your BrightID profile still needs to be verified.'
          "
        >
          <p :class="isVerified ? 'brightid-verified' : 'unverified'">
            {{ isVerified ? 'Verified' : 'Unverified' }}
          </p>
        </tooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Tooltip from '@/components/Tooltip.vue'
import IconStatus from '@/components/IconStatus.vue'

// TODO clean up this component
@Component({
  components: { Tooltip, IconStatus },
})
export default class BrightIdWidget extends Vue {
  @Prop() abbrev!: string
  @Prop() balance!: string
  @Prop() isProjectCard!: boolean
  @Prop() toggleProfile!: void

  get isLinked(): boolean {
    return (
      this.$store.state.currentUser &&
      this.$store.state.currentUser.brightId.isLinked
    )
  }

  get isVerified(): boolean {
    return (
      this.$store.state.currentUser &&
      this.$store.state.currentUser.brightId.isVerified
    )
  }

  get isSponsored(): boolean {
    return (
      this.$store.state.currentUser &&
      this.$store.state.currentUser.brightId.isSponsored
    )
  }

  get isRegistered(): boolean {
    return (
      this.$store.state.currentUser &&
      this.$store.state.currentUser.isRegistered
    )
  }

  get getCurrentStep(): number {
    if (!this.isLinked) {
      return 0
    }

    if (!this.isSponsored) {
      return 1
    }

    if (!this.isVerified) {
      return 2
    }

    if (!this.isRegistered) {
      return 3
    }

    return 4
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.setup-container {
  background: $bg-secondary-color;
  border-radius: 0.5rem;
  padding: 0.5rem 0;
  width: auto;
  height: auto;

  h2 {
    font-size: 20px;
    font-family: 'Glacial Indifference', sans-serif;
    margin: 0;
  }
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  p {
    margin: 0;
    font-weight: 600;
  }
  a {
    margin: 0;
    line-height: 0;
  }
  .unverified {
    color: $warning-color;
  }
  .brightid-verified {
    color: $clr-green;
  }

  .step0:before {
    content: '0';
  }
  .step1:before {
    content: '1';
  }
  .step2:before {
    content: '2';
  }
  .step3:before {
    content: '3';
  }
  .step4:before {
    content: '4';
  }
  .span {
    margin: 0;
    line-height: 0;
  }
}

.bright-id-widget-container {
  background: $bg-secondary-color;
  border-radius: 0.5rem;

  width: auto;
  height: auto;

  h2 {
    font-size: 20px;
    font-family: 'Glacial Indifference', sans-serif;
    margin: 0;
  }
}

.bright-id-profile-widget {
  padding: 1rem;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  p {
    margin: 0;
    font-weight: 600;
  }
  a {
    margin: 0;
    line-height: 0;
  }
  .unverified {
    color: $warning-color;
  }
  .brightid-verified {
    color: $clr-green;
  }

  .step0:before {
    content: '0';
  }
  .step1:before {
    content: '1';
  }
  .step2:before {
    content: '2';
  }
  .step3:before {
    content: '3';
  }
  .step4:before {
    content: '4';
  }
  .span {
    margin: 0;
    line-height: 0;
  }
}

.progress {
  width: 100%;
  border-radius: 2rem;
  height: 0.5rem;
  background: $clr-pink-light-gradient-inactive;
  margin: 1rem 0rem;

  .quarter {
    width: 25%;
    background: $clr-pink-light-gradient;
    height: 0.5rem;
    border-radius: 2rem;
  }
  .half {
    width: 50%;
    background: $clr-pink-light-gradient;
    height: 0.5rem;
    border-radius: 2rem;
  }
  .three-quarters {
    width: 75%;
    background: $clr-pink-light-gradient;
    height: 0.5rem;
    border-radius: 2rem;
  }
  .full {
    width: 100%;
    background: $clr-pink-light-gradient;
    height: 0.5rem;
    border-radius: 2rem;
  }
}
</style>
