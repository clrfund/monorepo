<template>
  <div :class="`tab-container ${isOnCartOrRoundPage ? 'mobile-l' : 'mobile'}`">
    <links
      v-for="({ icon, title, to }, idx) of tabs"
      :key="idx"
      :class="{
        'tab-item': true,
        active: activeTab === to,
      }"
      :to="to"
    >
      <div class="icon">
        <img :src="require(`@/assets/${icon}`)" :alt="title" width="16px" />
        <transition name="pulse" mode="out-in">
          <div
            :key="cart.length"
            :class="[cart.length ? 'circle cart-indicator' : 'cart-indicator']"
            v-if="title === 'Cart' && isCartBadgeShown"
          >
            {{ cart.length }}
          </div>
        </transition>
      </div>
      <span class="tab-title">{{ title }}</span>
    </links>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { CartItem } from '@/api/contributions'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class MobileTabs extends Vue {
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

  private get cart(): CartItem[] {
    return this.$store.state.cart
  }

  get isCartEmpty(): boolean {
    return this.cart.length === 0
  }

  get activeTab(): string {
    return this.$route.path
  }

  get filteredCart(): CartItem[] {
    // Once reallocation phase ends, use committedCart for cart items
    if (this.$store.getters.hasReallocationPhaseEnded) {
      return this.$store.state.committedCart
    }

    // Hide cleared items
    return this.cart.filter((item) => !item.isCleared)
  }

  get isCartBadgeShown(): boolean {
    /**
     * Only show cart badge counter if there are new/changed items present
     * and the user is still able to contribute/reallocate these changes.
     */
    return (
      (this.$store.getters.canUserReallocate ||
        this.$store.getters.isRoundContributionPhase) &&
      !this.isCartEmpty
    )
  }

  get isOnCartOrRoundPage(): boolean {
    return (
      this.$route.name === 'cart' || this.$route.name === 'round-information'
    )
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
  background: var(--bg-light-color);
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
  color: var(--text-color);
}

.cart-indicator {
  border-radius: 2rem;
  background: $gradient-highlight;
  padding: 0.25rem;
  font-size: 10px;
  color: var(--text-color);
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
  background: var(--bg-secondary-color);
  box-shadow: inset 0px 2px 0px $border-light;
}

.circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.pulse-enter-active {
  animation: pulse-animation 2s 1 ease-out;
}

@keyframes pulse-animation {
  0% {
    box-shadow: 0 0 0 0px $idle-color;
  }

  100% {
    box-shadow: 0 0 0 4px $clr-pink;
  }
}
</style>
