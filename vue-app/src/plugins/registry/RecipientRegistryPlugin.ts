import Vue from 'vue'
import Component from 'vue-class-component'
import { recipientRegistryType, RecipientRegistryType } from '@/api/core'

// these registries support recipient registration
const SUPPORT_REGISTRATION = [RecipientRegistryType.OPTIMISTIC]

// these registries require registration deposits
const REQUIRE_DEPOSIT = [RecipientRegistryType.OPTIMISTIC]

@Component
export class RecipientRegistryPlugin extends Vue {
  get supportRegistration(): boolean {
    return SUPPORT_REGISTRATION.includes(
      recipientRegistryType as RecipientRegistryType
    )
  }

  get requireDeposit(): boolean {
    return REQUIRE_DEPOSIT.includes(
      recipientRegistryType as RecipientRegistryType
    )
  }
}
