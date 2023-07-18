<template>
  <div class="h100">
    <loader v-if="!isAppReady"></loader>
    <div v-else-if="!currentRound" class="empty-cart">
      <div class="moon-emoji">🌚</div>
      <h3>{{ $t('roundInfo.div21') }}</h3>
    </div>
    <div v-else-if="!currentUser" class="empty-cart">
      <div class="moon-emoji">🌚</div>
      <h3>{{ $t('cart.h3_1') }}</h3>
      <button @click="promptConnection" class="btn-action">{{ $t('cart.connect') }}</button>
    </div>
    <loader v-else-if="isLoading"></loader>
    <div v-else-if="!currentUser.encryptionKey">
      <div class="empty-cart">
        <div class="moon-emoji">🌚</div>
        <h3>{{ $t('cart.sign_the_message_to_see_your_cart') }}</h3>
        <button @click="promptSignagure" class="btn-action">{{ $t('cart.sign') }}</button>
      </div>
    </div>
    <div v-else class="cart-container">
      <div class="reallocation-message" v-if="canUserReallocate && hasUserVoted">
        {{ $t('cart.div1') }}
        <links to="/about/maci" class="message-link"> {{ $t('cart.link1') }}</links>
      </div>
      <div class="reallocation-message" v-if="canUserReallocate && !hasUserVoted">
        {{ $t('cart.div2') }}
      </div>
      <div class="flex cart-title-bar">
        <div v-if="showCollapseCart" @click="toggleCart" class="absolute-left cart-btn">
          <img alt="cart" width="16" src="@/assets/cart.svg" />
          <img alt="close" width="16" src="@/assets/chevron-right.svg" />
        </div>
        <h2>{{ isEditMode ? $t('cart.h2_1') : $t('cart.h2_2') }}</h2>
        <div v-if="(isRoundContributionPhase || canUserReallocate) && !isCartEmpty" class="absolute-right dropdown">
          <img @click="openDropdown" class="dropdown-btn" src="@/assets/more.svg" />
          <div id="cart-dropdown" class="button-menu">
            <div
              v-for="({ callback, text, icon, cssClass }, idx) of dropdownItems"
              :key="idx"
              class="dropdown-item"
              @click="callback"
            >
              <img width="16" :class="cssClass" :src="getAssetsUrl(icon)" />
              <p>{{ text }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="messages-and-cart-items">
        <div class="reallocation-intro" v-if="hasUserContributed && hasReallocationPhaseEnded">
          {{ $t('cart.div3') }}
        </div>
        <div class="cart">
          <div v-if="!hasUserContributed && hasContributionPhaseEnded" class="empty-cart">
            <div class="moon-emoji">🌚</div>
            <h3>{{ $t('cart.h3_2') }}</h3>
            <div>{{ $t('cart.div4') }}</div>
          </div>
          <div v-else-if="isCartEmpty && isRoundContributionPhase" class="empty-cart">
            <div class="moon-emoji">🌚</div>
            <h3>{{ $t('cart.h3_3') }}</h3>
            <div>{{ $t('cart.div5') }}</div>
            <links to="/projects" class="btn-secondary mobile mt1">{{ $t('cart.link2') }}</links>
          </div>
          <div v-else-if="canUserReallocate && !isCartEmpty">
            <div class="flex-row-reallocation">
              <div class="semi-bold">
                {{ isEditMode ? $t('cart.edit1') : $t('cart.edit2') }}
              </div>
              <div class="semi-bold" v-if="canUserReallocate">
                <button @click="handleEditState" class="pointer">
                  {{ isEditMode ? $t('cart.edit3') : $t('cart.edit4') }}
                </button>
              </div>
            </div>
          </div>
          <div v-else-if="hasUserContributed" class="flex-row-reallocation" id="readOnly">
            <!-- Round is finalized -->
            <div>{{ $t('cart.div6') }}</div>
          </div>
          <cart-items
            v-if="hasUserContributed || !hasContributionPhaseEnded"
            :cartList="filteredCart"
            :isEditMode="isEditMode"
            :isAmountValid="isAmountValid"
          />
        </div>
        <div
          v-if="(canUserReallocate && !isEditMode) || (isRoundContributionPhase && !canUserReallocate)"
          class="time-left-read-only"
        >
          <div class="caps">{{ $t('cart.div7') }}</div>
          <time-left :date="timeLeftDate" />
        </div>
      </div>
      <div class="reallocation-section" v-if="canUserReallocate && isEditMode">
        <div class="reallocation-row">
          <span>{{ $t('cart.span1') }}</span>
          {{ formatAmount(contribution) }} {{ tokenSymbol }}
        </div>
        <div :class="isGreaterThanInitialContribution() ? 'reallocation-row-warning' : 'reallocation-row'">
          <span>{{ $t('cart.span2') }}</span>
          <div class="reallocation-warning">
            <span v-if="isGreaterThanInitialContribution()">⚠️</span>{{ formatAmount(getCartTotal(cart)) }}
            {{ tokenSymbol }}
          </div>
        </div>
        <div v-if="hasUnallocatedFunds()" class="reallocation-row-matching-pool">
          <div>
            <div>
              <b>{{ $t('cart.div8') }}</b>
            </div>
            <div>{{ $t('cart.div9') }}</div>
          </div>
          + {{ formatAmount(contribution.sub(getTotal())) }}
          {{ tokenSymbol }}
        </div>
        <div
          @click="splitContributionsEvenly"
          class="split-link"
          v-if="isGreaterThanInitialContribution() || hasUnallocatedFunds()"
        >
          <img src="@/assets/split.svg" />
          {{
            $t('cart.div10', {
              contribution: formatAmount(contribution),
              tokenSymbol: tokenSymbol,
            })
          }}
        </div>
      </div>
      <div class="submit-btn-wrapper" v-if="canWithdrawContribution && cart.length >= 1">
        <button class="btn-action" @click="openWithdrawalModal()">
          {{
            $t('cart.button1', {
              contribution: formatAmount(contribution),
              tokenSymbol: tokenSymbol,
            })
          }}
        </button>
      </div>
      <div
        class="submit-btn-wrapper"
        v-if="
          ((canUserReallocate && isEditMode) || (!canUserReallocate && isRoundContributionPhase) || !hasUserVoted) &&
          cart.length >= 1
        "
      >
        <div v-if="errorMessage" class="error-title">
          {{ $t('cart.div11') }}
          <span v-if="canUserReallocate">{{ $t('cart.div11_if2') }}</span>
          <span v-else>{{ $t('cart.div11_if3') }}</span>
        </div>
        <div v-if="errorMessage" class="submit-error">
          {{ errorMessage }}
        </div>
        <div class="p1" v-if="hasUnallocatedFunds()">
          {{
            $t('cart.div12', {
              total: formatAmount(contribution.sub(getTotal())),
              tokenSymbol: tokenSymbol,
              contribution: formatAmount(contribution),
            })
          }}
        </div>
        <div class="p1" v-if="isBrightIdRequired">
          <links to="/verify" class="btn-primary">{{ $t('cart.link3') }} </links>
        </div>
        <button
          v-if="!isCartEmpty"
          class="btn-action"
          @click="submitCart"
          :disabled="Boolean(errorMessage) || (hasUserContributed && hasUserVoted && !isDirty)"
        >
          <template v-if="contribution.isZero()">
            {{
              $t('cart.template1', {
                total: formatAmount(getTotal()),
                tokenSymbol: tokenSymbol,
                cart: cart.length,
              })
            }}
          </template>
          <template v-else-if="!hasUserVoted">
            {{ $t('cart.template2') }}
          </template>
          <template v-else> {{ $t('cart.template3') }} </template>
        </button>
        <funds-needed-warning :onNavigate="toggleCart" :isCompact="true" />
        <div class="time-left" v-if="canUserReallocate && isEditMode">
          <div class="caps">{{ $t('cart.div13') }}</div>
          <time-left :date="timeLeftDate" />
        </div>
      </div>
      <div class="line-item-bar" v-if="hasUserContributed && !isEditMode">
        <div class="line-item">
          <span>{{ $t('cart.span3') }}</span>
          <div>
            <span>{{ formatAmount(getCartTotal(committedCart)) }} {{ tokenSymbol }}</span>
          </div>
        </div>
        <div class="line-item">
          <span>{{ $t('cart.span4') }}</span>
          <div>
            <span>{{ getCartMatchingPoolTotal() }} {{ tokenSymbol }}</span>
          </div>
        </div>
      </div>
      <div class="total-bar" v-if="isRoundContributionPhase || (hasUserContributed && hasContributionPhaseEnded)">
        <span class="total-label">{{ $t('cart.span5') }}</span>
        <div>
          <span v-if="isGreaterThanInitialContribution() && hasUserContributed"
            >{{ formatAmount(getCartTotal(cart)) }} /
            <span class="total-reallocation">{{ formatAmount(contribution) }}</span>
          </span>
          <span v-else>{{ formatAmount(getTotal()) }}</span>
          {{ tokenSymbol }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { BigNumber } from 'ethers'
import { parseFixed } from '@ethersproject/bignumber'
import { DateTime } from 'luxon'
import WalletModal from '@/components/WalletModal.vue'
import SignatureModal from '@/components/SignatureModal.vue'
import ContributionModal from '@/components/ContributionModal.vue'
import ReallocationModal from '@/components/ReallocationModal.vue'
import WithdrawalModal from '@/components/WithdrawalModal.vue'
import CartItems from '@/components/CartItems.vue'
import Links from '@/components/Links.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import { MAX_CONTRIBUTION_AMOUNT, MAX_CART_SIZE, type CartItem, isContributionAmountValid } from '@/api/contributions'
import { userRegistryType, UserRegistryType, operator } from '@/api/core'
import { RoundStatus } from '@/api/round'
import { formatAmount as _formatAmount } from '@/utils/amounts'
import FundsNeededWarning from '@/components/FundsNeededWarning.vue'
import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { useModal } from 'vue-final-modal'
import { useRoute } from 'vue-router'
import { getAssetsUrl } from '@/utils/url'
import { useI18n } from 'vue-i18n'
import { showError } from '@/utils/modal'

const { t } = useI18n()

const isLoading = ref(false)

const route = useRoute()
const appStore = useAppStore()
const {
  cart,
  cartEditModeSelected,
  committedCart,
  currentRound,
  isRoundContributionPhase,
  isRoundReallocationPhase,
  hasUserContributed,
  hasReallocationPhaseEnded,
  isMessageLimitReached,
  canUserReallocate,
  hasUserVoted,
  hasContributionPhaseEnded,
  contributor,
  isAppReady,
} = storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const dropdownItems = ref<
  {
    callback: () => void | null
    text: string
    icon: string
    cssClass?: string
  }[]
>([
  {
    callback: removeAll,
    text: t('dynamic.cart.action.remove_all'),
    icon: 'remove.svg',
  },
  {
    callback: splitContributionsEvenly,
    text: t('dynamic.cart.action.split_evenly'),
    icon: 'split.svg',
    cssClass: 'split-image',
  },
])

onMounted(async () => {
  if (currentUser.value?.encryptionKey) {
    isLoading.value = true
    await loadCart()
    isLoading.value = false
  }
})

function removeAll(): void {
  appStore.clearCart()
  appStore.saveCart()
  appStore.toggleEditSelection(true)
}

onMounted(() => {
  if (currentUser.value && !currentUser.value.encryptionKey) {
    promptSignagure()
  }
})

function promptConnection(): void {
  const { open, close } = useModal({
    component: WalletModal,
    attrs: {
      onClose() {
        close().then(() => {
          if (currentUser.value?.walletAddress) {
            promptSignagure()
          }
        })
      },
    },
  })
  open()
}

function promptSignagure(): void {
  const { open, close } = useModal({
    component: SignatureModal,
    attrs: {
      onClose() {
        close().then(async () => {
          if (currentUser.value?.encryptionKey) {
            await loadCart()
          }
          isLoading.value = false
        })
      },
    },
  })

  isLoading.value = true
  open()
}

async function loadCart() {
  if (appStore.cartLoaded || !appStore.currentRound) {
    return
  }

  try {
    await appStore.loadCart()
    await appStore.loadCommittedCart()
    await appStore.loadContributorData()
    appStore.cartLoaded = true
  } catch (err) {
    showError((err as Error).message)
    userStore.logoutUser()
  }
}

const isEditMode = computed(() => {
  if (isRoundContributionPhase.value && !hasUserContributed.value) {
    return true
  }

  if ((isRoundContributionPhase.value && hasUserContributed.value) || isRoundReallocationPhase.value) {
    return cartEditModeSelected.value
  }

  return false
})

const isDirty = computed(() => {
  return cart.value
    .filter(item => !item.isCleared)
    .some((item: CartItem) => {
      const index = committedCart.value.findIndex((commitedItem: CartItem) => {
        return item.id === commitedItem.id && item.amount === commitedItem.amount
      })

      return index === -1
    })
})

function handleEditState(): void {
  // When hitting cancel in edit mode, restore committedCart to local cart
  if (cartEditModeSelected.value) {
    appStore.restoreCommittedCartToLocalCart()
  }
  appStore.toggleEditSelection()
}

function toggleCart(): void {
  appStore.toggleShowCartPanel()
}

const tokenSymbol = computed(() => {
  const _currentRound = currentRound.value
  // TODO: configure eslint to catch the error below (currentRound should add .value)
  return currentRound.value ? _currentRound?.nativeTokenSymbol : ''
})
const contribution = computed(() => appStore.contribution || BigNumber.from(0))

const filteredCart = computed<CartItem[]>(() => {
  // Once reallocation phase ends, use committedCart for cart items
  if (hasReallocationPhaseEnded.value) {
    return committedCart.value.filter(item => !item.isCleared)
  }
  // Hide cleared items
  return cart.value.filter(item => !item.isCleared)
})

const isCartEmpty = computed(() => {
  return (
    currentUser.value &&
    // contribution.value !== null &&
    contribution.value.isZero() &&
    filteredCart.value.length === 0
  )
})
function formatAmount(value: BigNumber): string {
  const { nativeTokenDecimals } = currentRound.value!
  return _formatAmount(value, nativeTokenDecimals)
}

function isAmountValid(value: string): boolean {
  return isContributionAmountValid(value, currentRound.value!)
}

function isFormValid(): boolean {
  const invalidCount = cart.value.filter(item => {
    return !item.isCleared && isAmountValid(item.amount) === false
  }).length
  return invalidCount === 0
}

function getCartMatchingPoolTotal(): string {
  return formatAmount(contribution.value.sub(getCartTotal(committedCart.value)))
}

function getCartTotal(cart: Array<CartItem>): BigNumber {
  const { nativeTokenDecimals, voiceCreditFactor } = currentRound.value!
  return cart.reduce((total: BigNumber, item: CartItem) => {
    let amount
    try {
      amount = parseFixed(item.amount, nativeTokenDecimals)
    } catch {
      return total
    }
    return total.add(amount.div(voiceCreditFactor).mul(voiceCreditFactor))
  }, BigNumber.from(0))
}

function getTotal(): BigNumber {
  return hasUserContributed.value ? contribution.value : getCartTotal(cart.value)
}

function isGreaterThanMax(): boolean {
  const decimals = currentRound.value?.nativeTokenDecimals
  const maxContributionAmount = BigNumber.from(10).pow(BigNumber.from(decimals)).mul(MAX_CONTRIBUTION_AMOUNT)
  return getTotal().gt(maxContributionAmount)
}

function isGreaterThanInitialContribution(): boolean {
  return getCartTotal(cart.value).gt(contribution.value)
}

const isBrightIdRequired = computed(
  () => userRegistryType === UserRegistryType.BRIGHT_ID && !currentUser.value?.isRegistered,
)

const errorMessage = computed<string | null>(() => {
  if (isMessageLimitReached.value) return t('dynamic.cart.error.reached_contribution_limit')
  if (!currentUser.value) return t('dynamic.cart.error.connect_wallet')
  if (isBrightIdRequired.value) return t('dynamic.cart.error.need_to_setup_brightid')
  if (!currentUser.value.isRegistered) return t('dynamic.cart.error.user_not_registered', { operator })
  if (!isFormValid()) return t('dynamic.cart.error.invalid_contribution_amount')
  if (cart.value.length > MAX_CART_SIZE)
    return t('dynamic.cart.error.exceeded_max_cart_size', {
      maxCartSize: MAX_CART_SIZE,
    })
  if (currentRound.value?.status === RoundStatus.Cancelled) return t('dynamic.cart.error.round_cancelled')
  if (hasReallocationPhaseEnded.value) return t('dynamic.cart.error.round_ended')
  if (!currentRound.value || !currentUser.value.balance || !currentUser.value.etherBalance) {
    // not ready yet, waiting for current round and balances to load
    return null
  }
  if (currentRound.value.messages + cart.value.length >= currentRound.value.maxMessages) {
    return t('dynamic.cart.error.cart_changes_exceed_cap')
  } else {
    const total = getTotal()
    if (contribution.value.isZero()) {
      // Contributing
      if (DateTime.local() >= currentRound.value.signUpDeadline) {
        return t('dynamic.cart.error.contributions_over')
        // the above error might not be necessary now we have our cart states in the HTML above
      } else if (currentRound.value.contributors >= currentRound.value.maxContributors) {
        return t('dynamic.cart.error.reached_contributor_limit')
      } else if (total.eq(BigNumber.from(0)) && !isCartEmpty.value) {
        return t('dynamic.cart.error.must_be_gt_zero', {
          nativeTokenSymbol: currentRound.value.nativeTokenSymbol,
        })
      } else if (total.gt(currentUser.value.balance)) {
        const balanceDisplay = _formatAmount(currentUser.value.balance, currentRound.value.nativeTokenDecimals)
        return t('dynamic.cart.error.not_enough_funds', {
          balance: balanceDisplay,
          nativeTokenSymbol: currentRound.value.nativeTokenSymbol,
        })
      } else if (isGreaterThanMax()) {
        return t('dynamic.cart.error.too_generous', {
          maxAmount: MAX_CONTRIBUTION_AMOUNT,
          nativeTokenSymbol: currentRound.value.nativeTokenSymbol,
        })
      } else if (parseInt(currentUser.value.etherBalance.toString()) === 0) {
        return t('dynamic.cart.error.need_gas_payment')
      } else {
        return null
      }
    } else {
      // Reallocating funds
      if (!contributor.value) {
        return t('dynamic.cart.error.contributor_key_missing')
      } else if (isGreaterThanInitialContribution()) {
        return t('dynamic.cart.error.more_than_original_contribution', {
          total: formatAmount(contribution.value),
          tokenSymbol: tokenSymbol.value,
        })
      } else {
        return null
      }
    }
  }
})

function hasUnallocatedFunds(): boolean {
  return errorMessage.value === null && !contribution.value.isZero() && getTotal().lt(contribution.value)
}

const votes = computed(() => {
  const { nativeTokenDecimals, voiceCreditFactor } = currentRound.value!
  const formattedVotes: [number, BigNumber][] = cart.value.map((item: CartItem) => {
    const amount = parseFixed(item.amount, nativeTokenDecimals)
    const voiceCredits = amount.div(voiceCreditFactor)
    return [item.index, voiceCredits]
  })
  return formattedVotes
})

const { open: openWithdrawalModal, close: closeWithdrawalModal } = useModal({
  component: WithdrawalModal,
  attrs: {
    onClose() {
      closeWithdrawalModal()
    },
  },
})

function submitCart(event: any) {
  event.preventDefault()

  const { open: openContributionModal, close: closeContributionModal } = useModal({
    component: ContributionModal,
    attrs: {
      votes: votes.value,
      onClose() {
        closeContributionModal()
      },
    },
  })

  const { open: openReallocationModal, close: closeReallocationModal } = useModal({
    component: ReallocationModal,
    attrs: {
      votes: votes.value,
      onClose() {
        appStore.restoreCommittedCartToLocalCart()
        closeReallocationModal()
      },
    },
  })

  if (contribution.value.isZero() || !hasUserVoted.value) {
    openContributionModal()
  } else {
    openReallocationModal()
  }

  appStore.toggleEditSelection(false)
}

const canWithdrawContribution = computed(
  () => currentRound.value?.status === RoundStatus.Cancelled && !contribution.value.isZero(),
)

const showCollapseCart = computed(() => route.name !== 'cart')

function openDropdown() {
  document.getElementById('cart-dropdown')?.classList.toggle('show')
}

const timeLeftDate = computed<DateTime>(() => {
  return canUserReallocate.value ? currentRound.value!.votingDeadline : currentRound.value!.signUpDeadline
})

// Close the dropdown menu if the user clicks outside of it
window.onclick = function (event) {
  // @ts-ignore
  if (!event.target.matches('.dropdown-btn')) {
    const dropdowns = document.getElementsByClassName('button-menu')
    let i: number
    for (i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i]
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show')
      }
    }
  }
}

