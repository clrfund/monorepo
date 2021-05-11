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
    <button
      v-if="currentStep === 5"
      @click="handleSubmit"
      to="/project-added"
      class="btn-action"
      :disabled="!canSubmit"
    >
      Submit project
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import { User } from '@/api/user'
import { addRecipient, getRegistryInfo, getRequestId } from '@/api/recipient-registry-optimistic'
import { waitForTransaction } from '@/utils/contracts'

@Component
export default class FormNavigation extends Vue {
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

  get canSubmit(): boolean {
    return !!this.walletProvider && !!this.currentUser
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
  }

  private async addRecipient() {
    const recipientRegistryAddress = this.$store.state.recipientRegistryAddress
    const signer = this.$store.state.currentUser.walletProvider.getSigner()
    const recipient = this.$store.state.recipient

    // dummy tx data
    // const recipient = {
    //   furthestStep: 5,
    //   fund: { 
    //     address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    //     plans: 'asd',
    //   },
    //   image: {
    //     bannerHash: 'QmP4qZzXSZpC7sHmsKwYfxZVAzp9tZiDGEpNKzUwA4YzEt',
    //     thumbnailHash: 'QmP4qZzXSZpC7sHmsKwYfxZVAzp9tZiDGEpNKzUwA4YzEt',
    //   },
    //   links: {
    //     discord: '',
    //     github: 'https://github.com/ethereum/clrfund/pull/22',
    //     hasLink: true,
    //     radicle: '',
    //     twitter: '',
    //     website: '',
    //   },
    //   project: { 
    //     category: 'Data',
    //     description: 'asdf',
    //     name: 'asdf',
    //     problemSpace: 'sadf',
    //     tagline: 'asdf',
    //   },
    //   team: {
    //     description: 'asdf',
    //     email: 'glr3home@gmail.com',
    //     name: 'asdf',
    //   },
    // }

    // TODO get on create()?
    const registryInfo = await getRegistryInfo(recipientRegistryAddress)

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
    this.recipientId = getRequestId(submissionTxReceipt, recipientRegistryAddress)
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
