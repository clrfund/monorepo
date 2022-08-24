<template>
  <div class="text-error warning">
    <img class="icon" src="@/assets/warning.svg" alt="Warning icon" />
    {{ message }}
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component
export default class Warning extends Vue {
  @Prop() message!: string
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.warning {
  background: transparent;
  color: $clr-error;
  border: 1px solid $clr-error;
  border-radius: 1.25rem;
  padding: 2rem 2.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  @media (max-width: $breakpoint-m) {
    flex-direction: column;
    padding-bottom: 1rem;
  }
}

.icon {
  width: 24px;
  height: 24px;
}
</style>
