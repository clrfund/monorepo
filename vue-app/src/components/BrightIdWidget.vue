<template>
  <div class="setup-container">
    <div class="row">
        <div v-if="isVerified">
            <icon-status v-bind:happy="true" logo='brightid.svg' secondaryLogo='checkmark.svg' />
        </div>
        <div v-if="!isVerified">
            <icon-status v-bind:sad="true" logo='brightid.svg' secondaryLogo='close-black.svg' />
        </div>
        <h2>BrightID setup</h2>
        <p>
            <span :class="{
                'step0': !isConnected && !isVerified && !isSponsored && !isRegistered,
                'step1': isConnected,
                'step2': isVerified || isSponsored,
                'step3': isVerified && isSponsored,
                'step4': isRegistered
            }" />
            / 4
        </p>
    </div>
    <div class="progress">
        <div :class="{
            'half': isVerified || isSponsored,
            'quarter': isConnected,
            'three-quarters': isVerified && isSponsored,
            'full': isRegistered
        }" />
    </div>
    <div class="row">
        <div v-if="isConnected">
            <div v-if="isRegistered"><a href="/#/projects">Start contributing <span role="img" aria-label="party emoji">🎉</span></a></div> 
            <div v-else><a href="/#/setup/get-verified/:step">Continue setup</a></div>
        </div>
        <!-- <a href="#" v-if="isConnected || isVerified || isSponsored">Continue setup</a>
        <a href="#" v-if="isRegistered">Start contributing</a> -->
        <a href="/#/setup/" v-else>Start setup</a>
        <tooltip 
            position="left" 
            :content="isVerified ? 'You\'re a verified human on BrightID!' : 'Your BrightID profile still needs to be verified.'"
        >
            <p :class="isVerified ? 'brightid-verified' : 'unverified'">{{isVerified ? 'Verified' : 'Unverified'}}</p>
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

@Component({
  components: { Tooltip, IconStatus },
})
export default class BrightIdWidget extends Vue {
    isConnected = true
    isVerified = false
    isSponsored = true
    isRegistered = false
    // You can only have isRegistered status if all the above are true
  @Prop() abbrev!: string
  @Prop() balance!: string
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
      font-family: "Glacial Indifference", sans-serif;
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
        color: $warning-color
    }
    .brightid-verified {
        color: $clr-green
    }

    .step0:before {
        content: "0";
    }
    .step1:before {
        content: "1";
    }
    .step2:before {
        content: "2";
    }
    .step3:before {
        content: "3";
    }
    .step4:before {
        content: "4";
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