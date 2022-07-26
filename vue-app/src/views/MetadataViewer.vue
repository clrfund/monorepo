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
              <h3 class="step-subtitle">About the project</h3>
              <links
                v-if="isAuthorized"
                :to="editLink('project')"
                class="edit-button"
                >Edit <img width="16px" src="@/assets/edit.svg"
              /></links>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Name</h4>
              <div class="data">{{ form.project.name }}</div>
              <div v-if="$v.form.project.name.$invalid" class="error">
                Project name is required.
              </div>
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
                  :chainId="currentChainId"
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
              <div class="data">{{ form.project.tagline }}</div>
              <div v-if="$v.form.project.tagline.$invalid">
                <div v-if="!$v.form.project.tagline.required" class="error">
                  Tagline is required.
                </div>
                <div v-else class="error">
                  Project tagline must be less than 140 characters.
                </div>
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Description</h4>
              <div class="data">{{ form.project.description }}</div>
              <div v-if="!$v.form.project.description.required" class="error">
                Description is required.
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Category</h4>
              <div class="data">{{ form.project.category }}</div>
              <div v-if="!$v.form.project.category.required" class="error">
                Category is required.
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Problem space</h4>
              <div class="data">{{ form.project.problemSpace }}</div>
              <div v-if="!$v.form.project.problemSpace.required" class="error">
                Problem space is required.
              </div>
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
              <h4 class="read-only-title">Receiving address</h4>
              <div key="index" class="data">
                <address-widget
                  :address="form.fund.currentChainReceivingAddress"
                  :chainId="currentChainId"
                />
              </div>
              <div v-if="$v.form.fund.currentChainReceivingAddress.$invalid">
                <div
                  v-if="!$v.form.fund.currentChainReceivingAddress.required"
                  class="error"
                >
                  Receiving address is required.
                </div>
                <div v-else class="error">Invalid Ethereum 0x address</div>
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Funding plans</h4>
              <div class="data">{{ form.fund.plans }}</div>
              <div v-if="!$v.form.fund.plans.required" class="error">
                Funding plans is required.
              </div>
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
              <div class="data">{{ form.team.name }}</div>
              <div class="data" v-if="!form.team.name">Not provided</div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Team description</h4>
              <div class="data">{{ form.team.description }}</div>
              <div class="data" v-if="!form.team.description">Not provided</div>
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
            <div class="error" v-if="noLinkProvided">
              At least one link is required.
            </div>
            <div class="summary">
              <h4 class="read-only-title">GitHub</h4>
              <div class="data">
                {{ form.links.github }}
                <links
                  v-if="form.links.github"
                  :to="form.links.github"
                  :hideArrow="true"
                  ><img width="16px" src="@/assets/link.svg"
                /></links>
              </div>
              <div class="data" v-if="!form.links.github">Not provided</div>
              <div class="error" v-if="$v.form.links.github.$invalid">
                This doesn't look like a valid URL.
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Twitter</h4>
              <div class="data">
                {{ form.links.twitter }}
                <links
                  v-if="form.links.twitter"
                  :to="form.links.twitter"
                  :hideArrow="true"
                  ><img width="16px" src="@/assets/link.svg"
                /></links>
              </div>
              <div class="data" v-if="!form.links.twitter">Not provided</div>
              <div class="error" v-if="$v.form.links.twitter.$invalid">
                This doesn't look like a valid URL.
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Website</h4>
              <div class="data" key="">
                {{ form.links.website }}
                <links
                  v-if="form.links.website"
                  :to="form.links.website"
                  :hideArrow="true"
                  ><img width="16px" src="@/assets/link.svg"
                /></links>
              </div>
              <div class="data" v-if="!form.links.website">Not provided</div>
              <div class="error" v-if="$v.form.links.twitter.$invalid">
                This doesn't look like a valid URL.
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Discord</h4>
              <div class="data">
                {{ form.links.discord }}
                <links
                  v-if="form.links.discord"
                  :to="form.links.discord"
                  :hideArrow="true"
                  ><img width="16px" src="@/assets/link.svg"
                /></links>
              </div>
              <div class="data" v-if="!form.links.discord">Not provided</div>
              <div class="error" v-if="$v.form.links.discord.$invalid">
                This doesn't look like a valid URL.
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Radicle</h4>
              <div class="data">
                {{ form.links.radicle }}
                <links
                  v-if="form.links.radicle"
                  :to="form.links.radicle"
                  :hideArrow="true"
                  ><img width="16px" src="@/assets/link.svg"
                /></links>
              </div>
              <div class="data" v-if="!metadata.radicleUrl">Not provided</div>
              <div class="error" v-if="$v.form.links.radicle.$invalid">
                This doesn't look like a valid URL.
              </div>
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
                  v-if="form.image.bannerHash"
                  :hash="form.image.bannerHash"
                />
                <div class="data" v-else>Not provided</div>
              </div>
              <div v-if="$v.form.image.bannerHash.$invalid">
                <div class="error" v-if="!$v.form.image.bannerHash.required">
                  Banner image is required.
                </div>
                <div class="error" v-else>
                  This doesn't look like a valid IPFS hash.
                </div>
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Thumbnail</h4>
              <div class="data">
                <ipfs-copy-widget
                  v-if="form.image.thumbnailHash"
                  :hash="form.image.thumbnailHash"
                />
                <div class="data" v-else>Not provided</div>
              </div>
              <div v-if="$v.form.image.thumbnailHash.$invalid">
                <div class="error" v-if="!$v.form.image.thumbnailHash.required">
                  Thumbnail image is required.
                </div>
                <div class="error" v-else>
                  This doesn't look like a valid IPFS hash.
                </div>
              </div>
            </div>
          </div>
          <div v-if="displayDeleteBtn && isAuthorized && !isDeleted">
            <box>
              <div class="delete-title">Delete metadata</div>
              <transaction-result
                v-if="!!txHash && !isWaiting"
                :hash="txHash"
                :buttons="metadataRegistryButton"
              />
              <metadata-submission-widget
                v-else
                :buttonHandler="handleDelete"
                :txHash="txHash"
                :isWaiting="isWaiting"
                :progress="progress"
                :txError="txError"
                :disableButton="isWaiting"
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
import {
  Metadata,
  MetadataFormData,
  MetadataFormValidations,
} from '@/api/metadata'
import { Project } from '@/api/projects'
import { chain, TransactionProgress } from '@/api/core'
import { LinkInfo } from '@/api/types'
import { isSameAddress } from '@/utils/accounts'
import { waitForTransaction } from '@/utils/contracts'