function splitContributionsEvenly(): void {
  appStore.toggleEditSelection(true)

  const filteredCart = cart.value.filter(item => !item.isCleared) // Filter out isCleared cart items for accurate split
  const total = canUserReallocate.value
    ? formatAmount(contribution.value)
    : filteredCart.reduce((acc, curr) => (acc += parseFloat(curr.amount)), 0)
  const splitAmount = (total as number) / filteredCart.length
  // Each iteration subtracts from the totalRemaining until the last round to accomodate for decimal rounding. ex 10/3
  let totalRemaining = Number(total)

  filteredCart.map((item: CartItem, index: number) => {
    if (filteredCart.length - 1 === index) {
      appStore.updateCartItem({
        ...item,
        amount: parseFloat(totalRemaining.toFixed(5)).toString(),
      })
    } else {
      appStore.updateCartItem({
        ...item,
        amount: parseFloat(splitAmount.toFixed(5)).toString(),
      })
      totalRemaining -= Number(splitAmount.toFixed(5))
    }
  })
  appStore.saveCart()
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

h2 {
  line-height: 130%;
}

.cart-container {
  box-sizing: border-box;
  position: relative;
  gap: 1rem;
  height: 100%;
  padding: 1rem 0rem;
  padding-top: 0rem;
  width: 100%;
  border-left: 1px solid #000;

  @media (max-width: $breakpoint-m) {
    padding: 0rem;
  }
  @media (max-width: $breakpoint-s) {
    padding: 1rem 0rem;
    margin-bottom: 3rem;
  }
}

.balance {
  font-size: 16px;
  font-weight: 600;
  font-family: 'Glacial Indifference', sans-serif;
}

.reallocation-intro {
  padding: 1rem;
  padding-top: 0rem;
  margin-bottom: 1rem;
  font-size: 14px;
}

.profile-info-round {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.5rem;
  width: 100%;
}

.profile-info-balance img {
  height: 16px;
  width: 16px;
}

.button-container {
  width: 100%;
  padding: 0rem 1rem;
}

.time-left {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  margin-top: 1rem;
}

.time-left-read-only {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1rem;
}

.cart-title-bar {
  position: sticky;
  padding: 1rem;
  top: 0;
  z-index: 1;
  @media (max-width: $breakpoint-m) {
    justify-content: space-between;
  }
  & > h2 {
    margin: 0;
    width: 100%;
    text-align: center;
    @media (max-width: $breakpoint-m) {
      margin-left: 1rem;
    }
  }
}

.flex-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0rem 1rem;
}

