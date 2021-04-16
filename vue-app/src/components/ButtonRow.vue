<template>
  <div class="btn-row">
    <button
      v-if="currentStep > 0"
      @click="handlePrev"
      class="btn-secondary"
    >
      Previous
    </button>
    <div v-else></div>

    <!-- TODO: Finish button to trigger tx  -->
    <button
      v-if="currentStep === 5"
      @click="handleSubmit"
      to="/project-added"
      class="btn-primary"
    >
      Finish
    </button>
    <button
      v-else-if="currentStep === 4"
      @click="handleNext"
      :class="{
        disabled: !isStepValid,
        'btn-primary': true,
      }"
      :disabled="!isStepValid"
    >
      Summary
    </button>
    <button
      v-else-if="currentStep < 5"
      @click="handleNext"
      :class="{
        disabled: !isStepValid,
        'btn-primary': true,
      }"
      :disabled="!isStepValid"
    >
      Next
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component
export default class ButtonRow extends Vue {
  @Prop() currentStep!: number
  @Prop() steps!: string[]
  @Prop() isStepValid?: boolean

  handleNext(): void {
    this.$router.push({
      name: 'joinStep',
      params: {
        step: this.steps[this.currentStep + 1],
      },
    })
  }
  handlePrev(): void {
    this.$router.push({
      name: 'joinStep',
      params: {
        step: this.steps[this.currentStep - 1],
      },
    })
  }
  handleSubmit(): void {
    alert('submitted')
    // Submit form data
    // Clear form store/state data
  }
  // Pushing to router stack destroys local form state
  // Place form data in $store?
}
</script>

<style scoped lang="scss">
@import '../styles/theme';
@import '../styles/vars';

.btn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media(max-width: $breakpoint-m) {
    bottom: 0;
  }
}

.disabled {
  cursor: not-allowed;
  opacity: 0.5;

  &:hover {
    opacity: 0.5;
    transform: scale(1);
    cursor: not-allowed;
  }  
}
</style>
