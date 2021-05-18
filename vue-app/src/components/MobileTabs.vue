<template>
  <div class="tab-container mobile">
    <div
      v-for="({ icon, title, id }) of tabs"
      :key="id"
      :class="{
        'tab-item': true,
        active: activeTab === id,
      }"
      @click="() => clickHandler(id)">
      <img
        :alt="title"
        width="16px"
        :src="icon"
      > 
      {{ id }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default class MobileTabs extends Vue {
  tabs = [
    {
      icon: 'src/assets/timer.svg',
      title: 'Round',
      id: 'round',
    },
    {
      icon: '@/assets/projects.svg',
      title: 'Projects',
      id: 'projects',
    },
    {
      icon: '@/assets/cart.svg',
      title: 'Cart',
      id: 'cart',
    },
  ]

  activeTab = 'projects'
  
  get active() {
    return this.activeTab
  }

  isTabActive(id: string): boolean {
    return this.activeTab === id
  }

  clickHandler(id) {
    this.activeTab = id
    console.log(this.activeTab)
  }
}

</script>

<style lang="scss" scoped>
.tab-container {
  position: sticky;
  bottom: 0;
  width: 100%;
  height: 4rem;
  background: #2C2938;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;
}

.tab-item {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.active {
  background: #211E2B;
  box-shadow: inset 0px 2px 0px #7375A6;
}
</style>