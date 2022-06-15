<template>
  <div class="dropdown" v-click-outside="closeDropdown">
    <div class="button" @click="toggleDropdown">
      <span class="button-label">
        {{ selected || options[0] }}
      </span>
      <img
        src="@/assets/chevron-down.svg"
        alt="Down arrow"
        :class="{ 'open-menu': visible }"
      />
    </div>
    <div class="menu" :class="{ show: visible }">
      <div
        v-for="(option, idx) of options"
        :key="idx"
        :class="{
          option: true,
        }"
        @click="handleClick(option)"
      >
        {{ option }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import ClickOutside from '@/directives/ClickOutside'

@Component({
  directives: {
    ClickOutside,
  },
})
export default class Dropdown extends Vue {
  @Prop({ default: [] }) options!: string[]
  @Prop({ default: '' }) selected!: string

  private visible = false

  toggleDropdown(): void {
    this.visible = !this.visible
  }

  closeDropdown(): void {
    this.visible = false
  }

  handleClick(selection: string): void {
    this.visible = false
    this.$emit('change', selection)
  }
}
</script>

<style scoped lang="scss">
@import '../styles/theme';
@import '../styles/vars';

.dropdown {
  position: relative;

  .button {
    background: none;
    cursor: pointer;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.2rem;
    padding: 0.5rem 0.75rem;
    transition: transform 0.1s;
    &:hover {
      opacity: 0.8;
      transform: scale(1.01);
    }
    .open-menu {
      transform: rotate(180deg);
    }
    .button-label {
      overflow: hidden;
      text-overflow: clip;
      white-space: nowrap;
    }
    @media (max-width: $breakpoint-m) {
      width: auto;
    }
  }

  .menu {
    display: none;
    position: absolute;
    top: 110%;
    right: 0;
    grid-template-columns: repeat(1, 4fr);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    overflow: hidden;
    justify-content: space-between;
    width: 100%;
    z-index: 99;
    .option {
      display: grid;
      place-items: left;
      cursor: pointer;
      padding: 0.5rem;
      line-height: 24px;
      background: var(--bg-primary-color);
      &:hover {
        background: var(--bg-light-accent);
      }
    }
  }
  .show {
    display: grid;
  }
}
</style>
