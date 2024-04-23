<template>
  <div
    v-if="currentUser"
    :class="{
      container: showCartPanel,
      'collapsed-container': !showCartPanel,
    }"
  >
    <div v-if="!showCartPanel" class="toggle-btn desktop" @click="toggleCart">
      <img alt="open" width="16" src="@/assets/chevron-left.svg" />
      <transition name="pulse" mode="out-in">
        <div
          v-if="!showCartPanel && isCartBadgeShown"
          :key="cart.length"
          :class="[cart.length ? 'circle cart-indicator' : 'cart-indicator']"
        >
          {{ cart.length }}
        </div>
      </transition>
      <img alt="cart" width="16" src="@/assets/cart.svg" />
    </div>
    <cart v-if="showCartPanel" class="cart-component" />
    <div v-if="!showCartPanel" class="collapsed-cart desktop" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Cart from '@/components/Cart.vue'
import { useModal } from 'vue-final-modal'
import SignatureModal from '@/components/SignatureModal.vue'

import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { cart, showCartPanel, isRoundContributionPhase, canUserReallocate } = storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const isCartBadgeShown = computed(() => {
  /**
   * Only show cart badge counter if there are new/changed items present
   * and the user is still able to contribute/reallocate these changes.
   */
  return (canUserReallocate.value || isRoundContributionPhase.value) && !!cart.value.length
})

async function promptSignature() {
  const { open, close } = useModal({
    component: SignatureModal,
    attrs: {
      onClose() {
        close().then(() => {
          appStore.toggleShowCartPanel()
        })
      },
    },
  })
  open()
}

function toggleCart(): void {
  if (!currentUser.value) {
    // should not get here as the widget is only shown if user is connected with their wallet
    return
  }

  if (currentUser.value.encryptionKey) {
    appStore.toggleShowCartPanel()
  } else {
    promptSignature()
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
  position: relative;
  height: 100%;
  box-sizing: border-box;
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

.circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
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

.collapsed-container {
  height: 100%;
}

.cart {
  position: relative;
}

.collapsed-cart {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: $cart-width-closed;
  background: var(--bg-secondary-color);
  z-index: 0;
}

.toggle-btn {
  box-sizing: border-box;
  position: absolute;
  top: 1.875rem;
  right: 0;
  width: fit-content;
  z-index: 1;
  border-radius: 0.5rem 0 0 0.5rem;
  display: flex;
  justify-content: flex-end;
  font-size: 16px;
  align-items: center;
  cursor: pointer;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  color: var(--text-color);
  background: var(--bg-cart);
  border: 1px solid rgba($border-light, 0.3);
  border-right: none;
  &:hover {
    background: var(--bg-secondary-color);
    gap: 0.75rem;
  }

  img {
    filter: var(--img-filter, invert(0.7));
  }
}

.provider-error {
  text-align: center;
}
</style>
