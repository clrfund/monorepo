<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Register project</h3>
      <transaction
        :hash="registrationTxHash"
        :error="registrationTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 2">
      <h3>Success!</h3>
      <div>You have successfully registered {{ project.name }} as a funding recipient.</div>
      <button class="btn close-btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import { registerProject } from  '@/api/projects'
import Transaction from '@/components/Transaction.vue'
import { waitForTransaction } from '@/utils/contracts'

@Component({
  components: {
    Transaction,
  },
})
export default class RecipientRegistrationModal extends Vue {

  @Prop()
  project!: { id: string; name: string }

  step = 1

  registrationTxHash = ''
  registrationTxError = ''

  mounted() {
    this.register()
  }

  private async register() {
    const recipientRegistryAddress = this.$store.state.recipientRegistryAddress
    const signer = this.$store.state.currentUser.walletProvider.getSigner()
    try {
      await waitForTransaction(
        registerProject(recipientRegistryAddress, this.project.id, signer),
        (hash) => this.registrationTxHash = hash,
      )
    } catch (error) {
      this.registrationTxError = error.message
      return
    }
    this.step += 1
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.close-btn {
  margin-top: $modal-space;
}
</style>
