<template>
  <div class="container">
    <div class="grid">
      <div class="tabs-area">
        <div class="toggle-tabs-desktop">
          <p
            class="tab"
            id="review"
            :class="showSummaryPreview ? 'inactive-tab' : 'active-tab'"
            @click="handleToggleTab"
          >
            Review info
          </p>
          <p
            class="tab"
            id="preview"
            :class="showSummaryPreview ? 'active-tab' : 'inactive-tab'"
            @click="handleToggleTab"
          >
            Preview project
          </p>
        </div>
      </div>
      <div class="summary-area">
        <project-profile
          v-if="showSummaryPreview"
          :project="projectInterface"
          :previewMode="true"
          class="project-details"
        />
        <div v-if="!showSummaryPreview">
          <div class="form-background">
            <div class="summary-section-header">
              <h3 class="step-subtitle">About the metadata</h3>
              <links
                v-if="isAuthorized"
                :to="editLink('project')"
                class="edit-button"
                >Edit <img width="16px" src="@/assets/edit.svg"
              /></links>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Name</h4>
              <div class="data">{{ metadata.name }}</div>
            </div>
            <div class="summary" v-if="isDeleted">
              <h4 class="read-only-title">Deleted</h4>
              <div class="data">Yes</div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Owner</h4>
              <div class="data">
                <address-widget
                  v-if="metadata.owner"
                  :address="metadata.owner"
                  :chainId="getChainId(metadata.network)"
                />
                <div class="data" v-else>Not provided</div>
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Network</h4>
              <div class="data">{{ metadata.network }}</div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Tagline</h4>
              <div class="data">{{ metadata.tagline }}</div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Description</h4>
              <div class="data">{{ metadata.description }}</div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Category</h4>
              <div class="data">{{ metadata.category }}</div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Problem space</h4>
              <div class="data">{{ metadata.problemSpace }}</div>
            </div>
          </div>
          <div class="form-background">
            <div class="summary-section-header">
              <h3 class="step-subtitle">Funding details</h3>
              <links
                v-if="isAuthorized"
                :to="editLink('fund')"
                class="edit-button"
                >Edit <img width="16px" src="@/assets/edit.svg"
              /></links>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Ethereum addresses</h4>
              <div
                v-for="({ address, chainId }, index) in receivingAddresses"
                :key="index"
              >
                <div key="index" class="data">
                  <address-widget :address="address" :chainId="chainId" />
                </div>
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Funding plans</h4>
              <div class="data">{{ metadata.plans }}</div>
            </div>
          </div>
          <div class="form-background">
            <div class="summary-section-header">
              <h3 class="step-subtitle">Team details</h3>
              <links
                v-if="isAuthorized"
                :to="editLink('team')"
                class="edit-button"
                >Edit <img width="16px" src="@/assets/edit.svg"
              /></links>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Team name</h4>
              <div class="data">{{ metadata.teamName }}</div>
              <div class="data" v-if="!metadata.teamName">Not provided</div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Team description</h4>
              <div class="data">{{ metadata.teamDescription }}</div>
              <div class="data" v-if="!metadata.teamDescription">
                Not provided
              </div>
            </div>
          </div>
          <div class="form-background">
            <div class="summary-section-header">
              <h3 class="step-subtitle">Links</h3>
              <links
                v-if="isAuthorized"
                :to="editLink('links')"
                class="edit-button"
                >Edit <img width="16px" src="@/assets/edit.svg"
              /></links>
            </div>
            <div class="summary">
              <h4 class="read-only-title">GitHub</h4>
              <div class="data">
                {{ metadata.githubUrl }}
                <links
                  v-if="metadata.githubUrl"
                  :to="metadata.githubUrl"
                  :hideArrow="true"
                  ><img width="16px" src="@/assets/link.svg"
                /></links>
              </div>
              <div class="data" v-if="!metadata.githubUrl">Not provided</div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Twitter</h4>
              <div class="data">
                {{ metadata.twitterUrl }}
                <links
                  v-if="metadata.twitterUrl"
                  :to="metadata.twitterUrl"
                  :hideArrow="true"
                  ><img width="16px" src="@/assets/link.svg"
                /></links>
              </div>
              <div class="data" v-if="!metadata.twitterUrl">Not provided</div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Website</h4>
              <div class="data" key="">
                {{ metadata.websiteUrl }}
                <links
                  v-if="metadata.websiteUrl"
                  :to="metadata.websiteUrl"
                  :hideArrow="true"
                  ><img width="16px" src="@/assets/link.svg"
                /></links>
              </div>
              <div class="data" v-if="!metadata.websiteUrl">Not provided</div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Discord</h4>
              <div class="data">
                {{ metadata.discordUrl }}
                <links
                  v-if="metadata.discordUrl"
                  :to="metadata.discordUrl"
                  :hideArrow="true"
                  ><img width="16px" src="@/assets/link.svg"
                /></links>
              </div>
              <div class="data" v-if="!metadata.discordUrl">Not provided</div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Radicle</h4>
              <div class="data">
                {{ metadata.radicleUrl }}
                <links
                  v-if="metadata.radicleUrl"
                  :to="metadata.radicleUrl"
                  :hideArrow="true"
                  ><img width="16px" src="@/assets/link.svg"
                /></links>
              </div>
              <div class="data" v-if="!metadata.radicleUrl">Not provided</div>
            </div>
          </div>
          <div class="form-background">
            <div class="summary-section-header">
              <h3 class="step-subtitle">Images</h3>
              <links
                v-if="isAuthorized"
                :to="editLink('image')"
                class="edit-button"
                >Edit <img width="16px" src="@/assets/edit.svg"
              /></links>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Banner</h4>
              <div class="data">
                <ipfs-copy-widget
                  v-if="metadata.bannerImageHash"
                  :hash="metadata.bannerImageHash"
                />
                <div class="data" v-else>Not provided</div>
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Thumbnail</h4>
              <div class="data">
                <ipfs-copy-widget
                  v-if="metadata.thumbnailImageHash"
                  :hash="metadata.thumbnailImageHash"
                />
                <div class="data" v-else>Not provided</div>
              </div>
            </div>
          </div>
          <div v-if="displayDeleteBtn && isAuthorized && !isDeleted">
            <box>
              <div class="delete-title">Delete metadata</div>
              <transaction-result
                v-if="deleteHash"
                :hash="deleteHash"
                :chainId="deleteChainId"
                :buttons="metadataRegistryButton"
              />
              <metadata-submission-widget
                v-else
                :form="formData"
                :onSubmit="onDeleteSubmit"
                :onSuccess="onDeleteSuccess"
              />
            </box>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Component, { mixins } from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { validationMixin } from 'vuelidate'
