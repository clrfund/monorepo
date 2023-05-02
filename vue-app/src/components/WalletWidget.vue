<template>
  <div :class="{ container: !isActionButton }">
    <button
      v-if="!currentUser"
      :class="{
        'btn-action': isActionButton,
        'app-btn': !isActionButton,
        'full-width-mobile': fullWidthMobile,
      }"
      @click="showModal()"
    >
      {{ $t('walletWidget.button1') }}
    </button>
    <div v-else-if="currentUser && !isActionButton" class="profile-info" @click="toggleProfile">
      <div class="profile-info-balance">
        <img v-if="showEth" :src="chainCurrencyLogoUrl" />
        <img v-else :src="tokenLogoUrl" />
        <div v-if="showEth" class="balance">{{ etherBalance }}</div>
        <div v-else class="balance">{{ balance }}</div>
      </div>
      <div class="profile-name">
        {{ displayAddress }}
      </div>
      <div class="profile-image">
        <img v-if="profileImageUrl" :src="profileImageUrl" />
      </div>
    </div>
    <profile v-if="showProfilePanel" :balance="balance" :ether-balance="etherBalance" @close="toggleProfile" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { BigNumber } from 'ethers'
import { formatAmount } from '@/utils/amounts'
import Profile from '@/views/Profile.vue'
import WalletModal from '@/components/WalletModal.vue'
import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { useModal } from 'vue-final-modal'

interface Props {
  // Boolean to only show Connect button, styled like an action button,
  // which hides the widget that would otherwise display after connecting
  showEth?: boolean
  isActionButton?: boolean
  // Boolean to allow connect button to be full width
  fullWidthMobile?: boolean
}

withDefaults(defineProps<Props>(), {
  showEth: false,
  isActionButton: false,
  fullWidthMobile: false,
})

const appStore = useAppStore()
const { tokenLogoUrl, chainCurrencyLogoUrl, nativeTokenDecimals } = storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const { open: showModal, close } = useModal({
  component: WalletModal,
  attrs: {
    onClose() {
      close()
    },
  },
})

const showProfilePanel = ref<boolean | null>(null)
const profileImageUrl = ref<string | null>(null)

const etherBalance = computed(() => {
  const etherBalance = currentUser.value?.etherBalance
  if (etherBalance === null || typeof etherBalance === 'undefined') {
    return '0'
  }
  return formatAmount(etherBalance, 'ether', 4)
})

const balance = computed(() => {
  const balance: BigNumber | null | undefined = currentUser.value?.balance
  if (balance === null || typeof balance === 'undefined') return '0'
  return formatAmount(balance, nativeTokenDecimals.value, 4)
})

const displayAddress = computed<string | null>(() => {
  if (!currentUser.value) return null
  return currentUser.value.ensName ?? currentUser.value.walletAddress
})

onMounted(() => {
  showProfilePanel.value = false
})

function toggleProfile(): void {
  showProfilePanel.value = !showProfilePanel.value
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
  margin-left: 0.5rem;
  width: fit-content;
}

.profile-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  cursor: pointer;
  background: var(--bg-gradient);
  border-radius: 32px;
  padding-right: 0.5rem;
  width: fit-content;

  .profile-name {
    font-size: 14px;
    opacity: 0.8;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: min(20vw, 14ch);
    color: var(--text-color);
    @media (max-width: $breakpoint-s) {
      display: none;
    }
  }

  .balance {
    font-size: 14px;
    font-weight: 600;
    font-family: 'Glacial Indifference', sans-serif;
  }

  .profile-image {
    border-radius: 50%;
    box-sizing: border-box;
    height: $profile-image-size;
    /* margin-left: 20px; */
    overflow: hidden;
    width: $profile-image-size;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    img {
      height: 100%;
      width: 100%;
    }
    &:hover {
      opacity: 0.8;
      transform: scale(1.01);
      cursor: pointer;
    }
  }

  .profile-info-balance {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    cursor: pointer;
    background: var(--bg-primary-color);
    padding: 0.5rem 0.5rem;
    border-radius: 32px;
    margin: 0.25rem;
    margin-right: 0;
    color: var(--text-color);
  }

  .profile-info-balance img {
    height: 16px;
    width: 16px;
  }
}

.full-width-mobile {
  @media (max-width: $breakpoint-m) {
    width: 100%;
  }
}
</style>
