<template>
  <div :class="`tooltip ${position}`">
    <slot></slot>
    <span class="tooltip-text">
      <div>{{ content }}</div>
      <a v-if="link" :href="`${link}`">{{ linkText }}</a>
    </span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component
export class Tooltip extends Vue {
  @Prop() position!: string
  @Prop() content!: string
}

export default {
  props: {
    position: String,
    content: String,
    link: String,
    linkText: String,
  },
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.tooltip {
  position: relative;
  display: inline-block;
}
.tooltip .tooltip-text {
  visibility: hidden;
  max-width: 320px;
  width: max-content;
  overflow-wrap: break-word;
  background-color: $bg-primary-color;
  box-shadow: $box-shadow;
  border: 1px solid $button-color;
  color: #fff;
  border-radius: 8px;
  padding: 0.5rem;
  position: absolute;
  font-family: Inter;
  line-height: 150%;
  font-size: 14px;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.3s;
}
/* Tooltip top content */
.top .tooltip-text {
  bottom: 100%;
  left: 50%;
  margin-left: -60px; /* 120/2 = 60 */
}
/* Tooltip right content */
.right .tooltip-text {
  top: -5px;
  left: 110%;
}
/* Tooltip bottom content */
.bottom .tooltip-text {
  top: 100%;
  left: 50%;
  margin-left: -60px; /* 120/2 = 60 */
}
/* Tooltip left content */
.left .tooltip-text {
  top: -5px;
  right: 110%;
}

.tooltip:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}
</style>
