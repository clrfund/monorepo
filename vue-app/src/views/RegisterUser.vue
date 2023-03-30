<template>
  <div class="container">
    <div class="grid">
      <div class="title-area">
        <h1>{{ $t('registerUser.header') }}</h1>
      </div>
      <div class="cancel-area desktop">
        <links class="cancel-link" to="/projects">
          {{ $t('cancel') }}
        </links>
      </div>
      <div class="form-area">
        <div class="application">
          <div class="form-background">
            <label for="fund-address" class="input-label">{{
              $t('registerUser.address.label')
            }}</label>
            <p class="input-description">
              {{ $t('registerUser.address.description') }}
            </p>

            <input
              id="address"
              :placeholder="$t('registerUser.address.placeholder')"
              v-model.lazy="$v.form.addressName.$model"
              @blur="checkEns"
              :class="{
                input: true,
                invalid: $v.form.addressName.$error,
              }"
            />
            <p class="resolved-address" v-if="form.hasEns">
              {{ form.resolvedAddress }}
            </p>
            <p
              :class="{
                error: true,
                hidden: !$v.form.addressName.$error,
              }"
            >
              {{ $t('registerUser.error') }}
            </p>
            <p
              v-if="registrationTxError"
              :class="{
                error: true,
              }"
            >
              {{ registrationTxError }}
            </p>
            <transaction-receipt
              v-if="registrationTxHash"
              :hash="registrationTxHash"
            />
          </div>
          <div class="transaction">
            <button
              v-if="currentUser"
              type="button"
              class="btn-action"
              @click="register"
              :disabled="loadingTx || registrationTxHash.length > 0"
            >
              {{ $t('registerUser.button') }}
            </button>
            <wallet-widget :isActionButton="true"></wallet-widget>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Watch } from 'vue-property-decorator'
import Component, { mixins } from 'vue-class-component'
import { validationMixin } from 'vuelidate'
import { required } from 'vuelidate/lib/validators'

import Transaction from '@/components/Transaction.vue'
import Loader from '@/components/Loader.vue'
import Links from '@/components/Links.vue'
import CopyButton from '@/components/CopyButton.vue'
import { waitForTransaction } from '@/utils/contracts'
import { LOAD_USER_INFO } from '@/store/action-types'
import {
  addUser,
  isAuthorizedToAddUser,
  User,
  isVerifiedUser,
} from '@/api/user'
import { isValidEthAddress, resolveEns } from '@/utils/accounts'
import WalletWidget from '@/components/WalletWidget.vue'
import TransactionReceipt from '@/components/TransactionReceipt.vue'

type UserAddressName = {
  addressName: string
  resolvedAddress: string
  hasEns: boolean
}

@Component({
  components: {
    Transaction,
    Loader,
    Links,
    CopyButton,
    WalletWidget,
    TransactionReceipt,
  },
  validations: {
    form: {
      addressName: {
        required,
        validEthAddress: isValidEthAddress,
      },
      resolvedAddress: {},
    },
  },
})
export default class RegisterUser extends mixins(validationMixin) {
  registrationTxHash = ''
  registrationTxError = ''
  loadingTx = false

  form: UserAddressName = {
    addressName: '',
    resolvedAddress: '',
    hasEns: false,
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  isFormValid(): boolean {
    this.$v.form.$touch()
    return !this.$v.form.$invalid
  }

  async register() {
    this.registrationTxError = ''

    if (!this.currentUser) {
      return
    }

    const { userRegistryAddress } = this.$store.getters
    const signer = this.currentUser.walletProvider.getSigner()

    if (!this.isFormValid()) {
      return
    }

    try {
      this.loadingTx = true
      const isAuth = await isAuthorizedToAddUser(userRegistryAddress, signer)
      if (!isAuth) {
        throw new Error('You are not authorized')
      }

      const isRegistered = await isVerifiedUser(
        userRegistryAddress,
        this.form.resolvedAddress
      )
      if (isRegistered) {
        throw new Error('User already registered')
      }

      await waitForTransaction(
        addUser(userRegistryAddress, signer, this.form.resolvedAddress),
        (hash) => (this.registrationTxHash = hash)
      )
      this.$store.dispatch(LOAD_USER_INFO)
      this.loadingTx = false
    } catch (error) {
      this.registrationTxError = (error as Error).message
      this.loadingTx = false
    }
  }

  @Watch('$web3.user')
  resetForm() {
    this.registrationTxHash = ''
    this.registrationTxError = ''
  }

  async checkEns(): Promise<void> {
    this.resetForm()

    if (this.form?.addressName) {
      const addressName = this.form.addressName
      const res: string | null = await resolveEns(addressName)
      this.form.hasEns = !!res
      this.form.resolvedAddress = res ? res : addressName
    }
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
    background: var(--bg-secondary-color);
  }
}

.grid {
  display: grid;
  grid-template-columns: 1fr clamp(250px, 25%, 360px);
  grid-template-rows: auto 1fr;
  grid-template-areas:
    'title cancel'
    'form form';
  height: calc(100vh - var($nav-header-height));
  gap: 0 2rem;
  @media (max-width: $breakpoint-m) {
    grid-template-rows: auto auto 1fr;
    grid-template-columns: 1fr;
    grid-template-areas:
      'progress'
      'title'
      'form';
    gap: 0;
  }
}

.title-area {
  grid-area: title;
  display: flex;
  padding: 1rem;
  padding-left: 0rem;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;

  h1 {
    font-family: 'Glacial Indifference', sans-serif;
  }

  @media (max-width: $breakpoint-m) {
    margin-top: 2rem;
    padding-bottom: 0;
    padding-left: 1rem;
    font-size: 14px;
    font-weight: normal;
  }
}

.cancel-area {
  grid-area: cancel;
  display: flex;
  justify-content: flex-end;
  align-items: center;

  .cancel-link {
    font-weight: 500;
  }
}

.form-area {
  grid-area: form;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  height: 100%;
  @media (min-width: $breakpoint-m) {
    padding: 0;
    width: 100%;
  }
}

.form-area p {
  line-height: 150%;
}

.step-title {
  font-size: 1.5rem;
  margin-top: 1rem;
  font-weight: 600;
  &:first-of-type {
    margin-top: 0;
  }
}

.application {
  /* height: 100%; */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 2rem;
  @media (min-width: $breakpoint-m) {
    background: var(--bg-secondary-color);
    padding: 1.5rem;
    border-radius: 1rem;
    margin-bottom: 4rem;
  }
}

.cancel-link {
  position: sticky;
  top: 0px;
  color: var(--error-color);
  text-decoration: underline;
}

.transaction {
  padding: 2rem;
  border-radius: 1rem;
}

.transaction > * {
  margin: auto;
  width: fit-content;
}

.input {
  color: var(--text-color);
  border-radius: 16px;
  border: 2px solid var(-button-color);
  background-color: var(--bg-secondary-color);
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0em;
  width: 100%;
  &:valid {
    border: 2px solid $clr-green;
  }
  &:hover {
    background: var(--bg-primary-color);
    border: 2px solid $highlight-color;
    box-shadow: 0px 4px 16px 0px 25, 22, 35, 0.4;
  }
  &:optional {
    border: 2px solid $button-color;
    background-color: var(--bg-secondary-color);
  }
}

.input.invalid {
  border: 2px solid var(--error-color);
}

.resolved-address {
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.5;
  word-break: keep-all;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.error {
  word-break: break-word;
}
</style>
