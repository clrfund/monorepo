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
import MetadataForm from '@/views/MetadataForm.vue'
import Links from '@/components/Links.vue'
import { Metadata, MetadataFormData } from '@/api/metadata'
import { isSameAddress } from '@/utils/accounts'
import { ContractTransaction } from 'ethers'
import { SET_METADATA } from '@/store/mutation-types'
import { CHAIN_INFO } from '@/plugins/Web3/constants/chains'

@Component({
  components: {
    MetadataForm,
    Links,
  },
})
export default class MetadataFormEdit extends Vue {
  id = ''

  created() {
    this.id = this.$route.params.id
  }

  async loadFormData(): Promise<void> {
    const savedMetadata = this.$store.state.metadata
    if (!savedMetadata || savedMetadata.id !== this.id) {
      const metadata = await Metadata.get(this.id)
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

  gotoStep(step: string): void {
    this.$router.push({
      name: 'metadata-edit',
      params: { id: this.id, step },
    })
  }

  async onSubmit(
    form: MetadataFormData,
    provider: any
  ): Promise<ContractTransaction> {
    const { owner, network } = form
    const { chainId } = this.$web3
    const signer = await provider.getSigner()
    const signerAddress = await signer.getAddress()

    if (!network) {
      throw new Error('Missing metadata network.')
    }

    if (CHAIN_INFO[chainId].subgraphNetwork !== network) {
      throw new Error(`Please switch network to ${network}.`)
    }

    if (!owner) {
      throw new Error('Missing metadata owner.')
    }

    if (!signerAddress) {
      throw new Error('Invalid signer.')
    }

    if (!isSameAddress(owner, signerAddress)) {
      throw new Error('Not authorized to update metadata.')
    }

    const dirtyOnly = true
    const metadata = Metadata.fromFormData(form, dirtyOnly)
    return metadata.update(provider)
  }
}
</script>
