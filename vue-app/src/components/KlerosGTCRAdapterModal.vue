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

import { Project, getRecipientRegistryAddress } from '@/api/projects'
import { registerProject } from '@/api/recipient-registry-kleros'
import Transaction from '@/components/Transaction.vue'
import { waitForTransaction } from '@/utils/contracts'

@Component({
  components: {
    Transaction,
  },
})
export default class KlerosGTCRAdapterModal extends Vue {

  @Prop()
  project!: Project

  step = 1

  registrationTxHash = ''
  registrationTxError = ''

  mounted() {
    this.register()
  }

  private async register() {
    const recipientRegistryAddress = await getRecipientRegistryAddress()
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
  margin-top: 20px;
}
</style>
