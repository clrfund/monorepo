<template>
  <div class="modal-body">
    <div v-if="step === 0">
      <h3>Checking BrightID verification...</h3>
      <div class="loader"></div>
    </div>
    <div v-if="step === 1">
      <h3>Step 1 of 3: Connect</h3>
      <div>
        Please scan the QR code or open the link with your BrightID app.
        <br>
        Verification of your account may take a few minutes.
      </div>
      <img :src="appLinkQrCode" class="qr-code">
      <div>
        <a :href="appLink" target="_blank">{{ appLink }}</a>
      </div>
    </div>
    <div v-if="step === 2">
      <h3>Step 2 of 3: Sponsor</h3>
      <transaction
        :hash="sponsorTxHash"
        :error="sponsorTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 3">
      <h3>Step 3 of 3: Register</h3>
      <transaction
        :hash="registrationTxHash"
        :error="registrationTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 4">
      <h3>Success!</h3>
      <div>You have successfully verified your account.</div>
      <button class="btn close-btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import QRCode from 'qrcode'

import {
  getBrightIdLink,
  Verification,
  BrightIdError,
  getVerification,
  isSponsoredUser,
  selfSponsor,
  registerUser,
} from '@/api/bright-id'
import { User } from '@/api/user'
import Transaction from '@/components/Transaction.vue'
import { LOAD_USER_INFO } from '@/store/action-types'
import { waitForTransaction } from '@/utils/contracts'

@Component({
  components: {
    Transaction,
  },
})
export default class BrightIdModal extends Vue {

  step = 0

  appLink = ''
  appLinkQrCode = ''

  sponsorTxHash = ''
  sponsorTxError = ''
  registrationTxHash = ''
  registrationTxError = ''

  private get currentUser(): User {
    return this.$store.state.currentUser
  }

  mounted() {
    // Present app link and QR code
    this.appLink = getBrightIdLink(this.currentUser.walletAddress)
    QRCode.toDataURL(this.appLink, (error, url: string) => {
      if (!error) {
        this.appLinkQrCode = url
      }
    })
    this.waitForVerification()
  }

  private async waitForVerification() {
    let verification
    const checkVerification = async () => {
      try {
        verification = await getVerification(this.currentUser.walletAddress)
      } catch (error) {
        if (
          error instanceof BrightIdError &&
          error.code === 4 &&
          this.step <= 1
        ) {
          // Error 4: Not sponsored
          this.sponsor()
        }
      }
      if (verification) {
        this.register(verification)
      }
    }
    await checkVerification()
    if (this.step === 0) {
      // First check completed
      this.step = 1
    }
    if (!verification) {
      const intervalId = setInterval(async () => {
        await checkVerification()
        if (verification) {
          clearInterval(intervalId)
        }
      }, 5000)
    }
  }

  private async sponsor() {
    this.step = 2
    const { userRegistryAddress } = this.$store.state.currentRound
    const signer = this.currentUser.walletProvider.getSigner()
    const isSponsored = await isSponsoredUser(
      userRegistryAddress,
      this.currentUser.walletAddress,
    )
    if (!isSponsored) {
      try {
        await waitForTransaction(
          selfSponsor(userRegistryAddress, signer),
          (hash) => this.sponsorTxHash = hash,
        )
      } catch (error) {
        this.sponsorTxError = error.message
        return
      }
    }
  }

  private async register(verification: Verification) {
    this.step = 3
    const { userRegistryAddress } = this.$store.state.currentRound
    const signer = this.currentUser.walletProvider.getSigner()
    try {
      await waitForTransaction(
        registerUser(userRegistryAddress, verification, signer),
        (hash) => this.registrationTxHash = hash,
      )
    } catch (error) {
      this.registrationTxError = error.message
      return
    }
    this.$store.dispatch(LOAD_USER_INFO)
    this.step += 1
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.qr-code {
  margin: 15px 0;
  max-height: 150px;
}

.close-btn {
  margin-top: 20px;
}
</style>
