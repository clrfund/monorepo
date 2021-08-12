<template>
  <div class="wrapper">
    <div class="modal-background" @click="toggleProfile" />
    <div class="container">
      <div class="flex-row" style="justify-content: flex-end">
        <div class="close-btn" @click="toggleProfile()">
          <p class="no-margin">Close</p>
          <img src="@/assets/close.svg" />
        </div>
      </div>
      <div class="flex-row">
        <h2 class="no-margin">Your wallet</h2>
      </div>
      <div class="address-card">
        <h2 class="address">{{ renderUserAddress(16) }}</h2>
        <div class="action-row" v-if="currentUser">
          <copy-button
            :value="currentUser.walletAddress"
            text="address"
            myClass="profile"
            class="copy"
          />
          <div class="address">{{ renderUserAddress(20) }}</div>
          <div
            v-tooltip="'Disconnect wallet'"
            class="disconnect btn"
            @click="disconnect"
          >
            <img src="@/assets/disconnect.svg" />
          </div>
        </div>
      </div>
      <bright-id-widget
        v-if="showBrightIdWidget"
        :isProjectCard="false"
        :toggleProfile="toggleProfile"
      />
      <div class="balances-section">
        <div class="flex-row">
          <h2>Optimism balances</h2>
          <img src="@/assets/info.svg" />
        </div>
        <div class="balances-card">
          <balance-item :balance="balance" abbrev="DAI">
            <icon-status
              v-bind:custom="true"
              logo="dai.svg"
              secondaryLogo="optimism.png"
              bg="red"
            />
          </balance-item>
          <balance-item :balance="etherBalance" abbrev="ETH">
            <icon-status
              v-bind:custom="true"
              logo="eth.svg"
              secondaryLogo="optimism.png"
              bg="red"
            />
          </balance-item>
        </div>
      </div>
      <div class="projects-section">
        <h2>Projects</h2>
        <!-- <div class="project-item" v-for=" eacah project user owns " /> -->
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import BalanceItem from '@/components/BalanceItem.vue'
import IconStatus from '@/components/IconStatus.vue'
import BrightIdWidget from '@/components/BrightIdWidget.vue'
import CopyButton from '@/components/CopyButton.vue'
import { LOGOUT_USER } from '@/store/action-types'
import { User } from '@/api/user'

import { userRegistryType, UserRegistryType } from '@/api/core'

@Component({
  components: { BalanceItem, BrightIdWidget, IconStatus, CopyButton },
})
export default class NavBar extends Vue {
  @Prop() toggleProfile

  @Prop()
  balance!: string

  @Prop()
  etherBalance!: string

  get walletProvider(): any {
    return this.$store.state.currentUser?.walletProvider
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get showBrightIdWidget(): boolean {
    return userRegistryType === UserRegistryType.BRIGHT_ID
  }

  renderUserAddress(digitsToShow?: number): string {
    if (this.$store.state.currentUser?.walletAddress) {
      const address: string = this.$store.state.currentUser.walletAddress
      if (digitsToShow) {
        const beginDigits: number = Math.ceil(digitsToShow / 2)
        const endDigits: number = Math.floor(digitsToShow / 2)
        const begin: string = address.substr(0, 2 + beginDigits)
        const end: string = address.substr(
          address.length - endDigits,
          endDigits
        )
        return `${begin}…${end}`
      }
      return address
    }
    return ''
  }

  async disconnect(): Promise<void> {
    if (this.currentUser && this.walletProvider) {
      // Log out user
      this.$web3.disconnectWallet()
      this.$store.dispatch(LOGOUT_USER)
      this.toggleProfile()
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

h2 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 24px;
  line-height: 150%;
}

h2.no-margin {
  margin: 0;
}

p.no-margin {
  margin: 0;
}

.flex-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  .modal-background {
    background: rgba(0, 0, 0, 0.7);
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .container {
    position: absolute;
    right: 0;
    background: $bg-light-color;
    height: 100%;
    width: clamp(350px, 25%, 500px);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    z-index: 2;

    .balances-card,
    .setup-card,
    .address-card {
      padding: 1rem;
      border-radius: 0.5rem;
      background: $bg-primary-color;
      gap: 1rem;
    }
    .address-card {
      background: $clr-pink-dark-gradient;

      .address {
        margin: 0;
        text-transform: uppercase;
      }

      .action-row {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: auto 1fr auto;
        grid-template-areas: 'copy address disconnect';

        .copy {
          grid-area: copy;
        }
        .address {
          grid-area: address;
          display: flex;
          align-items: center;
        }
        .disconnect {
          grid-area: disconnect;
        }
        .btn {
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid $text-color;
          padding: 0.5rem;
          height: 2rem;
          width: 2rem;
          box-sizing: border-box;
          background: rgba(white, 0.1);
          &:hover {
            transform: scale(1.01);
            opacity: 0.8;
          }

          img {
            margin: 0;
          }
        }
      }
    }

    .complete-link {
      color: white;
      text-decoration: underline;
      margin: 1rem 0;
      cursor: pointer;
      &:hover {
        transform: scale(1.01);
      }
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

    /* .setup-card {
      background: $bg-primary-color;
    } */

    .balances-card {
      padding: 0rem;
    }
  }
}
</style>
