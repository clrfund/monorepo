<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Submit project</h3>
      <div class="requirements">
        Please make sure that your project meets the requirements
        <br>
        of the <a :href="registryInfo.listingPolicyUrl" target="_blank" rel="noopener">Listing Policy</a>.
        <br>
        Required security deposit: {{ formatAmount(registryInfo.deposit) }} {{ registryInfo.depositToken }}.
      </div>
      <form class="recipient-form">
        <div class="input-wrapper">
          <label for="recipient-name">Project name</label>
          <input
            id="recipient-name"
            type="text"
            v-model="$v.form.name.$model"
            class="input"
            :class="{ invalid: $v.form.name.$error }"
          >
          <div class="input-error" v-if="$v.form.name.$error">
            <template v-if="!$v.form.name.required">Field is required.</template>
            <template v-else-if="!$v.form.name.minLength">
              Name must be at least {{ $v.form.name.$params.minLength.min }} characters long.
            </template>
          </div>
        </div>
        <div class="input-wrapper">
          <label for="recipient-address">ETH address</label>
          <input
            id="recipient-address"
            type="text"
            placeholder="Address where recipient will receive funds"
            v-model="$v.form.address.$model"
            class="input"
            :class="{ invalid: $v.form.address.$error }"
          >
          <div class="input-error" v-if="$v.form.address.$error">
            <template v-if="!$v.form.address.required">Field is required.</template>
            <template v-else-if="!$v.form.address.validEthAddress">Invalid ethereum address.</template>
          </div>
        </div>
        <div class="input-wrapper">
          <label for="recipient-description">Description</label>
          <textarea
            id="recipient-description"
            placeholder="Project description should include proof of ownership of the receiving address. Markdown is supported."
            v-model="$v.form.description.$model"
            class="input"
            :class="{ invalid: $v.form.description.$error }"
          ></textarea>
          <div class="input-error" v-if="$v.form.description.$error">
            <template v-if="!$v.form.description.required">Field is required.</template>
            <template v-else-if="!$v.form.description.minLength">
              Description must be at least {{ $v.form.description.$params.minLength.min }} characters long.
            </template>
          </div>
        </div>
        <div class="input-wrapper">
          <label for="recipient-image-hash">Image hash</label>
          <input
            id="recipient-image-hash"
            type="text"
            placeholder="IPFS hash of the logo image"
            v-model="$v.form.imageHash.$model"
            class="input"
            :class="{ invalid: $v.form.imageHash.$error }"
          >
          <div class="input-error" v-if="$v.form.imageHash.$error">
            <template v-if="!$v.form.imageHash.required">Field is required.</template>
            <template v-else-if="!$v.form.imageHash.validIpfsHash">Invalid IPFS hash.</template>
          </div>
        </div>
      </form>
      <div class="btn-row">
        <button class="btn" @click="$emit('close')">Go back</button>
        <button class="btn" @click="addRecipient()" :disabled="$v.form.$invalid">Continue</button>
      </div>
    </div>
    <div v-if="step === 2">
      <h3>Submit project</h3>
      <transaction
        :hash="submissionTxHash"
        :error="submissionTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 3">
      <h3>Success!</h3>
      <div class="success">
        Successfully submitted recipient registration request. Request ID is <code>{{ recipientId }}</code>.
      </div>
      <button class="btn close-btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Component, { mixins } from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { validationMixin } from 'vuelidate'
import { required, minLength } from 'vuelidate/lib/validators'
import { BigNumber } from 'ethers'
import { isAddress } from '@ethersproject/address'
import * as isIPFS from 'is-ipfs'

import {
  RegistryInfo,
  RecipientData,
  addRecipient,
  getRequestId,
} from '@/api/recipient-registry-optimistic'
import Transaction from '@/components/Transaction.vue'
import { formatAmount } from '@/utils/amounts'
import { waitForTransaction } from '@/utils/contracts'

@Component({
  components: {
    Transaction,
  },
  validations: {
    form: {
      name: {
        required,
        minLength: minLength(4),
      },
      description: {
        required,
        minLength: minLength(30),
      },
      imageHash: {
        required,
        validIpfsHash: (value) => isIPFS.cid(value),
      },
      address: {
        required,
        validEthAddress: (value) => isAddress(value),
      },
    },
  },
})
export default class RecipientSubmissionModal extends mixins(validationMixin) {

  @Prop()
  registryAddress!: string

  @Prop()
  registryInfo!: RegistryInfo

  step = 1

  form: RecipientData = {
    name: '',
    description: '',
    imageHash: '',
    address: '',
  }
  submissionTxHash = ''
  submissionTxError = ''
  recipientId = ''

  formatAmount(value: BigNumber): string {
    return formatAmount(value, 18)
  }

  async addRecipient() {
    this.step += 1
    const signer = this.$store.state.currentUser.walletProvider.getSigner()
    let submissionTxReceipt
    try {
      submissionTxReceipt = await waitForTransaction(
        addRecipient(this.registryAddress, this.form, this.registryInfo.deposit, signer),
        (hash) => this.submissionTxHash = hash,
      )
    } catch (error) {
      this.submissionTxError = error.message
      return
    }
    this.recipientId = getRequestId(submissionTxReceipt, this.registryAddress)
    this.step += 1
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.requirements {
  line-height: 1.5;
}

.recipient-form {
  margin-top: $modal-space;
  text-align: left;

  .input-wrapper {
    display: flex;
    flex-wrap: wrap;
    margin: $modal-space 0;
    width: 100%;

    label {
      display: inline-block;
      width: 100px;
      padding: 10px 0 0;
    }

    input, textarea {
      background-color: #332f40;
      flex-grow: 1;
    }

    .input-error {
      color: $error-color;
      flex-basis: 100%;
      margin-left: 100px;
      margin-top: 3px;
    }
  }
}

#recipient-description {
  height: 100px;
}

.success {
  word-wrap: break-word;
}

.btn-row {
  margin: $modal-space auto 0;

  .btn {
    margin: 0 $modal-space;
  }
}

.close-btn {
  margin-top: $modal-space;
}
</style>
