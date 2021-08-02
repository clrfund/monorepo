<template>
  <div class="modal-body">
    <div v-if="walletProvider">
      <h3>Connect your wallet</h3>
      <div style="margin-bottom: 2rem">
        You must connect to add projects to your cart.
      </div>
      <div class="btn-row">
        <wallet-widget :is-action-button="true" @connected="$emit('close')" />
        <!-- Connecting needs to add the project to your cart and close modal overlay -->
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
      </div>
    </div>
    <div v-if="!walletProvider">
      <h3>No wallet found</h3>
      <div class="btn-row">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<!-- ERRORS: user already has item in cart, user can't add item as contribution is over -->

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import WalletWidget from '@/components/WalletWidget.vue'

@Component({
  components: {
    WalletWidget,
  },
})
export default class ConnectionModal extends Vue {
  get walletProvider(): any {
    return this.$store.state.currentUser?.walletProvider
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.btn-row {
  margin: $modal-space auto 0;
  width: 100%;
  display: flex;
  justify-content: space-between;

  .btn {
    margin: 0 $modal-space;
  }
}

.vm--modal {
  background-color: transparent !important;
}

.modal-body {
  background-color: $bg-primary-color;
  padding: $modal-space;
  box-shadow: $box-shadow;
  text-align: left;

  .loader {
    margin: $modal-space auto;
  }
}
</style>