import IpfsCopyWidget from '@/components/IpfsCopyWidget.vue'
import AddressWidget from '@/components/AddressWidget.vue'
import Loader from '@/components/Loader.vue'
import Markdown from '@/components/Markdown.vue'
import ProjectProfile from '@/components/ProjectProfile.vue'
import Links from '@/components/Links.vue'
import MetadataSubmissionWidget from '@/components/MetadataSubmissionWidget.vue'
import Box from '@/components/Box.vue'
import TransactionResult from '@/components/TransactionResult.vue'
import { Metadata, MetadataFormData } from '@/api/metadata'
import { Project } from '@/api/projects'
import { chain } from '@/api/core'
import { LinkInfo } from '@/api/types'
import { isSameAddress } from '@/utils/accounts'

import { CHAIN_INFO, CHAIN_ID } from '@/plugins/Web3/constants/chains'
import { ContractTransaction, ContractReceipt } from 'ethers'
import { SET_METADATA } from '@/store/mutation-types'

@Component({
  components: {
    Loader,
    Markdown,
    ProjectProfile,
    IpfsCopyWidget,
    AddressWidget,
    Links,
    MetadataSubmissionWidget,
    TransactionResult,
    Box,
  },
})
export default class MetadataViewer extends mixins(validationMixin) {
  @Prop() metadata!: Metadata
  @Prop() displayDeleteBtn!: boolean
  showSummaryPreview = false
  deleteHash = ''
  deleteChainId = 0

  created() {
    // make sure the edit form display the same data as the viewer
    const updatedData = this.metadata?.toFormData()
    this.$store.commit(SET_METADATA, {
      updatedData,
    })
  }

  get projectInterface(): Project {
    return this.metadata.toProject()
  }

  get isDeleted(): boolean {
    return this.metadata.deletedAt === null
  }

  editLink(step: string): string {
    const { id } = this.metadata || {}
    return `/metadata/${id}/edit/${step}`
  }

