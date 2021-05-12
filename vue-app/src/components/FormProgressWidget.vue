<template>
  <div class="progress-area">
    <div class="desktop progress-container">
      <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length" />
      <p class="subtitle">
        Step {{currentStep + 1}} of {{steps.length}}
      </p>
      <div class="progress-steps">
        <div
          v-for="(name, step) in stepNames"
          :key="step"
          class="progress-step"
          :class="{
            'zoom-link': step <= furthestStep && step !== currentStep && !isNavDisabled,
            disabled: isNavDisabled
          }"
          @click="handleStepNav(step)"
        >
          <template v-if="step === currentStep">
            <img src="@/assets/current-step.svg" alt="current step" />
            <p v-text="name" class="active step" />
          </template>
          <template v-else-if="step === furthestStep">
            <img src="@/assets/furthest-step.svg" alt="current step" />
            <p v-text="name" class="active step" />
          </template>
          <template v-else-if="isStepUnlocked(step) && isStepValid(step)">
            <img src="@/assets/green-tick.svg" alt="step complete" />
            <p v-text="name" class="step" />
          </template>
          <template v-else>
            <img src="@/assets/step-remaining.svg" alt="step remaining" />
            <p v-text="name" class="step" />
          </template>
        </div>
      </div>
      <form-navigation
        :isStepValid="isStepValid(currentStep)"
        :steps="steps"
        :currentStep="currentStep"
        :callback="saveFormData"
        :handleStepNav="handleStepNav"
        :isNavDisabled="isNavDisabled"
        class="desktop"
      />
  </div>
  <div class="mobile">
    <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length" />
    <div class="row">
      <p>Step {{currentStep + 1}} of {{steps.length}}</p>
      <router-link class="cancel-link" to="/join">
        Cancel
      </router-link>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import ProgressBar from '@/components/ProgressBar.vue'
import FormNavigation from '@/components/FormNavigation.vue'

// TODO make `furthestStep` logic optional (not used in BrightID flow)
@Component({
  components: {
    FormNavigation,
    ProgressBar,
  },
})
export default class FormProgressWidget extends Vue {
  @Prop() currentStep!: number
  @Prop() furthestStep!: number
  @Prop() steps!: string[]
  @Prop() stepNames!: string[]
  @Prop() isNavDisabled!: boolean
  @Prop() isStepUnlocked!: (step: number) => boolean
  @Prop() isStepValid!: (step: number) => boolean
  @Prop() handleStepNav!: () => void
  @Prop() saveFormData!: (updateFurthest?: boolean) => void
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.progress-area {
  grid-area: progress;
  position: relative;

  .progress-container {
    position: sticky;
    top: 5rem;
    align-self: start;
    padding: 1.5rem 1rem; 
    background: $bg-primary-color; 
    border-radius: 16px; 
    box-shadow: $box-shadow;

    .progress-steps {
      margin-bottom: 1rem;
    }

    .progress-step {
      display: flex;

      img {
        margin-right: 1rem;
      }
      p {
        margin: 0.5rem 0;
      }
      .step {
        color: #FFF9
      }
      .active {
        color: white;
        font-weight: 600;
        font-size: 1rem;
      }
    }

    .zoom-link {
      cursor: pointer;
      &:hover {
        transform: scale(1.02);
      }
    }

    .subtitle {
      font-weight: 500;
      opacity: 0.8;
    }
  }
}


.progress-area  
  .mobile {
    margin: 2rem 1rem;
    margin-bottom: 0;

    .row {
      margin-top: 1.5rem;

      p {
        margin: 0;
        font-weight: 500;
      }

      .cancel-link {
        font-weight: 500;
      }
    }
}

.cancel-link {
  position: sticky;
  top: 0px;
  color: $error-color;
  text-decoration: underline;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
