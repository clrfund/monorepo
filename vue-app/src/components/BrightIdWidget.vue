<template>
  <div v-if="isProjectCard" class="setup-container-project-card">
    <div class="row">
      <div v-if="isVerified">
        <icon-status
          v-bind:happy="true"
          logo="brightid.svg"
          secondaryLogo="checkmark.svg"
        />
      </div>
      <div v-if="!isVerified">
        <icon-status
          v-bind:sad="true"
          logo="brightid.svg"
          secondaryLogo="close-black.svg"
        />
      </div>
      <!-- TODO: should this icon demo verified status or completion of entire setup? Is it even needed?-->
      <h2>BrightID setup</h2>
      <p>
        <span
          :class="{
            step0: !isLinked && !isVerified && !isSponsored && !isRegistered,
            step1: isLinked,
            step2: isVerified || isSponsored,
            step3: isVerified && isSponsored,
            step4: isRegistered,
          }"
        />
        / 4
      </p>
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
  </div>
  <div v-else class="setup-container">
    <div class="row">
      <div v-if="isVerified">
        <icon-status
          v-bind:happy="true"
          logo="brightid.svg"
          secondaryLogo="checkmark.svg"
        />
      </div>
      <div v-if="!isVerified">
        <icon-status
          v-bind:sad="true"
          logo="brightid.svg"
          secondaryLogo="close-black.svg"
        />
      </div>
      <!-- TODO: should this icon demo verified status or completion of entire setup? Is it even needed?-->
      <h2>BrightID setup</h2>
      <p>
        <span
          :class="{
            step0: !isLinked && !isVerified && !isSponsored && !isRegistered,
            step1: isLinked,
            step2: isVerified || isSponsored,
            step3: isVerified && isSponsored,
            step4: isRegistered,
          }"
        />
        / 4
      </p>
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
    <div class="row">
      <div v-if="isLinked">
        <div v-if="isRegistered">
          <links to="/#/projects"
            >Start contributing
            <span role="img" aria-label="party emoji">🎉</span></links
          >
        </div>
        <div v-else>
          <links to="/#/setup/get-verified/:step">Continue setup</links>
        </div>
      </div>
      <!-- <links to="#" v-if="isLinked || isVerified || isSponsored">Continue setup</links>
      <links to="#" v-if="isRegistered">Start contributing</links> -->
      <links to="/#/setup/" v-else>Start setup</links>
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
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Tooltip from '@/components/Tooltip.vue'
import IconStatus from '@/components/IconStatus.vue'
import Links from '@/components/Links.vue'

// TODO clean up this component
@Component({
  components: { Tooltip, IconStatus, Links },
})
export default class BrightIdWidget extends Vue {
  isLinked = true // TODO add logic: user wallet is connected && BrightID profile is linked to user ETH address
  isVerified = true // TODO add logic: user is verified with Bright ID (NOT necessarily in the registry contract)
  isSponsored = true // TODO add logic
  isRegistered = true // TODO add logic: user is registered in the user registry contract

  // You can only have isRegistered status if all the above are true
  @Prop() abbrev!: string
  @Prop() balance!: string
  @Prop() isProjectCard!: boolean
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.setup-container {
  background: $bg-secondary-color;
  border-radius: 0.5rem;
  padding: 1rem;
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

.setup-container-project-card {
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
