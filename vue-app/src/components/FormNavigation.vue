<template>
  <!-- TODO: refactor this to something more generalized -->
  <div>
    <div class="btn-row" v-if="isJoin">
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
      <button
        v-if="currentStep < 6"
        @click="handleNext"
        class="btn-primary"
        :disabled="!isStepValid"
      >
        {{ currentStep === 5 ? 'Finish' : 'Next' }}
      </button>
    </div>
    <div class="btn-row" v-if="!isJoin">
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
      <links v-if="currentStep === 3" to="/verify/success" class="btn-primary">
        Finish
      </links>
      <button
        v-else-if="currentStep < 3"
        @click="handleStepNav(currentStep + 1)"
        class="btn-primary"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (max-width: $breakpoint-m) {
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
