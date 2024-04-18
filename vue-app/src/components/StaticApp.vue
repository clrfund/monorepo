<template>
  <div
    id="content"
    class="mr-cart-closed"
    :class="{
      padded: isSidebarShown,
    }"
  >
    <breadcrumbs v-if="showBreadCrumb" />
    <router-view :key="route.path" />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores'

interface Props {
  showBreadCrumb: boolean
  isSidebarShown: boolean
}
defineProps<Props>()

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { currentRound } = storeToRefs(appStore)

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
</script>
