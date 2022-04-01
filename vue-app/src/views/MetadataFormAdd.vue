<template>
  <metadata-form
    :loadFormData="loadFormData"
    :toMetadata="toMetadata"
    :cancelUrl="cancelUrl"
    :gotoStep="gotoStep"
    :onSubmit="onSubmit"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Metadata, MetadataFormData } from '@/api/metadata'
import MetadataForm from '@/views/MetadataForm.vue'
import Links from '@/components/Links.vue'
import { SET_METADATA } from '@/store/mutation-types'
import { ContractTransaction } from 'ethers'
import { chain } from '@/api/core'

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

  toMetadata(form: MetadataFormData): Metadata {
    const { currentUser } = this.$store.state
    const owner = currentUser ? currentUser.walletAddress : undefined
    const network = chain.name
    return Metadata.fromFormData({ ...form, owner, network })
  }

  async onSubmit(
    form: MetadataFormData,
    provider: any
  ): Promise<ContractTransaction> {
    const name = form.project.name || ''
    const signer = await provider.getSigner()
    const signerAddress = await signer.getAddress()
    const id = Metadata.makeMetadataId(name, signerAddress)
    const exists = await Metadata.get(id)
    if (exists) {
      throw new Error('Metadata ' + id + ' already exits')
    }

    const dirtyOnly = true
    const metadata = Metadata.fromFormData(form, dirtyOnly)
    return metadata.create(provider)
  }
}
</script>
