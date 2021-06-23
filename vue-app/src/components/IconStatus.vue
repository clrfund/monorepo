<template>
  <div class="icon-container">
    <img :src="require(`@/assets/${logo}`)" class="logo" />
    <div class="background">
      <div v-if="happy" class="status-happy">
        <img
          :src="require(`@/assets/${secondaryLogo}`)"
          class="secondary-icon"
        />
      </div>
      <div v-if="sad" class="status-sad">
        <img
          :src="require(`@/assets/${secondaryLogo}`)"
          class="secondary-icon"
        />
      </div>
      <div v-if="custom" class="status-custom" :style="cssVars">
        <img
          :src="require(`@/assets/${secondaryLogo}`)"
          class="secondary-icon"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

// TODO clean up this component
// Component to overlay status badge on icons, e.g. https://share.getcloudapp.com/GGuWoxx0
@Component
export default class IconStatus extends Vue {
  @Prop() happy!: boolean
  @Prop() sad!: boolean
  @Prop() custom!: boolean
  @Prop() logo!: string
  @Prop() secondaryLogo!: string
  @Prop({ default: 'transparent' }) bg!: string

  get cssVars() {
    return { background: this.bg }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.icon-container {
  width: 2rem;
  height: 2rem;
  /* background: $bg-light-color; */
  border-radius: 0.25rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo {
  width: 1.25rem;
  height: 1.25rem;
  position: fixed;
}

.secondary-icon {
  width: 0.5rem;
  height: 0.5rem;
}

.status-happy {
  background: $clr-green;
  padding: 0.125rem;
  border-radius: 2rem;
  height: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-sad {
  background: $warning-color;
  padding: 0.125rem;
  border-radius: 2rem;
  height: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-custom {
  background: var(--bg);
  border-radius: 2rem;
  padding: 0.125rem;
  height: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.background {
  position: relative;
  top: -0.5rem;
  right: -0.5rem;
  background: $bg-secondary-color;
  padding: 2px;
  border-radius: 2rem;
}
</style>
