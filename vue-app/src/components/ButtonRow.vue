<template>
  <div class="btn-row">
    <router-link
      v-if="currentStep > 0"
      :to="{
        name: 'joinStep',
        params: {
          step: steps[currentStep - 1]
        }
      }"
      class="btn-secondary"
    >
      Previous
    </router-link>
    <div v-else></div>

    <!-- TODO button to trigger tx  -->
    <router-link
      v-if="currentStep === 4"
      :to="{
        name: 'joinStep',
        params: {
          step: steps[currentStep + 1]
        }
      }"
      :class="{
        disabled: !isStepValid,
        'btn-primary': true,
      }"
      :disabled="!isStepValid"
    >
      Summary
    </router-link>
    <button
      v-else-if="currentStep === 5"
      to="/project-added"
      class="btn-primary"
    >
      Finish
    </button>
    <button
      v-else-if="currentStep < 5"
      @click="handleNav"
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

  handleNav(): void {
    this.$router.push({
      name: 'joinStep',
      params: {
        step: this.steps[this.currentStep + 1],
      },
    })
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
  background: #FFF7;

  &:hover {
    opacity: 0.5;
    transform: scale(1);
    cursor: not-allowed;
  }  
}
</style>