import { CHAIN_INFO, CHAIN_ID } from '@/plugins/Web3/constants/chains'
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
  validations: {
    form: MetadataFormValidations,
  },
})
export default class MetadataViewer extends mixins(validationMixin) {
  @Prop() metadata!: Metadata
  @Prop() displayDeleteBtn!: boolean
  showSummaryPreview = false
  deleteChainId = 0
  txHash = ''
  isWaiting = false
  progress: TransactionProgress | null = null
  txError = ''
  form: MetadataFormData = new Metadata({}).toFormData()

  created() {
    // make sure the edit form display the same data as the viewer
    this.form = this.metadata.toFormData()
    this.$v.form.$touch()
    this.$store.commit(SET_METADATA, {
      updatedData: this.form,
    })
  }

  get projectInterface(): Project {
    return this.metadata.toProject()
  }

  get isDeleted(): boolean {
    return this.metadata.deletedAt === null
  }

  editLink(step: string): string {
    const { id } = this.form || {}
    return `/metadata/${id}/edit/${step}`
  }

  get noLinkProvided(): boolean {
    return !Object.values(this.form?.links || []).some(Boolean)
  }

  get isAuthorized(): boolean {
    const { currentUser } = this.$store.state
    const { owner, network } = this.form || {}
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

  async handleDelete(): Promise<void> {
    const { network, id } = this.form
    const { chainId } = this.$web3
    const { walletProvider } = this.$store.state.currentUser

    this.txError = ''

    if (CHAIN_INFO[chainId].name !== network) {
      throw new Error(`Deleting metadata on ${network} is not supported.`)
    }

    const metadata = new Metadata({ id })
    try {
      this.isWaiting = true
      const transaction = metadata.delete(walletProvider)
      const receipt = await waitForTransaction(
        transaction,
        (hash) => (this.txHash = hash)
      )

      await Metadata.waitForBlock(
        receipt.blockNumber,
        chain.name,
        0,
        (current, last) => (this.progress = { current, last })
      )
      this.isWaiting = false
    } catch (error) {
      this.txError = (error as Error).message
      this.isWaiting = false
    }
  }

  get metadataRegistryButton(): LinkInfo[] {
    return [
      {
        url: `/metadata`,
        text: 'Goto metadata registry',
      },
    ]
  }

  get currentChainId(): number {
    return CHAIN_ID[chain.name]
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
  background: var(--bg-light-color);
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
    background: var(--bg-primary-color);
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
</style>
