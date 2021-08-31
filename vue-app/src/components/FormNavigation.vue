<template>
  <!-- TODO: refactor this to something more generalized -->
  <div>
    <div class="btn-row" v-if="isJoin">
      <button
        v-if="currentStep > 0"
        @click="handleStepNav(currentStep - 1)"
        class="btn-secondary float-left"
        :disabled="isNavDisabled"
      >
        Previous
      </button>
      <button
        v-if="currentStep < steps.length - 1"
        @click="handleNext"
        class="btn-primary float-right"
        :disabled="!isStepValid"
      >
        {{ currentStep === steps.length - 2 ? 'Finish' : 'Next' }}
      </button>
    </div>
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
  @Prop() isJoin!: boolean
  @Prop() isNavDisabled!: boolean

  // TODO is this needed? Why do we pass `callback` & `handleStepNav`?
  handleNext(): void {
    // Save form data (first saves when user hits Next after first step)
    this.callback(true) // "true" checks to update furthest step
    // Navigate forward
    this.$router.push({
      name: 'join-step',
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
  display: block;
  height: 2.75rem;
}

.float-left {
  float: left;
}

.float-right {
  float: right;
}
</style>
