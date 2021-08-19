<template>
  <div class="category-filter" v-click-outside="closeDropdown">
    <div class="filter-btn" @click="toggleDropdown">
      <span class="filter-text">
        Filter
        <span v-if="selectedCategories.length"
          >({{ selectedCategories.length }})</span
        >
      </span>
      <img
        src="@/assets/chevron-down.svg"
        alt="Down arrow"
        :class="{ 'filter-chevron-open': visible }"
      />
    </div>
    <div class="selector-wrapper" :class="{ show: visible }">
      <div
        v-for="(category, idx) of categories"
        :key="idx"
        :class="{
          'category-btn': true,
          'category-btn-selected': selectedCategories.includes(category),
        }"
        @click="handleFilterClick(category)"
      >
        {{ category }}
        <img
          v-if="selectedCategories.includes(category)"
          class="close"
          src="@/assets/close.svg"
        />
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
export default class FilterDropdown extends Vue {
  @Prop({ default: [] }) categories!: string[]
  @Prop({ default: [] }) selectedCategories!: string[]

  private visible = false

  toggleDropdown(): void {
    this.visible = !this.visible
  }

  closeDropdown(event): void {
    if (!event.target.matches('.close')) {
      this.visible = false
    }
  }

  handleFilterClick(selection: string): void {
    this.$emit('change', selection)
  }
}
</script>

<style scoped lang="scss">
@import '../styles/theme';
@import '../styles/vars';

.category-filter {
  width: 140px;
  grid-area: filter;
  position: relative;

  .filter-btn {
    background: none;
    cursor: pointer;
    border: 1px solid $border-color;
    border-radius: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0.75rem;
    transition: transform 0.1s;
    &:hover {
      opacity: 0.8;
      transform: scale(1.01);
    }
    .filter-chevron-open {
      transform: rotate(180deg);
    }
    @media (max-width: $breakpoint-m) {
      width: auto;
    }
  }

  .selector-wrapper {
    display: none;
    position: absolute;
    top: 110%;
    right: 0;
    grid-template-columns: repeat(1, 4fr);
    border: 1px solid $border-color;
    border-radius: 0.75rem;
    overflow: hidden;
    justify-content: space-between;
    width: 100%;
    z-index: 99;
    .category-btn {
      display: grid;
      place-items: left;
      cursor: pointer;
      padding: 0.5rem;
      background: $bg-primary-color;
      text-transform: capitalize;
      line-height: 24px;
      &:hover {
        background: $bg-secondary-color;
      }
    }
    .category-btn-selected {
      background: $clr-pink;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      line-height: 0;
      margin: 0;
      justify-content: space-between;
      line-height: 24px;

      &:hover {
        background: $clr-pink;
      }
    }
    @media (max-width: $breakpoint-s) {
      .category-btn {
        border: none;
        &:nth-child(1) {
          border-right: 1px solid $border-color;
          border-bottom: 1px solid $border-color;
        }
        &:nth-child(2) {
          border-bottom: 1px solid $border-color;
        }
        &:nth-child(3) {
          border-right: 1px solid $border-color;
        }
      }
    }
  }
  .show {
    display: grid;
  }
}
</style>
