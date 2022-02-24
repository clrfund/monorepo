<template>
  <div class="container">
    <div class="grid">
      <div class="title-area">
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
      <div id="summary">
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
              <links :to="editLink('project')" class="edit-button"
                >Edit <img width="16px" src="@/assets/edit.svg"
              /></links>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Name</h4>
              <div class="data">{{ metadata.name }}</div>
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
              <links :to="editLink('fund')" class="edit-button"
                >Edit <img width="16px" src="@/assets/edit.svg"
              /></links>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Ethereum address</h4>
              <div class="data break-all">
                {{ metadata.addressName }}
                <links :to="blockExplorer.url" class="no-break">
                  View on {{ blockExplorer.label }}
                </links>
              </div>
              <div
                class="resolved-address"
                v-if="metadata.addressName"
                title="Resolved ENS address"
              >
                {{ metadata.hasEns ? metadata.resolvedAddress : null }}
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
              <links :to="editLink('team')" class="edit-button"
                >Edit <img width="16px" src="@/assets/edit.svg"
              /></links>
            </div>
            <div v-if="isEmailRequired" class="summary">
              <h4 class="read-only-title">Contact email</h4>
              <div class="data">{{ metadata.email }}</div>
              <div class="input-notice">
                This information won't be added to the smart contract.
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Team name</h4>
              <div class="data">{{ metadata.name }}</div>
              <div class="data" v-if="!metadata.name">Not provided</div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Team description</h4>
              <div class="data">{{ metadata.description }}</div>
              <div class="data" v-if="!metadata.description">Not provided</div>
            </div>
          </div>
          <div class="form-background">
            <div class="summary-section-header">
              <h3 class="step-subtitle">Links</h3>
              <links :to="editLink('links')" class="edit-button"
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
              <links :to="editLink('image')" class="edit-button"
                >Edit <img width="16px" src="@/assets/edit.svg"
              /></links>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Banner</h4>
              <div class="data">
                <ipfs-copy-widget :hash="metadata.bannerImageHash" />
              </div>
            </div>
            <div class="summary">
              <h4 class="read-only-title">Thumbnail</h4>
              <div class="data">
                <ipfs-copy-widget :hash="metadata.thumbnailImageHash" />
              </div>
            </div>
          </div>
          <div v-if="displayDeleteBtn">
            <box>
              <div class="delete-title">Delete metadata</div>
              <metadata-submission-widget
                :metadata="metadata"
                :onSubmit="onSubmit"
                :onSuccess="onSuccess"
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
import Loader from '@/components/Loader.vue'
import Markdown from '@/components/Markdown.vue'
import ProjectProfile from '@/components/ProjectProfile.vue'
import Links from '@/components/Links.vue'
import MetadataSubmissionWidget from '@/components/MetadataSubmissionWidget.vue'
import Box from '@/components/Box.vue'
import { Metadata } from '@/api/metadata'
import { Project } from '@/api/projects'

import { chain } from '@/api/core'
import { ContractTransaction } from 'ethers'

@Component({
  components: {
    Loader,
    Markdown,
    ProjectProfile,
    IpfsCopyWidget,
    Links,
    MetadataSubmissionWidget,
    Box,
  },
})
export default class MetadataViewer extends mixins(validationMixin) {
  @Prop() metadata!: Metadata
  @Prop() displayDeleteBtn!: boolean
  showSummaryPreview = false

  get projectInterface(): Project {
    return this.metadata.toProject()
  }

  editLink(step: string): string {
    const { id } = this.metadata || {}
    return `/metadata/${id}/edit/${step}`
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

  onSubmit(metadata: Metadata, provider: any): Promise<ContractTransaction> {
    return metadata.delete(provider)
  }

  onSuccess(): void {
    this.$router.push({
      name: 'metadata-registry',
    })
  }

  get blockExplorer(): { label: string; url: string } {
    return {
      label: chain.explorerLabel,
      url: `${chain.explorer}/address/${this.metadata.resolvedAddress}`,
    }
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
  gap: 0 2rem;
  padding: 0 2rem;
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
