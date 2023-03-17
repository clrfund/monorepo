<template>
  <div>
    <h2 class="step-title">{{ $t('brightIDSponsor.h2') }}</h2>
    <p>{{ $t('brightIDSponsor.p') }}</p>
    <div class="transaction">
      <div>
        <div>
          <wallet-widget
            class="button"
            v-if="!currentUser"
            :isActionButton="true"
            :fullWidthMobile="true"
          />
          <button
            v-else
            type="button"
            class="btn-action button"
            @click="sponsor"
            :disabled="sponsorTxHash.length !== 0"
          >
            {{ $t('brightIDSponsor.cta') }}
          </button>
        </div>
        <transaction
          v-if="sponsorTxHash || loadingTx || sponsorTxError"
          :display-close-btn="false"
          :hash="sponsorTxHash"
          :error="sponsorTxError"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { selfSponsor } from '@/api/bright-id'
import { waitForTransaction } from '@/utils/contracts'
import { User } from '@/api/user'
import WalletWidget from '@/components/WalletWidget.vue'
import Transaction from '@/components/Transaction.vue'

@Component({
  components: {
    WalletWidget,
    Transaction,
  },
})
export default class BrightIdSponsor extends Vue {
  loadingTx = false
  sponsorTxError = ''
  sponsorTxHash = ''

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  async sponsor() {
    if (!this.currentUser) return

    const { userRegistryAddress } = this.$store.getters
    const signer = this.currentUser.walletProvider.getSigner()

    this.loadingTx = true
    this.sponsorTxError = ''
    try {
      await waitForTransaction(
        selfSponsor(userRegistryAddress, signer),
        (hash) => (this.sponsorTxHash = hash)
      )
      this.loadingTx = false
      this.$router.push({
        name: 'sponsored',
        params: { hash: this.sponsorTxHash },
      })
    } catch (error) {
      this.sponsorTxError = (error as Error).message
      return
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.transaction {
  padding: 2rem;
  border-radius: 1rem;
  width: auto;

  .button {
    max-width: 250px;
    margin: auto;
  }
}
</style>
