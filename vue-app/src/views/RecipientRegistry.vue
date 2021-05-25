<template>
  <div class="recipients">
    <div v-if="currentUser && isDeployerAddress">
    <h1 class="content-heading">Recipient registry</h1>
    <!-- <div v-if="registryInfo" class="submit-project">
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
    </div> -->
    <loader v-if="isLoading"/>
    <h2 v-if="requests.length > 0">Projects</h2>
    <table v-if="requests.length > 0" class="requests">
      <thead>
        <tr>
          <th>Project</th>
          <th>Automatic acceptance date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="request in requests.slice().reverse()" :key="request.transactionHash">
          <td>
            <div class="project-name">
              <a :href="request.metadata.thumbnailImageUrl" target="_blank" rel="noopener">
                <img class="project-image" :src="request.metadata.thumbnailImageUrl">
              </a>
              {{ request.metadata.name }} <router-link
                :to="{ name: 'project', params: { id: request.recipientId }}"
              >-></router-link>
            </div>
            <!-- <div class="project-description" v-html="renderDescription(request)"></div> -->
            <details class="project-details">
              <summary>More</summary>
              
              <div><span>Transaction <img class="icon" width="16px" src="@/assets/copy.svg" /></span> <code>{{ request.transactionHash }}</code></div>
              <div><span>Project ID <img class="icon" width="16px" src="@/assets/copy.svg" /></span> <code>{{ request.recipientId }}</code></div>
              <div><span>Recipient address <img class="icon" width="16px" src="@/assets/copy.svg" /></span> <code>{{ request.recipient }}</code></div>
              <!-- <div v-if="isPending(request)">Acceptance date: {{ formatDate(request.acceptanceDate) }}</div> -->
            </details>
          </td>
          <!-- <td>{{ request.type }}</td> -->
          <td>
            <div v-if="isPending(request)">{{ formatDate(request.acceptanceDate) }}</div>
            <div v-if="!isPending(request)">Challenge period over</div>
          </td> 
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
          <td>
            <div v-if="$store.getters.canAdminDecide && $store.getters.isAccepted" class="btn-secondary">
              Add to round
            </div>
            <div v-if="$store.getters.isLive" class="btn-warning">
              Remove
            </div>
          </td>
          <td v-if="$store.getters.canAdminDecide" class="btn-row">
            <div 
              class="icon-btn-approve"
              @click="register()"
              v-if="$store.getters.isPending && !$store.getters.isAccepted && !$store.getters.isRejected"
            >
              <img src="@/assets/checkmark.svg" />
            </div>
            <div 
              class="icon-btn-reject"
              v-if="$store.getters.isPending && !$store.getters.isAccepted && !$store.getters.isRejected"
            >
              <img src="@/assets/close.svg" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
    <div v-else>
      <div style="font-size: 64px;" aria-label="hand">🤚</div>
      <h2>Important ETH2 CLR business, EF-employees only!</h2>
      <router-link class="btn-primary" to="/projects">Back to projects</router-link>
      <table v-if="requests.length > 0" class="requests">
      <thead>
        <tr>
          <th>Project</th>
          <th>Time left</th>
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
            <!-- <div class="project-description" v-html="renderDescription(request)"></div> -->
            <details class="project-details">
              <summary>Additional info</summary>
              <div>Transaction: <code>{{ request.transactionHash }}</code></div>
              <div>Project ID: <code>{{ request.recipientId }}</code></div>
              <div>Recipient address: <code>{{ request.recipient }}</code></div>
              <div v-if="isPending(request)">Acceptance date: {{ formatDate(request.acceptanceDate) }}</div>
            </details>
          </td>
          <!-- <td>{{ request.type }}</td> -->
          <td> countdown</td> 
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
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { BigNumber } from 'ethers'
import * as humanizeDuration from 'humanize-duration'
import { DateTime } from 'luxon'
import { recipientRegistryType } from '@/api/core'
import { Project, getRecipientRegistryAddress, getProject } from '@/api/projects'
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
import RecipientRegistrationModal from '@/components/RecipientRegistrationModal.vue'

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
  currentUser = true
  isDeployerAddress = true
  project: Project | null = null
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

  isAccepted(request: Request): boolean {
    return request.status === RequestStatus.Accepted
  }

  isExecuted(request: Request): boolean {
    return request.status === RequestStatus.Executed
  }

  hasProjectLink(request: Request): boolean {
    return (
      request.type === RequestType.Registration &&
      [RequestStatus.Executed, RequestStatus.Accepted].includes(request.status)
    )
  }

  hasRegisterBtn(): boolean {
    if (this.project === null) {
      return false
    }
    if (recipientRegistryType === 'optimistic') {
      return this.project.index === 0
    }
    return false
  }

  canRegister(): boolean {
    return this.hasRegisterBtn() && this.$store.state.currentUser
  }

  register() {
    this.$modal.show(
      RecipientRegistrationModal,
      { project: this.project },
      { },
      {
        closed: async () => {
          const project = await getProject(
            this.$store.state.recipientRegistryAddress,
            this.$route.params.id,
          )
          Object.assign(this.project, project)
        },
      },
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
@import '../styles/theme';

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
  border: 1px solid  #000;
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

  th, td {
    overflow: hidden;
    padding: $content-space / 2;
    text-align: left;
    text-overflow: ellipsis;
    

    &:nth-child(1) {
      width: 25%;
      word-wrap: break-word;
    }

    &:nth-child(n + 2) {
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

    .project-description ::v-deep {
      p, ul, ol {
        margin: 0.5rem 0;
      }
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
