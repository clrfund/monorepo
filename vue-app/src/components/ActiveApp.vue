<template>
  <div
    id="content"
    :class="{
      padded: isVerifyStep || (isSidebarShown && !isCartPadding),
      'mr-cart-open': showCartPanel && isSideCartShown,
      'mr-cart-closed': !showCartPanel && isSideCartShown,
    }"
  >
    <breadcrumbs v-if="showBreadCrumb" />
    <router-view :key="route.path" />
  </div>
  <div v-if="isSideCartShown" id="cart" :class="`desktop ${showCartPanel ? 'open-cart' : 'closed-cart'}`">
    <cart-widget />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { getCurrentRound } from '@/api/round'
import type { WalletUser } from '@/stores'
import { useAppStore, useRecipientStore, useUserStore } from '@/stores'
import type { BrowserProvider } from 'ethers'
import { useWalletStore } from '@/stores'
import CartWidget from '@/components/CartWidget.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'

interface Props {
  showBreadCrumb: boolean
  isSidebarShown: boolean
}
defineProps<Props>()

const route = useRoute()
const wallet = useWalletStore()
const { user: walletUser } = storeToRefs(wallet)

const appReady = ref(false)
const appStore = useAppStore()
const recipientStore = useRecipientStore()
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)
const { currentRound, showCartPanel } = storeToRefs(appStore)
const routeName = computed(() => route.name?.toString() || '')

const intervals: { [key: string]: any } = {}
const isUserAndRoundLoaded = computed(() => !!currentUser.value && !!currentRound.value)
const isSideCartShown = computed(() => isUserAndRoundLoaded.value && isSidebarShown.value && routeName.value !== 'cart')
const isVerifyStep = computed(() => routeName.value === 'verify-step')
const isCartPadding = computed(() => {
  const routes = ['cart']
  return routes.includes(routeName.value)
})

function setupLoadIntervals() {
  intervals.round = setInterval(() => {
    appStore.loadRoundInfo()
  }, 60 * 1000)
  intervals.recipient = setInterval(async () => {
    recipientStore.loadRecipientRegistryInfo()
  }, 60 * 1000)
  intervals.user = setInterval(() => {
    userStore.loadUserInfo()
  }, 60 * 1000)
}

onMounted(async () => {
  try {
    await wallet.reconnect()
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.warn('Unable to reconnect wallet', err)
  }

  try {
    const roundAddress = appStore.currentRoundAddress || (await getCurrentRound())

    if (roundAddress) {
      appStore.selectRound(roundAddress)
      /* eslint-disable-next-line no-console */
      console.log('roundAddress', roundAddress)
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.warn('Failed to get current round:', err)
  }

  appReady.value = true
  try {
    await appStore.loadClrFundInfo()
    await appStore.loadMACIFactoryInfo()
    await appStore.loadRoundInfo()
    await recipientStore.loadRecipientRegistryInfo()
    appStore.isAppReady = true

    setupLoadIntervals()
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.warn('Failed to load application data:', err)
  }
})

onBeforeUnmount(() => {
  for (const interval of Object.keys(intervals)) {
    clearInterval(intervals[interval])
  }
})

watch(walletUser, async () => {
  try {
    if (walletUser.value) {
      const user: WalletUser = {
        chainId: walletUser.value.chainId,
        walletAddress: walletUser.value.walletAddress,
        web3Provider: walletUser.value.web3Provider as BrowserProvider,
      }
      // make sure factory is loaded
      await appStore.loadClrFundInfo()
      userStore.loginUser(user)
      await userStore.loadUserInfo()
      await userStore.loadBrightID()
    } else {
      await userStore.logoutUser()
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.log('error', err)
  }
})

watch(isUserAndRoundLoaded, async () => {
  if (!isUserAndRoundLoaded.value) {
    return
  }

  // load contribution when we get round information
  await userStore.loadUserInfo()
})
</script>
