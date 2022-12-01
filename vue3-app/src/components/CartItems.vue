<template>
	<div>
		<div
			v-for="item in cartList"
			:key="item.id"
			class="cart-item"
			:class="{
				'new-cart-item': isNewOrUpdated(item) && hasUserContributed,
			}"
		>
			<div class="project">
				<links :to="{ name: 'project', params: { id: item.id } }">
					<img class="project-image" :src="item.thumbnailImageUrl" :alt="item.name" />
				</links>
				<links class="project-name" :to="{ name: 'project', params: { id: item.id } }">
					{{ item.name }}
				</links>
				<div class="remove-cart-item" @click="removeItem(item)">
					<div v-if="isEditMode" class="remove-icon-background">
						<img class="remove-icon" src="@/assets/remove.svg" aria-label="Remove project" />
					</div>
				</div>
				<div v-if="hasUserContributed && !isEditMode" class="contribution-form">
					{{ item.amount }} {{ tokenSymbol }}
				</div>
			</div>
			<div v-if="isEditMode" class="contribution-form">
				<input-button
					:value="item.amount"
					:input="{
						placeholder: 'Amount',
						class: `{ invalid: ${!isAmountValid(item.amount)} }`,
						disabled: !canUpdateAmount(),
					}"
					class="contribution-amount"
					@input="updateAmount(item, $event)"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DateTime } from 'luxon'
import { type CartItem, MAX_CONTRIBUTION_AMOUNT } from '@/api/contributions'
import { getTokenLogo } from '@/utils/tokens'
import Links from '@/components/Links.vue'
import InputButton from '@/components/InputButton.vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { currentRound, committedCart, hasUserContributed } = storeToRefs(appStore)

interface Props {
	cartList: CartItem[]
	isEditMode: boolean
	isAmountValid: (value: string) => boolean
}

const props = defineProps<Props>()

const tokenSymbol = computed(() => {
	const { nativeTokenSymbol } = currentRound.value!
	return nativeTokenSymbol
})

const tokenLogo = computed(() => {
	return getTokenLogo(tokenSymbol.value)
})

function canUpdateAmount(): boolean {
	return !!currentRound.value && DateTime.local() < currentRound.value.votingDeadline
}

function updateAmount(item: CartItem, amount: string): void {
	console.log('updateAmount', amount)
	const sanitizedAmount: string = sanitizeAmount(amount)
	appStore.updateCartItem({ ...item, amount: sanitizedAmount })
	appStore.saveCart()
}

function sanitizeAmount(amount: string): string {
	const MAX_DECIMAL_PLACES = 5
	// Extract only numbers or decimal points from amount string
	const cleanAmount: string = amount.replace(/[^0-9.]/g, '')
	// Find decimal point (if it exists)
	const decimalIndex: number = cleanAmount.indexOf('.')
	let newAmount: string
	if (decimalIndex === -1 || decimalIndex === cleanAmount.length - 1) {
		// If first decimal is either absent or last, return clean amount
		newAmount = cleanAmount
	} else {
		// Split up left and right of decimal point
		const leftOfDecimal: string = cleanAmount.substring(0, decimalIndex)
		const decimalString: string = cleanAmount.substring(decimalIndex)
		// Remove any remaining decimal points
		const decimalStringClean: string = decimalString.replace(/[.]/g, '')
		// Truncate decimal string to {MAX_DECIMAL_PLACES} digits
		const decimalStringToUse: string =
			decimalStringClean.length > MAX_DECIMAL_PLACES
				? decimalStringClean.substring(0, MAX_DECIMAL_PLACES)
				: decimalStringClean
		newAmount = `${leftOfDecimal}.${decimalStringToUse}`
	}
	if (parseFloat(newAmount) > MAX_CONTRIBUTION_AMOUNT) {
		return MAX_CONTRIBUTION_AMOUNT.toString()
	}
	return newAmount
}

function removeItem(item: CartItem): void {
	appStore.removeCartItem(item)
	appStore.saveCart()
}

function isNewOrUpdated(item: CartItem): boolean {
	const itemIndex = committedCart.value.findIndex(i => {
		return i.id === item.id && i.amount === item.amount
	})

	return itemIndex === -1
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.cart-item {
	padding: 1rem;
	background: var(--bg-light-color);
	border-bottom: 1px solid #000;
	&:last-of-type {
		border-bottom: none;
	}
}

.new-cart-item {
	padding: 1rem;
	background: rgba($clr-green, 0.2);
	border-bottom: 1px solid #000;
	&:last-of-type {
		border-bottom: none;
	}
}

.project {
	display: flex;
	flex-direction: row;
	align-items: center;
	cursor: pointer;

	.project-image {
		border-radius: 10px;
		box-sizing: border-box;
		display: block;
		height: 2.5rem;
		margin-right: 15px;
		width: 2.5rem;
		object-fit: cover;
		width: 2.5rem;
		&:hover {
			opacity: 0.8;
			transform: scale(1.01);
		}
	}

	.project-name {
		align-self: center;
		color: var(--text-color);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		flex-grow: 1;
		max-height: 2.5rem;
		overflow: hidden;
		font-weight: 600;
		text-overflow: ellipsis;
		&:hover {
			opacity: 0.8;
			transform: scale(1.01);
		}
	}
}

.contribution-form {
	align-items: center;
	display: flex;
	flex-direction: column;
	font-size: 16px;
	padding-left: 3.5rem;
	margin-top: 0.5rem;
	gap: 0.5rem;
	flex-shrink: 0;
}

.remove-cart-item {
	cursor: pointer;

	&:hover {
		opacity: 0.8;
		transform: scale(1.01);
	}

	.remove-icon {
		width: 1.5rem;
		height: 1.5rem;
	}

	.remove-icon-background {
		padding: 0.5rem;
		&:hover {
			background: var(--bg-secondary-color);
			border-radius: 0.5rem;
		}
		cursor: pointer;
	}
}
</style>
