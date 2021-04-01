<template>
  <div class="progress-bar">
    <div v-for="idx in totalSteps" v-bind:key="idx">
      <div class="step" :class="{'inactive': isFutureStep(idx)}"/>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component
export default class Transaction extends Vue {
  @Prop()
  currentStep!: number

  @Prop()
  totalSteps!: number

  // TODO best way to pass props to CSS?
  isFutureStep (step) {
    return step > this.currentStep
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.progress-bar {
  color: $error-color;
  margin: 32px 0;
  display: flex;
  justify-content: space-between;
}

.step {
  background-color: pink;
  height: 8px;
  width: 48px;

}
.inactive {
  background-color: purple;
}

</style>
