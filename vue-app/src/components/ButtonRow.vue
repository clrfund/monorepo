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

    <!-- TODO button to trigger tx  -->
    <router-link
      v-if="currentStep === 4"
      :to="{
        name: 'joinStep',
        params: {
          step: steps[currentStep + 1]
        }
      }"
      class="btn-primary"
    >
      Summary
    </router-link>
    <router-link
      v-else-if="currentStep === 5"
      to="/project-added"
      class="btn-primary"
    >
      Finish
    </router-link>
    <router-link
      v-else-if="currentStep < 5"
      :to="{
        name: 'joinStep',
        params: {
          step: steps[currentStep + 1]
        }
      }"
      class="btn-primary"
    >
      Next
    </router-link>
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
  @Prop() isStepValid: boolean
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
  /* color: currentColor; */
  cursor: not-allowed;
  opacity: 0.5;
  /* text-decoration: none; */
}

</style>