.semi-bold {
  font-weight: 500;
  font-size: 14px;
  button {
    font-family: 'Inter';
    font-weight: 500;
    font-size: 14px;
    color: var(--text-body);
    border: 0;
    background: none;
    text-decoration: underline;
  }
}

.flex {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.flex-row-reallocation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0rem 1rem;
  margin: 1rem 0;
}

.absolute-left {
  /* position: absolute;
  left: 0; */
  /* margin-left: 1rem; */
}

.absolute-right {
  position: absolute;
  right: 1rem;
}

.cart-btn {
  @include button(white, var(--bg-light-color), 1px solid rgba($border-light, 0.3));
  border: 0px solid var(--text-color);
  background: transparent;
  padding: 0.75rem 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  gap: 0.5rem;
  margin-right: -0.5rem;
  &:hover {
    background: var(--bg-secondary-color);
    gap: 0.75rem;
    margin-right: -0.75rem;
  }

  img {
    filter: var(--img-filter, invert(0.7));
  }
}

.cart {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.empty-cart {
  font-size: 16px;
  font-weight: 400;
  margin: 1rem;
  padding: 1.5rem 1.5rem;

  img {
    height: 70px;
  }

  h3 {
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 25px;
    font-weight: 700;
  }

  div {
    color: var(--text-color-cart);
  }
}

.line-item-bar {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  padding: 1rem 0;
  background: var(--bg-primary-color);
  font-family: 'Inter';
  font-size: 1rem;
  line-height: 0;
  font-weight: 400;
}

.line-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 1rem;
}

