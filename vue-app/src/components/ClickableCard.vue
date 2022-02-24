<template>
  <div class="card-container" @click="handleClick">
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component
export default class ClickableCard extends Vue {
  @Prop() id!: string

  handleClick(): void {
    this.$emit('click', this.id)
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.card-container {
  background-color: $bg-secondary-color;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  z-index: 0;
  &:hover {
    transform: scale(1.01);
    box-shadow: 0px 4px 4px 0px 0, 0, 0, 0.25;
  }
}
</style>
