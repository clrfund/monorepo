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
import MetadataForm from '@/views/MetadataForm.vue'
import Links from '@/components/Links.vue'
import { Metadata } from '@/api/metadata'
import { ContractTransaction, ContractReceipt } from 'ethers'
import { SET_METADATA } from '@/store/mutation-types'

@Component({
  components: {
    MetadataForm,
    Links,
  },
})
export default class MetadataFormEdit extends Vue {
  async loadFormData(): Promise<void> {
    const id = this.$route.params.id
    const savedMetadata = this.$store.state.metadata
    if (!savedMetadata || savedMetadata.id !== id) {
      const metadata = await Metadata.get(id)
      // if we can't find the id, clear the form
      const updatedData = metadata ? metadata.toFormData() : new Metadata({})
      this.$store.commit(SET_METADATA, {
        updatedData,
      })
    }
  }

  get cancelUrl(): string {
    return `/metadata/${this.$route.params.id}`
  }

  get id(): string {
    return this.$store.state.metadata.id
  }

  gotoStep(step: string): void {
    this.$router.push({
      name: 'metadata-edit',
      params: { id: this.id, step },
    })
  }

  onSubmit(metadata: Metadata, provider: any): Promise<ContractTransaction> {
    return metadata.update(provider)
  }

  onSuccess(receipt: ContractReceipt): void {
    const { transactionHash: hash } = receipt
    const id = this.id
    const action = 'edit'

    this.$router.push({
      name: 'metadata-result',
      params: { id, hash, action },
    })
  }
}
</script>
