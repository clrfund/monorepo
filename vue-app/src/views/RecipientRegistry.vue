<template>
  <div class="recipients">
    <div class="title">
      <div class="header">
        <h2>{{ $t('recipientRegistry.h2') }}</h2>
      </div>
      <div class="hr" />
    </div>
    <loader v-if="isLoading" />
    <div v-else>
      <button v-if="hasPendingRequests" class="btn-secondary desktop btn-export" @click="handleExport">
        Export pending submissions
      </button>
      <table class="requests">
        <thead>
          <tr>
            <th>{{ $t('recipientRegistry.th1') }}</th>
            <th>{{ $t('recipientRegistry.th2') }}</th>
            <th>{{ $t('recipientRegistry.th3') }}</th>
            <th>{{ $t('recipientRegistry.th4') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in requests.slice().reverse()" :key="request.recipientId">
            <td>
              <div class="project-name">
                <links v-if="request.metadata.thumbnailImageUrl" :to="request.metadata.thumbnailImageUrl">
                  <img class="project-image" :src="request.metadata.thumbnailImageUrl" />
                </links>
                {{ request.metadata.name }}
                <links
                  v-if="hasProjectLink(request)"
                  :to="{
                    name: 'project',
                    params: { id: request.recipientId },
                  }"
                  >-></links
                >
                <links
                  v-else
                  :to="{
                    name: 'recipient-profile',
                    params: { id: request.recipientId },
                  }"
                  >-></links
                >
              </div>
              <details class="project-details">
                <summary>{{ $t('recipientRegistry.summary') }}</summary>

                <div>
                  <div class="btn-row">
                    {{ $t('recipientRegistry.div1') }}
                    <copy-button
                      :value="request.transactionHash"
                      :text="$t('recipientRegistry.btn1')"
                      myClass="inline copy-icon"
                    />
                  </div>
                  <code>{{ request.transactionHash }}</code>
                </div>
                <div>
                  <div class="btn-row">
                    {{ $t('recipientRegistry.div2') }}
                    <copy-button
                      :value="request.recipientId"
                      :text="$t('recipientRegistry.btn2')"
                      myClass="inline
                    copy-icon"
                    />
                  </div>
                  <code>{{ request.recipientId }}</code>
                </div>
                <div>
                  <div class="btn-row">
                    {{ $t('recipientRegistry.div3') }}
                    <copy-button :value="request.recipient" :text="$t('recipientRegistry.btn3')" myClass="copy-icon" />
                  </div>
                  <code>{{ request.recipient }}</code>
                </div>
              </details>
            </td>
            <td>{{ request.type }}</td>
            <td>
              <template v-if="hasProjectLink(request)">
                <links
                  :to="{
                    name: 'project',
                    params: { id: request.recipientId },
                  }"
                >
                  {{ request.status }}
                </links>
              </template>
              <template v-else>
                {{ request.status }}
              </template>
            </td>
            <td>
              <div class="actions" v-if="isUserConnected">
                <!-- TODO: to implement this feature, it requires to send a baseDeposit (see contract)
              <div
                class="btn-warning"
                @click="remove(request)"
                v-if="isExecuted(request)"
              >
                Remove
              </div> -->
                <div
                  class="icon-btn-approve"
                  v-if="(isOwner && isPending(request)) || isAccepted(request)"
                  @click="approve(request)"
                >
                  <img src="@/assets/checkmark.svg" />
                </div>
                <div class="icon-btn-reject" v-if="isOwner && isPending(request)" @click="reject(request)">
                  <img src="@/assets/close.svg" />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CopyButton from '@/components/CopyButton.vue'

import { chainId, exportBatchSize, recipientRegistryType } from '@/api/core'
import {
  RequestType,
  RequestStatus,
  type Request,
  getRequests,
  registerProject,
  rejectProject,
} from '@/api/recipient-registry-optimistic'
import Loader from '@/components/Loader.vue'
import Links from '@/components/Links.vue'
import TransactionModal from '@/components/TransactionModal.vue'
import { useUserStore, useRecipientStore } from '@/stores'
import { storeToRefs } from 'pinia'
import type { TransactionResponse } from '@ethersproject/abstract-provider'
import { useModal } from 'vue-final-modal'
import { showError } from '@/utils/modal'

const recipientStore = useRecipientStore()
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const { isRecipientRegistryOwner, recipientRegistryInfo, recipientRegistryAddress } = storeToRefs(recipientStore)
const requests = ref<Request[]>([])
const isLoading = ref(true)
const isOwner = computed(() => isRecipientRegistryOwner.value)
const isUserConnected = computed(() => !!currentUser.value)
const hasPendingRequests = computed(() => {
  const pendingRequests = requests.value.filter(req => isPending(req))
  return pendingRequests.length > 0
})

