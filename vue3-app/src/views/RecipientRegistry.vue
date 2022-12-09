<template>
	<div class="recipients">
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
					<tr v-for="request in requests.slice().reverse()" :key="request.transactionHash">
						<td>
							<div class="project-name">
								<links :to="request.metadata.imageUrl">
									<img class="project-image" :src="request.metadata.imageUrl" />
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
							</div>
							<details class="project-details">
								<summary>More</summary>

								<div>
									<div class="btn-row">
										Transaction hash
										<copy-button
											:value="request.transactionHash"
											text="hash"
											my-class="inline copy-icon"
										/>
									</div>
									<code>{{ request.transactionHash }}</code>
								</div>
								<div>
									<div class="btn-row">
										Project ID
										<copy-button
											:value="request.recipientId"
											text="id"
											my-class="inline copy-icon"
										/>
									</div>
									<code>{{ request.recipientId }}</code>
								</div>
								<div>
									<div class="btn-row">
										Recipient address
										<copy-button :value="request.recipient" text="address" my-class="copy-icon" />
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
							<div v-if="isUserConnected" class="actions">
								<!-- TODO: to implement this feature, it requires to send a baseDeposit (see contract)
              <div
                class="btn-warning"
                @click="remove(request)"
                v-if="isExecuted(request)"
              >
                Remove
              </div> -->
								<div
									v-if="(isOwner && isPending(request)) || isAccepted(request)"
									class="icon-btn-approve"
									@click="approve(request)"
								>
									<img src="@/assets/checkmark.svg" />
								</div>
								<div
									v-if="isOwner && (isPending(request) || isAccepted(request))"
									class="icon-btn-reject"
									@click="reject(request)"
								>
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
import type { BigNumber, Transaction } from 'ethers'
import humanizeDuration from 'humanize-duration'
import { DateTime } from 'luxon'
import CopyButton from '@/components/CopyButton.vue'

import { recipientRegistryType } from '@/api/core'
import {
	RequestType,
	RequestStatus,
	type Request,
	getRequests,
	registerProject,
	rejectProject,
	removeProject,
} from '@/api/recipient-registry-optimistic'
import Loader from '@/components/Loader.vue'
import Links from '@/components/Links.vue'
import { formatAmount as _formatAmount } from '@/utils/amounts'
import { markdown } from '@/utils/markdown'
import TransactionModal from '@/components/TransactionModal.vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { useEthers } from 'vue-dapp'
import { $vfm } from 'vue-final-modal'

const { signer } = useEthers()
const appStore = useAppStore()
const { isRecipientRegistryOwner, recipientRegistryInfo, recipientRegistryAddress, currentUser } = storeToRefs(appStore)

const requests = ref<Request[]>([])
const isLoading = ref(true)
const isOwner = computed(() => isRecipientRegistryOwner.value)
const registryInfo = computed(() => recipientRegistryInfo.value)
const isUserConnected = computed(() => !!currentUser.value)

onMounted(async () => {
	if (recipientRegistryType !== 'optimistic') {
		return
	}

	await appStore.loadRecipientRegistryInfo()
	await loadRequests()
	isLoading.value = false
})

async function loadRequests() {
	requests.value = await getRequests(recipientRegistryInfo.value!, recipientRegistryAddress.value!)
}

function formatAmount(value: BigNumber): string {
	return _formatAmount(value, 18)
}

function formatDuration(seconds: number): string {
	return humanizeDuration(seconds * 1000)
}

function formatDate(date: DateTime): string {
	return date.toLocaleString(DateTime.DATETIME_SHORT)
}

function renderDescription(request: Request): string {
	return markdown.render(request.metadata.description)
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

function hasProjectLink(request: Request): boolean {
	return request.type === RequestType.Registration && request.status === RequestStatus.Executed
}

async function approve(request: Request): Promise<void> {
	await waitForTransactionAndLoad(
		registerProject(recipientRegistryAddress.value!, request.recipientId, signer.value!),
	)
}

async function reject(request: Request): Promise<void> {
	await waitForTransactionAndLoad(
		rejectProject(recipientRegistryAddress.value!, request.recipientId, request.requester, signer.value!),
	)
}

async function remove(request: Request): Promise<void> {
	await waitForTransactionAndLoad(removeProject(recipientRegistryAddress.value!, request.recipientId, signer.value!))
}

async function waitForTransactionAndLoad(transaction: any) {
	$vfm.show(
		{
			component: TransactionModal,
			bind: {
				onTxSuccess: async () => {
					// TODO: this is not ideal. Leaving as is, just because it is an admin
					// page where no end user is using. We are forcing this 2s time to give
					// time the subgraph to index the new state from the tx. Perhaps we could
					// avoid querying the subgraph and query directly the chain to get the
					// request state.
					await new Promise(resolve => {
						setTimeout(async () => {
							await loadRequests()
							resolve(true)
						}, 2000)
					})
				},
			},
		},
		transaction,
	)
}

async function copyAddress(text: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(text)
	} catch (error) {
		/* eslint-disable-next-line no-console */
		console.warn('Error in copying text: ', error)
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
		border-bottom: 1px solid $border-light;
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
		background-color: var(--bg-primary-color);
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
</style>
