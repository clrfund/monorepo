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
          secondaryLogo="close-white.svg"
        />
      </div>
      <div class="text-base text-small">BrightID setup</div>
      <div class="ml-auto text-base text-small">{{ getCurrentStep }} / 4</div>
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
          <div class="text-base text-xsmall" v-if="isRegistered">
            <a href="/#/projects" @click="$emit('close')">
              Start contributing
              <span role="img" aria-label="party emoji">🎉</span>
            </a>
          </div>
          <div v-else>
            <a href="/#/verify/" @click="$emit('close')">Continue setup</a>
          </div>
        </div>
        <a
          class="text-base text-xsmall"
          href="/#/verify/"
          @click="$emit('close')"
          v-else
        >
          Start setup
        </a>
        <div
          v-tooltip="{
            content: isVerified
              ? 'You\'re a verified human on BrightID!'
              : 'Your BrightID profile still needs to be verified.',
            trigger: 'hover click',
          }"
          :class="
            isVerified
              ? 'ml-auto text-base text-xsmall brightid-verified'
              : 'ml-auto text-base text-xsmall unverified'
          "
        >
          {{ isVerified ? 'Verified' : 'Unverified' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import IconStatus from '@/components/IconStatus.vue'

@Component({
  components: { IconStatus },
})
export default class BrightIdWidget extends Vue {
  @Prop() abbrev!: string
  @Prop() balance!: string
  @Prop() isProjectCard!: boolean

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

.text-small {
  font-size: 14px;
  line-height: 16px;
  font-weight: 600;
}

.text-xsmall {
  font-size: 10px;
  line-height: 12px;
  font-weight: 600;
}

.row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
  a {
    margin: 0;
    line-height: 0;
  }
  .unverified {
    color: $clr-error;
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

.ml-auto {
  margin-left: auto;
}

.bright-id-widget-container {
  color: #16161a;
  background: var(--bg-bright-id-widget);
  border-radius: 20px;

  width: auto;
  height: auto;
}

.bright-id-profile-widget {
  padding: 1rem;
}

.progress {
  width: 100%;
  border-radius: 2rem;
  height: 0.5rem;
  background: $gradient-inactive;
  margin: 1rem 0rem;

  .quarter {
    width: 25%;
    background: $gradient-highlight;
    height: 0.5rem;
    border-radius: 2rem;
  }
  .half {
    width: 50%;
    background: $gradient-highlight;
    height: 0.5rem;
    border-radius: 2rem;
  }
  .three-quarters {
    width: 75%;
    background: $gradient-highlight;
    height: 0.5rem;
    border-radius: 2rem;
  }
  .full {
    width: 100%;
    background: $gradient-highlight;
    height: 0.5rem;
    border-radius: 2rem;
  }
}
</style>
