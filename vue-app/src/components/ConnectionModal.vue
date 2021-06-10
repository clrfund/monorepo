<template>
  <div class="modal-body">
    <div v-if="walletProvider">
      <h3>Connect your wallet</h3>
      <div style="margin-bottom: 2rem;">You must connect to add projects to your cart.</div>
      <div class="btn-row">
        <wallet-widget @connected="$emit('close')" />
        <!-- Connecting needs to add the project to your cart and close modal overlay -->
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
    return (window as any).ethereum
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';


.contribution-form {
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  margin-top: $modal-space;

  input {
    width: 100%;
  }
}

.btn-row {
  margin: $modal-space auto 0;
  width: 100%;
  display: flex;
  justify-content: space-between;

  .btn {
    margin: 0 $modal-space;
  }
}

.close-btn {
  margin-top: $modal-space;
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

.input-button {
  background: #F7F7F7;
  border-radius: 2rem;
  border: 2px solid $bg-primary-color;
  display: flex;
  align-items: center;
  color: black;
  padding: 0.125rem;
  z-index: 100;
  width: 100%;
}

.input {
  background: none;
  border: none;
  color: $bg-primary-color;
  width: 100%;
}

.balance-check {
  font-size: 14px;
  text-transform: uppercase;
  font-weight: 500;
  margin-top: 0.5rem;
}
.balance-check-warning {
  font-size: 14px;
  text-transform: uppercase;
  font-weight: 500;
  margin-top: 0.5rem;
  color: $warning-color;
}

.transaction-fee {
  opacity: 0.6;
  font-size: 14px;
  text-transform: uppercase;
  font-weight: 500;
  margin-top: 1rem;
}

</style>
