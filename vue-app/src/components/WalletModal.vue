<template>
  <vue-final-modal class="modal-container" background="interactive">
    <div v-if="connectingWallet" class="modal-body loading">
      <loader />
      <p>{{ $t('walletModal.p1') }}</p>
    </div>
    <div v-else class="modal-body">
      <div class="top">
        <p>{{ $t('walletModal.p2') }}</p>
        <button class="close-button" @click="emit('close')">
          <img class="pointer" src="@/assets/close.svg" />
        </button>
      </div>
      <button v-if="windowEthereum" class="option" @click="connectWallet('metamask')">
        <p>{{ $t('walletModal.p3') }}</p>
        <img height="24" width="24" src="@/assets/metamask.svg" />
      </button>
      <button v-else class="option" @click="redirectToMetamaskWebsite()">
        <p>{{ $t('walletModal.p4') }}</p>
        <img height="24" width="24" src="@/assets/metamask.svg" />
      </button>
      <button class="option" @click="connectWallet('walletconnect')">
        <p>{{ $t('walletModal.p5') }}</p>
        <img height="24" width="24" src="@/assets/walletConnectIcon.svg" />
      </button>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </vue-final-modal>
</template>

<script setup lang="ts">
import Loader from '@/components/Loader.vue'
import { useWalletStore, type WalletProvider } from '@/stores'
import { VueFinalModal } from 'vue-final-modal'

const error = ref('')
const connectingWallet = ref(false)

const { connect } = useWalletStore()
const emit = defineEmits(['close'])

const windowEthereum = computed(() => {
  return (window as any).ethereum
})

async function connectWallet(walletType: WalletProvider) {
  error.value = ''
  connectingWallet.value = true
  try {
    await connect(walletType)
    emit('close')
  } catch (err) {
    error.value = (err as Error).message
  }
  connectingWallet.value = false
}

function redirectToMetamaskWebsite() {
  window.open('https://metamask.io/', '_blank')
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.vm--modal {
  background-color: transparent !important;
  box-shadow: none;
}

.modal-body {
  margin-top: $modal-space;
  text-align: left;
  background: var(--bg-secondary-color);
  border-radius: 1rem;
  display: grid;
  grid-gap: 10px;
}

.loading {
  align-content: center;
  text-align: center;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -16px;
}

.option {
  background: var(--bg-secondary-color);
  padding: 0 1rem;
  border-radius: 1rem;
  border: 1px solid;
  border-color: var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  color: var(--text-body);
  &:hover {
    cursor: pointer;
    border-color: var(--border-color);
    background: var(--bg-primary-color);
  }

  .btn-margin {
    margin-top: 16px;
  }
}

.close-button {
  background: transparent;
  border: none;
  img {
    filter: var(--img-filter, invert(0.3));
  }
}
</style>
