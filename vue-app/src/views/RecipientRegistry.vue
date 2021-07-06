<template>
  <div class="recipients">
    <div v-if="isRecipientRegistryOwner">
      <!-- <h1 class="content-heading">Recipient registry</h1> -->
      <div class="title">
        <div class="header">
          <h2>Recipient registry</h2>
        </div>
        <div class="hr" />
      </div>
      <loader v-if="isLoading" />
      <div v-else>
        <table class="requests">
          <thead>
            <tr>
              <th>Project</th>
              <th>Request type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="request in requests.slice().reverse()"
              :key="request.transactionHash"
            >
              <td>
                <div class="project-name">
                  <a
                    :href="request.metadata.thumbnailImageUrl"
                    target="_blank"
                    rel="noopener"
                  >
                    <img
                      class="project-image"
                      :src="request.metadata.thumbnailImageUrl"
                    />
                  </a>
                  {{ request.metadata.name }}
                  <router-link
                    v-if="hasProjectLink(request)"
                    :to="{
                      name: 'project',
                      params: { id: request.recipientId },
                    }"
                    >-></router-link
                  >
                </div>
                <details class="project-details">
                  <summary>More</summary>

                  <div>
                    <span
                      >Transaction hash
                      <img class="icon" width="16px" src="@/assets/copy.svg"
                    /></span>
                    <code>{{ request.transactionHash }}</code>
                  </div>
                  <div>
                    <span
                      >Project ID
                      <img class="icon" width="16px" src="@/assets/copy.svg"
                    /></span>
                    <code>{{ request.recipientId }}</code>
                  </div>
                  <div>
                    <span
                      >Recipient address
                      <img class="icon" width="16px" src="@/assets/copy.svg"
                    /></span>
                    <code>{{ request.recipient }}</code>
                  </div>
                </details>
              </td>
              <td>{{ request.type }}</td>
              <td>
                <template v-if="hasProjectLink(request)">
                  <router-link
                    :to="{
                      name: 'project',
                      params: { id: request.recipientId },
                    }"
                  >
                    {{ request.status }}
                  </router-link>
                </template>
                <template v-else>
                  {{ request.status }}
                </template>
              </td>
              <td class="actions">
                <div
                  class="btn-warning"
                  @click="remove(request)"
                  v-if="isExecuted(request)"
                >
                  Remove
                </div>
                <div
                  class="icon-btn-approve"
                  @click="approve(request)"
                  v-if="isPending(request)"
                >
                  <img src="@/assets/checkmark.svg" />
                </div>
                <div
                  class="icon-btn-reject"
                  @click="reject(request)"
                  v-if="isPending(request)"
                >
                  <img src="@/assets/close.svg" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else>
      <div style="font-size: 64px" aria-label="hand">🤚</div>
      <h2>
        You must be the recipient registry contract owner to access this page
      </h2>
      <div v-if="!isUserConnected">
        <h2>Please connect your wallet.</h2>
      </div>
    </div>
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
  registerProject,
  rejectProject,
  removeProject,
} from '@/api/recipient-registry-optimistic'
import { getCurrentRound } from '@/api/round'
import Loader from '@/components/Loader.vue'
import { SET_RECIPIENT_REGISTRY_ADDRESS } from '@/store/mutation-types'
import { formatAmount } from '@/utils/amounts'
import { isSameAddress } from '@/utils/accounts'
import { markdown } from '@/utils/markdown'
import { waitForTransaction } from '@/utils/contracts'

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
    // TODO fetch/read this data from the store vs. storing in component state
    if (this.$store.state.recipientRegistryAddress === null) {
      // this.$store.dispatch(LOAD_RECIPIENT_REGISTRY_INFO)
      const roundAddress =
        this.$store.state.currentRoundAddress || (await getCurrentRound())
      const registryAddress = await getRecipientRegistryAddress(roundAddress)
      this.$store.commit(SET_RECIPIENT_REGISTRY_ADDRESS, registryAddress)
    }
    this.registryInfo = await getRegistryInfo(
      this.$store.state.recipientRegistryAddress
    )
    this.requests = await getRequests(
      this.$store.state.recipientRegistryAddress,
      this.registryInfo
    )
    this.isLoading = false
  }

  get isUserConnected(): boolean {
    return !!this.$store.state.currentUser
  }

  get isRecipientRegistryOwner(): boolean {
    return (
      this.isUserConnected &&
      !!this.registryInfo &&
      isSameAddress(
        this.$store.state.currentUser.walletAddress,
        this.registryInfo.owner
      )
    )
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

  isRejected(request: Request): boolean {
    return request.status === RequestStatus.Rejected
  }

  isExecuted(request: Request): boolean {
    return request.status === RequestStatus.Executed
  }

  hasProjectLink(request: Request): boolean {
    return (
      request.type === RequestType.Registration &&
      request.status === RequestStatus.Executed
    )
  }

  async approve(request: Request): Promise<void> {
    const { recipientRegistryAddress, currentUser } = this.$store.state
    const signer = currentUser.walletProvider.getSigner()

    try {
      await waitForTransaction(
        registerProject(recipientRegistryAddress, request.recipientId, signer)
      )
      if (this.registryInfo) {
        this.requests = await getRequests(
          this.$store.state.recipientRegistryAddress,
          this.registryInfo
        )
      }
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.warn(error.message)
    }
  }

  async reject(request: Request): Promise<void> {
    const { recipientRegistryAddress, currentUser } = this.$store.state
    const signer = currentUser.walletProvider.getSigner()

    try {
      await waitForTransaction(
        rejectProject(
          recipientRegistryAddress,
          request.recipientId,
          request.recipient,
          signer
        )
      )
      if (this.registryInfo) {
        this.requests = await getRequests(
          this.$store.state.recipientRegistryAddress,
          this.registryInfo
        )
      }
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.warn(error.message)
    }
  }

  async remove(request: Request): Promise<void> {
    const { recipientRegistryAddress, currentUser } = this.$store.state
    const signer = currentUser.walletProvider.getSigner()

    try {
      await waitForTransaction(
        removeProject(recipientRegistryAddress, request.recipientId, signer)
      )
      if (this.registryInfo) {
        this.requests = await getRequests(
          this.$store.state.recipientRegistryAddress,
          this.registryInfo
        )
      }
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.warn(error.message)
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.title {
  display: grid;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-right: auto;
    h2 {
      line-height: 130%;
      margin: 0;
    }
  }

  .hr {
    width: 100%;
    border-bottom: 1px solid rgba(115, 117, 166, 1);
  }
}

.requests {
  border: 1px solid #000;
  border-radius: 0.5rem;
  border-spacing: 0;
  line-height: 150%;
  table-layout: fixed;
  width: 100%;
  background-color: $bg-light-color;

  thead {
    background-color: $bg-primary-color;
    border-radius: 6px;
  }

  tr {
    &:nth-child(2n) {
      background-color: $bg-secondary-color;
    }
  }

  th,
  td {
    overflow: hidden;
    padding: $content-space / 2;
    text-align: left;
    text-overflow: ellipsis;

    &:nth-child(1) {
      width: 25%;
      word-wrap: break-word;
    }

    &.actions {
      display: flex;
    }

    .project-name {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .project-image {
      height: 1rem;
      margin-right: 0.25rem;
      vertical-align: middle;
    }

    .project-details {
      margin-top: 0.5rem;
      font-size: 14px;
      margin-left: 0.5rem;

      div {
        margin: 0.5rem 0;
        font-weight: 500;
        margin-left: 1rem;
      }
    }
  }

  .icon-btn-approve {
    line-height: 0;
    margin: 0;
    border-radius: 0.5rem;
    width: 1rem;
    height: 1rem;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid $bg-light-color;
    background: $clr-green-bg600;
    cursor: pointer;
    &:hover {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  .icon-btn-reject {
    line-height: 0;
    margin: 0;
    border-radius: 0.5rem;
    width: 1rem;
    height: 1rem;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid $bg-light-color;
    background: $error-color;
    cursor: pointer;
    &:hover {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  .btn-row {
    display: flex;
    gap: 0.5rem;
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
