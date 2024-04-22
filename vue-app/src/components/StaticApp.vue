<template>
  <div id="content" class="app-margin">
    <breadcrumbs v-if="showBreadCrumb" />
    <router-view :key="route.path" />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, useWalletStore, useUserStore, type WalletUser } from '@/stores'
import type { BrowserProvider } from 'ethers'

interface Props {
  showBreadCrumb: boolean
  isSidebarShown: boolean
}
defineProps<Props>()

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { currentRound } = storeToRefs(appStore)

const userStore = useUserStore()
const wallet = useWalletStore()
const { user: walletUser } = storeToRefs(wallet)

onMounted(async () => {
  await appStore.loadStaticClrFundInfo()
  appStore.isAppReady = true

  if (currentRound.value) {
    router.push({
      name: 'leaderboard',
      params: {
        network: currentRound.value.network,
        address: currentRound.value.fundingRoundAddress,
      },
    })
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
      await appStore.loadStaticClrFundInfo()
      userStore.loginUser(user)
      await userStore.loadUserInfo()
    } else {
      await userStore.logoutUser()
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.log('error', err)
  }
})
</script>

<style lang="scss">
@import '../styles/vars';
@import '../styles/fonts';
@import '../styles/theme';

.app-margin {
  margin-right: 1.5rem;
  @media (max-width: $breakpoint-m) {
    margin-right: 0;
  }
}
</style>
