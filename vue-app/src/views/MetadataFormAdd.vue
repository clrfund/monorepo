<template>
  <metadata-form
    :loadFormData="loadFormData"
    :cancelUrl="cancelUrl"
    :gotoStep="gotoStep"
    :onSubmit="onSubmit"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Metadata } from '@/api/metadata'
import MetadataForm from '@/views/MetadataForm.vue'
import Links from '@/components/Links.vue'
import { SET_METADATA } from '@/store/mutation-types'
import { ContractTransaction } from 'ethers'

@Component({
  components: {
    MetadataForm,
    Links,
  },
})
export default class MetadataFormAdd extends Vue {
  async loadFormData(): Promise<void> {
    if (!this.$store.state.metadata) {
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

  async onSubmit(
    metadata: Metadata,
    provider: any
  ): Promise<ContractTransaction> {
    const name = metadata.name || ''
    const signer = await provider.getSigner()
    const id = Metadata.makeMetadataId(name, signer.address)
    const exists = await Metadata.get(id)
    if (exists) {
      throw new Error('Metadata ' + id + ' already exits')
    }
    return metadata.create(provider)
  }
}
</script>
