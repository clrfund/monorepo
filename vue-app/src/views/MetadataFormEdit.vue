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
import { ContractTransaction } from 'ethers'
import { SET_RECIPIENT_DATA } from '@/store/mutation-types'

@Component({
  components: {
    MetadataForm,
    Links,
  },
})
export default class MetadataFormEdit extends Vue {
  async loadFormData(): Promise<void> {
    const id = this.$route.params.id
    const savedRecipient = this.$store.state.recipient
    if (!savedRecipient || savedRecipient.id !== id) {
      const metadata = await Metadata.get(id)
      if (metadata) {
        this.$store.commit(SET_RECIPIENT_DATA, {
          updatedData: metadata.toRecipient(),
        })
      }
    }
  }

  get cancelUrl(): string {
    return `/metadata/${this.$route.params.id}`
  }

  get id(): string {
    return this.$store.state.recipient.id
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

  onSuccess(): void {
    this.$router.push({
      name: 'metadata',
      params: { id: this.id },
    })
  }
}
</script>
