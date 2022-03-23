<template>
  <metadata-form
    :loadFormData="loadFormData"
    :cancelUrl="cancelUrl"
    :gotoStep="gotoStep"
    :onSubmit="onSubmit"
    :onSuccess="onSuccess"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Metadata } from '@/api/metadata'
import MetadataForm from '@/views/MetadataForm.vue'
import Links from '@/components/Links.vue'
import { SET_METADATA } from '@/store/mutation-types'
import { ContractTransaction, ContractReceipt } from 'ethers'

@Component({
  components: {
    MetadataForm,
    Links,
  },
})
export default class MetadataFormAdd extends Vue {
  async loadFormData(): Promise<void> {
    if (!this.$store.state.recipient) {
      const metadata = new Metadata({})
      this.$store.commit(SET_METADATA, {
        updatedData: metadata.toFormData(),
      })
    }
    await Promise.resolve()
  }

  get cancelUrl(): string {
    return `/metadata`
  }

  gotoStep(step: string): void {
    this.$router.push({
      name: 'metadata-new',
      params: { step },
    })
  }

  onSubmit(metadata: Metadata, provider: any): Promise<ContractTransaction> {
    return metadata.create(provider)
  }

  onSuccess(receipt: ContractReceipt): void {
    const id = Metadata.getMetadataId(receipt)
    this.$router.push({
      name: 'metadata',
      params: { id },
    })
  }
}
</script>