onMounted(async () => {
  if (recipientRegistryType !== 'optimistic') {
    return
  }

  await recipientStore.loadRecipientRegistryInfo()
  await loadRequests()
  isLoading.value = false
})

async function loadRequests() {
  const _requests = await getRequests(recipientRegistryInfo.value!, recipientRegistryAddress.value!)
  requests.value = _requests.filter(req => Boolean(req.requester))
}

function isPending(request: Request): boolean {
  return request.status === RequestStatus.Submitted
}

function isAccepted(request: Request): boolean {
  return request.status === RequestStatus.Accepted
}

function isRejected(request: Request): boolean {
  return request.status === RequestStatus.Rejected
}

function isExecuted(request: Request): boolean {
  return request.status === RequestStatus.Executed
}

function isPendingRemoval(request: Request): boolean {
  return request.status === RequestStatus.PendingRemoval
}

function hasProjectLink(request: Request): boolean {
  return isExecuted(request) || isPendingRemoval(request)
}

async function approve(request: Request): Promise<void> {
  await waitForTransactionAndLoad(
    registerProject(recipientRegistryAddress.value!, request.recipientId, userStore.signer),
  )
}

async function reject(request: Request): Promise<void> {
  await waitForTransactionAndLoad(
    rejectProject(recipientRegistryAddress.value!, request.recipientId, request.requester, userStore.signer),
  )
}

async function waitForTransactionAndLoad(transaction: Promise<TransactionResponse>) {
  const { open, close } = useModal({
    component: TransactionModal,
    attrs: {
      onTxSuccess: async () => {
        // TODO: this is not ideal. Leaving as is, just because it is an admin
        // page where no end user is using. We are forcing this 2s time to give
        // time the subgraph to index the new state from the tx. Perhaps we could
        // avoid querying the subgraph and query directly the chain to get the
        // request state.
        try {
          await new Promise(resolve => {
            setTimeout(async () => {
              await loadRequests()
              resolve(true)
            }, 2000)
          })
        } catch (err) {
          showError((err as Error).message)
        }
      },
      transaction,
      onClose() {
        close()
      },
    },
  })

  open()
}

function handleExport(): void {
  const pendingRequests = requests.value.filter(req => isPending(req))

  let count = 1
  for (let i = 0; i < pendingRequests.length; i = i + exportBatchSize) {
    const end = i + exportBatchSize
    const chunk = pendingRequests.slice(i, end)
    const url = createExportUrl(chunk)
    const filename = `pending-submission-${count}.json`
    exportFile(url, filename)
    count++
  }
}

const challengeRequestAbi = computed(() => {
  return {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_recipientId',
        type: 'bytes32',
      },
      {
        internalType: 'address payable',
        name: '_beneficiary',
        type: 'address',
      },
    ],
    name: 'challengeRequest',
    payable: false,
  }
})

function createExportUrl(requests: Request[]): string {
  const transactions = requests.map(req => {
    return {
      to: recipientRegistryAddress.value,
      value: '0',
      data: null,
      contractMethod: challengeRequestAbi.value,
      contractInputsValues: {
        _recipientId: req.recipientId,
        _beneficiary: req.requester,
      },
    }
  })

  const data = {
    version: '1.0',
    chainId,
    createdAt: Date.now(),
    meta: {
      name: 'Pending Submissions',
      txBuilderVersion: '1.11.1',
    },
    transactions,
  }

  return 'data:application/json,' + encodeURIComponent(JSON.stringify(data))
}

function exportFile(url: string, filename: string): void {
  const anchor = document.createElement('a')
  anchor.setAttribute('href', url)
  anchor.setAttribute('download', filename)
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
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
  padding-bottom: 0 !important;

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
    border-bottom: 1px solid var(--brand-tertiary);
  }
}

.requests {
  border: 1px solid var(--border-strong);
  border-radius: 0.5rem;
  border-spacing: 0;
  line-height: 150%;
  table-layout: fixed;
  width: 100%;
  background-color: var(--bg-light-color);

  thead {
    background-color: var(--bg-secondary-color);
    border-radius: 6px;
  }

  tr {
    &:nth-child(2n) {
      background-color: var(--bg-secondary-color);
    }
  }

  th,
  td {
    overflow: hidden;
    padding: calc($content-space / 2);
    text-align: left;
    text-overflow: ellipsis;

    &:nth-child(1) {
      width: 25%;
      word-wrap: break-word;
    }

    .actions {
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
        div {
          margin: 0;
        }
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
    border: 1px solid var(--bg-light-color);
    background: rgba($clr-green, 0.6);
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
    border: 1px solid var(--bg-light-color);
    background: var(--error-color);
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

.btn-export {
  max-width: fit-content;
}
</style>
