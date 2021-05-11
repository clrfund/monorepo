<template>
  <div class="btn-row">
    <button
      v-if="currentStep > 0"
      @click="handleStepNav(currentStep - 1)"
      class="btn-secondary"
      :class="{
        disabled: isNavDisabled,
      }"
    >
      Previous
    </button>
    <div v-else></div>

    <button
      v-if="currentStep < steps.length - 1"
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
export default class FormNavigation extends Vue {
  @Prop() currentStep!: number
  @Prop() steps!: string[]
  @Prop() isStepValid!: boolean
  @Prop() callback!: (updateFurthest?: boolean) => void
  @Prop() handleStepNav!: () => void
  @Prop() isNavDisabled!: boolean

  // TODO is this needed? Why do we pass `callback` & `handleStepNav`?
  handleNext(): void {
    // Save form data (first saves when user hits Next after first step)
    this.callback(true) // "true" checks to update furthest step
    // Navigate forward
    this.$router.push({
      name: 'joinStep',
      params: {
        step: this.steps[this.currentStep + 1],
      },
    })
  }

  handlePrev(): void {
    this.callback()
  }
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
