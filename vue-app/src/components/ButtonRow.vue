<template>
  <div class="btn-row">
    <button
      v-if="currentStep > 0"
      @click="handleStepNav(currentStep - 1)"
      class="btn-secondary"
      :class="{
        disabled: navDisabled,
      }"
    >
      Previous
    </button>
    <div v-else></div>

    <button
      v-if="currentStep < 5"
      @click="handleNext"
      :class="{
        disabled: !isStepValid,
        'btn-primary': true,
      }"
      :disabled="!isStepValid"
    >
      Next
    </button>
    <!-- TODO: Finish button to trigger tx  -->
    <!-- current logic disables button unless user wallet is connected -->
    <button
      v-if="currentStep === 5"
      @click="handleSubmit"
      to="/project-added"
      class="btn-primary"
      :disabled="!walletProvider && !currentUser"
    >
      Submit
    </button>

  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import { addRecipient } from  '@/api/projects'
import { getRegistryInfo} from '@/api/recipient-registry-optimistic'
import { waitForTransaction } from '@/utils/contracts'

// TODO rename this component
@Component
export default class ButtonRow extends Vue {
  @Prop() currentStep!: number
  @Prop() steps!: string[]
  @Prop() isStepValid!: boolean
  @Prop() callback!: (updateFurthest?: boolean) => void
  @Prop() handleStepNav!: () => void
  @Prop() navDisabled!: boolean

  // TODO do stuff with this?
  submissionTxHash = ''
  submissionTxError = ''
  recipientId = ''

  get walletProvider(): any {
    return (window as any).ethereum
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  handleNext(): void {
    // Save form data (first saves when user hits Next after first step)
    this.callback(true) // "true" checks to update furthest step
    // Navigate forward
    this.$router.push({
      name: 'joinStep',
      params: {
        step: this.steps[this.currentStep + 1],
      },
    })
  }

  handlePrev(): void {
    this.callback()
    this.$router.push({
      name: 'joinStep',
      params: {
        step: this.steps[this.currentStep - 1],
      },
    })
  }

  handleSubmit(): void {
    this.addRecipient()
    alert('submitted')
    // Submit form data
    // Clear form store/state data
  }

  private async addRecipient() {
    const recipientRegistryAddress = this.$store.state.recipientRegistryAddress
    const signer = this.$store.state.currentUser.walletProvider.getSigner()

    // TODO convert to RecipientData from OptimisticRegistry API
    const recipient = this.$store.state.recipient

    // TODO get on create()?
    const registryInfo = await getRegistryInfo(this.$store.state.recipientRegistryAddress)

    let submissionTxReceipt
    try {
      submissionTxReceipt = await waitForTransaction(
        addRecipient(recipientRegistryAddress, recipient, registryInfo.deposit, signer),
        (hash) => this.submissionTxHash = hash,
      )
    } catch (error) {
      this.submissionTxError = error.message
      return
    }
    this.recipientId = getRequestId(submissionTxReceipt, this.recipientRegistryAddress)
    console.log(recipientId)
    // TODO transition user to success step
  }
}
</script>

<style scoped lang="scss">
@import '../styles/theme';
@import '../styles/vars';

.btn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media(max-width: $breakpoint-m) {
    bottom: 0;
  }
}

.disabled {
  cursor: not-allowed;
  opacity: 0.5;

  &:hover {
    opacity: 0.5;
    transform: scale(1);
    cursor: not-allowed;
  }  
}
</style>
