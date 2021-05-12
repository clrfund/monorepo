<template>
  <div class="recipients">
    <h1 class="content-heading">Recipient registry</h1>
    <div v-if="registryInfo" class="submit-project">
      <div class="submit-project-info">
        In order to become a recipient of funding, a project must go through a review process.
        <br>
        It takes {{ formatDuration(registryInfo.challengePeriodDuration) }} and requires a {{ formatAmount(registryInfo.deposit) }} {{ registryInfo.depositToken }} security deposit.
      </div>
      <button
        class="btn"
        @click="submitProject()"
        :disabled="!canSubmitProject()"
      >
        Submit project
      </button>
    </div>
    <loader v-if="isLoading"/>
    <h2 v-if="requests.length > 0">Recent changes</h2>
    <table v-if="requests.length > 0" class="requests">
      <thead>
        <tr>
          <th>Project</th>
          <th>Request type</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="request in requests.slice().reverse()" :key="request.transactionHash">
          <td>
            <div class="project-name">
              <a :href="request.metadata.imageUrl" target="_blank" rel="noopener">
                <img class="project-image" :src="request.metadata.imageUrl">
              </a>
              {{ request.metadata.name }}
            </div>
            <div class="project-description" v-html="renderDescription(request)"></div>
            <details class="project-details">
              <summary>Additional info</summary>
              <div>Transaction: <code>{{ request.transactionHash }}</code></div>
              <div>Project ID: <code>{{ request.recipientId }}</code></div>
              <div>Recipient address: <code>{{ request.recipient }}</code></div>
              <div v-if="isPending(request)">Acceptance date: {{ formatDate(request.acceptanceDate) }}</div>
            </details>
          </td>
          <td>{{ request.type }}</td>
          <td>
            <template v-if="hasProjectLink(request)">
              <router-link
                :to="{ name: 'project', params: { id: request.recipientId }}"
              >
                {{ request.status }}
              </router-link>
            </template>
            <template v-else>
              {{ request.status }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber } from 'ethers'
import * as humanizeDuration from 'humanize-duration'
import { DateTime } from 'luxon'

import { recipientRegistryType } from '@/api/core'
import { getRecipientRegistryAddress } from '@/api/projects'
import {
  RegistryInfo,
  RequestType,
  RequestStatus,
  Request,
  getRegistryInfo,
  getRequests,
} from '@/api/recipient-registry-optimistic'
import { getCurrentRound } from '@/api/round'
import RecipientSubmissionModal from '@/components/RecipientSubmissionModal.vue'
import Loader from '@/components/Loader.vue'
import { SET_RECIPIENT_REGISTRY_ADDRESS } from '@/store/mutation-types'
import { formatAmount } from '@/utils/amounts'
import { markdown } from '@/utils/markdown'

@Component({
  name: 'recipient-registry',
  metaInfo() {
    return { title: 'Recipient registry' }
  },
  components: { Loader },
})
export default class RecipientRegistryView extends Vue {

  registryInfo: RegistryInfo | null = null
  requests: Request[] = []
  isLoading = true

  async created() {
    if (recipientRegistryType !== 'optimistic') {
      return
    }
    if (this.$store.state.recipientRegistryAddress === null) {
      const roundAddress = this.$store.state.currentRoundAddress || await getCurrentRound()
      const registryAddress = await getRecipientRegistryAddress(roundAddress)
      this.$store.commit(SET_RECIPIENT_REGISTRY_ADDRESS, registryAddress)
    }
    this.registryInfo = await getRegistryInfo(this.$store.state.recipientRegistryAddress)
    this.requests = await getRequests(this.$store.state.recipientRegistryAddress,  this.registryInfo)
    this.isLoading = false
  }

  formatAmount(value: BigNumber): string {
    return formatAmount(value, 18)
  }

  formatDuration(seconds: number): string {
    return humanizeDuration(seconds * 1000)
  }

  formatDate(date: DateTime): string {
    return date.toLocaleString(DateTime.DATETIME_SHORT)
  }

  renderDescription(request: Request): string {
    return markdown.render(request.metadata.description)
  }

  isPending(request: Request): boolean {
    return request.status === RequestStatus.Submitted
  }

  hasProjectLink(request: Request): boolean {
    return (
      request.type === RequestType.Registration &&
      [RequestStatus.Executed, RequestStatus.Accepted].includes(request.status)
    )
  }

  canSubmitProject(): boolean {
    return this.registryInfo !== null && this.$store.state.currentUser !== null
  }

  submitProject(): void {
    this.$modal.show(
      RecipientSubmissionModal,
      {
        registryAddress: this.$store.state.recipientRegistryAddress,
        registryInfo: this.registryInfo,
      },
      { width: 500 },
      {
        closed: async () => {
          if (this.registryInfo) {
            this.requests = await getRequests(
              this.$store.state.recipientRegistryAddress,
              this.registryInfo,
            )
          }
        },
      },
    )
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.submit-project {
  border-bottom: $border;
  border-top: $border;
  font-size: 16px;
  line-height: 150%;
  padding: $content-space * 1.5;
  text-align: center;

  .submit-project-info {
    margin: 0 auto;
  }

  button {
    margin: $content-space auto 0;
  }
}

h2 {
  font-weight: 400;
  margin: $content-space 0;
}

.requests {
  border: $border;
  border-spacing: 0;
  line-height: 150%;
  table-layout: fixed;
  width: 100%;

  thead {
    background-color: $bg-light-color;
  }

  tr {
    &:nth-child(2n) {
      background-color: $bg-secondary-color;
    }
  }

  th, td {
    overflow: hidden;
    padding: $content-space / 2;
    text-align: left;
    text-overflow: ellipsis;

    &:nth-child(1) {
      width: auto;
      word-wrap: break-word;
    }

    &:nth-child(n + 2) {
      width: 100px;
    }

    .project-name {
      font-weight: 600;
      margin-bottom: 10px;
    }

    .project-image {
      height: 1.2em;
      margin-right: 5px;
      vertical-align: middle;
    }

    .project-description ::v-deep {
      p, ul, ol {
        margin: 10px 0;
      }
    }

    .project-details {
      margin-top: 10px;
    }
  }
}

@media (max-width: 600px) {
  .requests th,
  .requests td {
    &:nth-child(n + 2) {
      width: auto;
    }
  }
}
</style>
