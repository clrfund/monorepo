<template>
  <div class="explorer-btn tx-receipt">
    <div class="status-label-address">
      <loader v-if="isPending" v-tooltip="$t('transactionReceipt.tooltip1')" class="pending" />
      <img
        v-if="!isPending"
        v-tooltip="$t('transactionReceipt.tooltip2')"
        class="success"
        src="@/assets/checkmark.svg"
      />
      <p class="hash">{{ renderCopiedOrHash }}</p>
    </div>
    <div class="actions">
      <links
        v-tooltip="
          $t('transactionReceipt.tooltip3', {
            blockExplorer: blockExplorer.label,
          })
        "
        class="explorerLink"
        :to="blockExplorer.url"
        :hide-arrow="true"
      >
        <img class="icon" :src="blockExplorer.logoUrl" />
      </links>
      <copy-button :value="hash" :text="$t('transactionReceipt.button1')" my-class="icon" @copied="updateIsCopied" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import Loader from '@/components/Loader.vue'
import CopyButton from '@/components/CopyButton.vue'
import Links from '@/components/Links.vue'
import { getBlockExplorer } from '@/utils/explorer'
import { isTransactionMined } from '@/utils/contracts'
import { renderAddressOrHash } from '@/utils/accounts'

interface Props {
  hash: string
}

const props = defineProps<Props>()

const isPending = ref(true)
const isCopied = ref(false)

const renderCopiedOrHash = computed<string>(() => {
  return isCopied.value ? 'Copied!' : renderAddressOrHash(props.hash, 16)
})

function updateIsCopied(value: boolean): void {
  isCopied.value = value
}

const blockExplorer = computed(() => {
  return getBlockExplorer(props.hash)
})

onMounted(() => {
  checkTxStatus()
})

async function checkTxStatus(): Promise<void> {
  while (isPending.value) {
    await new Promise(resolve => setTimeout(resolve, 5000))
    const isMined = await isTransactionMined(props.hash)
    isPending.value = !isMined
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.tx-receipt {
  display: flex;
  justify-content: space-between;
}

.icon {
  width: 1rem;
  height: 1rem;
  padding: 0.25rem;
  cursor: pointer;
  &:hover {
    background: var(--brand-secondary);
    border-radius: 16px;
  }
}

.hash {
  color: var(--text-body);
  margin: 0;
  font-size: 14px;
  text-transform: uppercase;
  font-weight: 500;
}

.success {
  width: 0.75rem;
  height: 0.75rem;
  padding: 0.25rem;
  margin-right: 0.25rem;
  background: $gradient-highlight;
  border-radius: 2rem;
  filter: var(--img-filter, invert(1));
}

.actions {
  display: flex;
  gap: 0.25rem;
  height: 1.5rem;
}

.explorerLink {
  padding: 0;
  margin: 0;
}
.status-label-address {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.pending {
  margin: 0.25rem;
  padding: 0;
  width: 1rem;
  height: 1rem;
}

.pending:after {
  width: 0.75rem;
  height: 0.75rem;
  margin: 0;
  border-radius: 50%;
  border: 2px solid $clr-pink;
  border-color: $clr-pink transparent $clr-pink transparent;
}
</style>