.total-bar {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  position: sticky;
  bottom: 0;
  padding: 1rem;
  justify-content: space-between;
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  font-family: 'Inter';
  font-size: 1rem;
  line-height: 0;
  font-weight: 400;
  height: 60px;
  @media (max-width: $breakpoint-m) {
    position: fixed;
    bottom: 4rem;
    width: 100%;
  }
  @media (max-width: $breakpoint-s) {
    position: fixed;
    bottom: 4rem;
    width: 100%;
    padding: 1rem;
  }
}

.total-reallocation {
  font-family: 'Inter';
  font-size: 1rem;
  line-height: 0;
  font-weight: 700;
}

.total-label {
  font-family: 'Glacial Indifference', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 0;
  margin-right: 0.5rem;
}

.reallocation-message {
  padding: 1rem;
  background: var(--bg-secondary-color);
  font-size: 14px;
}

.message-link {
  color: var(--text-color);
  text-decoration: underline;
}

.balance {
  padding: 1rem;
  background: var(--bg-primary-color);
  border-bottom: 1px solid #000000;
  border-top: 1px solid #000000;
  display: flex;
  justify-content: space-between;
}

.close-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  &:hover {
    transform: scale(1.01);
  }
}

.submit-btn-wrapper {
  align-self: flex-end;
  box-sizing: border-box;
  border-top: 1px solid #000000;
  text-align: left;
  gap: 0.5rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1rem;
  position: relative;
  background: var(--bg-secondary-color);
  @media (max-width: $breakpoint-m) {
    padding: 2rem;
  }

  .error-title {
    text-align: left;
    color: var(--attention-color);
    :after {
      content: ' ⚠️';
    }
  }

  .submit-error {
    margin-bottom: 1rem;
  }

  .btn-action {
    padding-left: 0;
    padding-right: 0;
    width: 100%;
  }
}