  get isAuthorized(): boolean {
    const { currentUser } = this.$store.state
    const { owner, network } = this.metadata || {}
    const walletAddress = currentUser?.walletAddress

    if (!currentUser || !owner || !walletAddress) {
      return false
    }

    return (
      network === chain.name && isSameAddress(owner, currentUser.walletAddress)
    )
  }

  handleToggleTab(event): void {
    const { id } = event.target
    // Guard clause:
    if (
      (!this.showSummaryPreview && id === 'review') ||
      (this.showSummaryPreview && id === 'preview')
    )
      return
    this.showSummaryPreview = !this.showSummaryPreview
  }

  get formData(): MetadataFormData {
    const form = this.metadata.toFormData()
    return form
  }

  onDeleteSubmit(
    form: MetadataFormData,
    provider: any
  ): Promise<ContractTransaction> {
    const { network } = form
    const { chainId } = this.$web3

    if (CHAIN_INFO[chainId].name !== network) {
      throw new Error(`Deleting metadata on ${network} is not supported.`)
    }

    const metadata = new Metadata({ id: form.id })
    return metadata.delete(provider)
  }

  onDeleteSuccess(receipt: ContractReceipt, chainId: number): void {
    this.deleteHash = receipt.transactionHash
    this.deleteChainId = chainId
  }

  get metadataRegistryButton(): LinkInfo[] {
    return [
      {
        url: `/metadata`,
        text: 'Goto metadata registry',
      },
    ]
  }

  getChainId(network: string): number | undefined {
    return CHAIN_ID[network]
  }

  get receivingAddresses(): { address: string; chainId: number }[] {
    const addresses = this.metadata.receivingAddresses || []

    return addresses.map((addr) => {
      const [shortName, address] = addr.split(':')
      const chainId = CHAIN_ID[shortName]

      return {
        address,
        chainId,
      }
    })
  }

  get isEmailRequired(): boolean {
    return !!process.env.VUE_APP_GOOGLE_SPREADSHEET_ID
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
  width: clamp(calc(800px - 4rem), calc(100% - 4rem), 1100px);
  margin: 0 auto;
  @media (max-width: $breakpoint-m) {
    width: 100%;
  }
}

.grid {
  display: grid;
  grid-template-areas:
    'tabs'
    'summary';
}

.tabs-area {
  grid-area: tabs;
  padding: 1rem;
  padding-left: 0rem;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;

  @media (max-width: $breakpoint-m) {
    padding-bottom: 0;
    padding-left: 1rem;
    font-size: 14px;
    font-weight: normal;
  }
}

.summary-area {
  grid-area: summary;
  overflow: auto;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  height: 100%;
  @media (min-width: $breakpoint-m) {
    padding: 0;
    width: 100%;
  }
}

.form-background {
  border-radius: 0.5rem;
  padding: 1rem;
  background: $bg-light-color;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  &:last-of-type {
    margin-bottom: 2rem;
  }
  @media (max-width: $breakpoint-m) {
    &:first-of-type {
      margin-top: 0;
    }
  }
}

.link {
  font-family: Inter;
  font-size: 16px;
  text-decoration: underline;
}

.summary {
  margin-bottom: 1rem;
}

.summary-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid $highlight-color;
  padding-bottom: 0.5rem;
}

.toggle-tabs-desktop {
  display: flex;
  gap: 2rem;
  font-family: 'Inter';

  .active-tab {
    padding-bottom: 0.5rem;
    border-bottom: 4px solid $clr-green;
    border-radius: 4px;
    font-weight: 600;
  }

  .inactive-tab {
    padding-bottom: 0.5rem;
    cursor: pointer;
    &:hover {
      opacity: 0.8;
      border-bottom: 4px solid #fff7;
      border-radius: 4px;
    }
  }
}

.edit-button {
  font-family: 'Inter';
  font-weight: 500;
  font-size: 16px;
  color: $clr-green;
}

.data {
  opacity: 0.8;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.data img {
  padding: 0.25rem;
  margin-top: 0.25rem;
  &:hover {
    background: $bg-primary-color;
    border-radius: 4px;
  }
}

.pt-1 {
  padding-top: 1rem;
}

.break-all {
  @media (max-width: $breakpoint-s) {
    display: block;
  }

  p {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.no-break {
  white-space: nowrap;
}

.resolved-address {
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.5;
  word-break: keep-all;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.delete-title {
  font-size: 1.5rem;
}
</style>
