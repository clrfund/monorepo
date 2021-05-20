<template>
  <div class="tab-container mobile">
    <router-link
      v-for="({ icon, title, to }, idx) of tabs"
      :key="idx"
      :class="{
        'tab-item': true,
        active: activeTab === to,
      }"
      :to="to"
    >
    <div class="icon">
      <img
        :src="require(`@/assets/${icon}`)"
        :alt="title"
        width="16px"
      > 
      <div 
        class="cart-indicator"
        v-if="title === 'Cart' && !isCartEmpty" 
      >
        {{ cartItemTotal }}
      </div>
    </div>
      <span class="tab-title">{{ title }}</span>
    </router-link>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default class MobileTabs extends Vue {
  cartItemTotal = 8 // TODO: Replace with state data
  tabs = [
    {
      icon: 'timer.svg',
      title: 'Round',
      to: '/round-information',
    },
    {
      icon: 'projects.svg',
      title: 'Projects',
      to: '/projects',
    },
    {
      icon: 'cart.svg',
      title: 'Cart',
      to: '/cart',
    },
  ]

  get isCartEmpty(): boolean {
    return this.cartItemTotal === 0
  }

  get activeTab(): string {
    return this.$route.path
  }
}

</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.tab-container {
  position: fixed;
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
  padding-top: 0.25rem;
}

.tab-title {
  margin: 0.25rem;
  line-height: 0;
  margin-top: -0.75rem;
  font-size: 14px;
  text-transform: uppercase;
  color: #fff;
}

.cart-indicator {
  border-radius: 2rem;
  background: $clr-pink-light-gradient;
  padding: 0.25rem;
  font-size: 10px;
  color: #fff;
  line-height: 100%;
  width: 8px;
  height: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon {
  display: flex;
  gap: 0.25rem;
}

.active {
  background: #211E2B;
  box-shadow: inset 0px 2px 0px #7375A6;
}
</style>