.h100 {
  height: 100%;
}

.p1 {
  width: 100%;
  margin-bottom: 1rem;
}

.mt1 {
  margin-top: 1rem;
  width: fit-content;
}

.ml1 {
  margin-left: 1rem;
}

.moon-emoji {
  font-size: 4rem;
}

.reallocation-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  span {
    font-size: 14px;
    font-weight: 600;
  }
}

.reallocation-row-warning {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: var(--attention-color);
  span {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color);
  }
}

.reallocation-warning {
  span {
    color: var(--attention-color);
    margin-right: 0.25rem;
  }
}

.split-link {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  text-decoration: underline;
  cursor: pointer;
  justify-content: flex-end;
  &:hover {
    opacity: 0.8;
    transform: scale(1.01);
  }

  img {
    filter: var(--img-filter, invert(1));
  }
}

.reallocation-row-matching-pool {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-weight: 600;
  font-size: 16px;
  color: $clr-green;
  div {
    font-size: 14px;
    font-weight: 400;
    color: #fff;
    padding: 0.125rem 0;
  }
}

.reallocation-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #000;
}

.dropdown {
  position: relative;
  display: inline-block;
  &:hover {
    filter: var(--img-filter, invert(1));
  }

  img.dropdown-btn {
    margin: 0;
    filter: var(--img-filter, invert(1));
    border: 1px solid var(--border-color);
  }

  .button-menu {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 2rem;
    right: 0.5rem;
    background: var(--bg-secondary-color);
    border: 1px solid rgba($border-light, 0.3);
    border-radius: 0.5rem;
    min-width: 160px;
    box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
    z-index: 1;
    cursor: pointer;
    overflow: hidden;

    .dropdown-item {
      display: flex;
      align-items: center;
      padding: 0.25rem;
      padding-left: 1rem;
      gap: 0.5rem;
      color: var(--text-body);
      &:hover {
        background: var(--bg-primary-color);
      }

      .item-text {
        margin: 0;
        color: var(--text-color);
      }

      .split-image {
        filter: var(--img-filter, invert(1));
      }
    }
  }

  .show {
    display: flex;
  }
}

.flex {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
