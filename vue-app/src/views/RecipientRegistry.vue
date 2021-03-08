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
    <h2 v-if="requests.length > 0">Recent changes</h2>
    <table v-if="requests.length > 0" class="requests">
      <thead>
        <tr>
          <th>ID</th>
          <th>Project</th>
          <th>Type</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="request in requests.slice().reverse()" :key="request.id">
          <td>{{ request.id }}</td>
          <td>
            <div class="project-name">{{ request.name }}</div>
            <div class="project-description">{{ request.description }}</div>
            <a class="project-image-link" :href="request.imageUrl" target="_blank" rel="noopener">{{ request.imageUrl }}</a>
          </td>
          <td>{{ request.type }}</td>
          <td>{{ request.status }}</td>
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

import { recipientRegistryType } from '@/api/core'
import { getRecipientRegistryAddress } from '@/api/projects'
import {
  RegistryInfo,
  Request,
  getRegistryInfo,
  getRequests,
} from '@/api/recipient-registry-optimistic'
import RecipientSubmissionModal from '@/components/RecipientSubmissionModal.vue'
import { formatAmount } from '@/utils/amounts'

@Component({
  name: 'recipient-registry',
  metaInfo() {
    return { title: 'Recipient registry' }
  },
})
export default class RecipientRegistryView extends Vue {

  registryAddress: string | null = null
  registryInfo: RegistryInfo | null = null
  requests: Request[] = []

  async created() {
    if (recipientRegistryType !== 'optimistic') {
      return
    }
    this.registryAddress = await getRecipientRegistryAddress()
    this.registryInfo = await getRegistryInfo(this.registryAddress)
    this.requests = await getRequests(this.registryAddress)
  }

  formatAmount(value: BigNumber): string {
    return formatAmount(value, 18)
  }

  formatDuration(value: number): string {
    return humanizeDuration(value * 1000)
  }

  canSubmitProject(): boolean {
    return this.registryInfo !== null && this.$store.state.currentUser !== null
  }

  submitProject(): void {
    this.$modal.show(
      RecipientSubmissionModal,
      {
        registryAddress: this.registryAddress,
        registryInfo: this.registryInfo,
      },
      { width: 500 },
      {
        closed: async () => {
          if (this.registryAddress) {
            this.requests = await getRequests(this.registryAddress)
          }
        },
      },
    )
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.content-heading {
  border-bottom: $border;
}

.submit-project {
  border-bottom: $border;
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
    width: 80px;

    &:nth-child(2) {
      width: auto;
      word-wrap: break-word;
    }

    .project-name {
      font-weight: 600;
      margin-bottom: 10px;
    }
  }
}

@media (max-width: 600px) {
  .requests th,
  .requests td {
    width: auto;
  }
}
</style>
