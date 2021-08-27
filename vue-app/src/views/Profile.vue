<template>
  <div class="wrapper">
    <div class="modal-background" @click="$emit('close')" />
    <div class="container">
      <div class="flex-row" style="justify-content: flex-end">
        <div class="close-btn" @click="$emit('close')">
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
            v-tooltip="{
              content: 'Disconnect wallet',
              trigger: 'hover click',
            }"
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
        @close="$emit('close')"
      />
      <div class="balances-section">
        <div class="flex-row">
          <h2>{{ chainInfo.label }} balances</h2>
          <div
            v-tooltip="{
              content: `Balance of wallet on ${chainInfo.label} chain`,
              trigger: 'hover click',
            }"
          >
            <img src="@/assets/info.svg" />
          </div>
        </div>
        <div class="balances-card">
          <balance-item :balance="balance" abbrev="DAI">
            <icon-status
              v-bind:custom="true"
              logo="dai.svg"
              :secondaryLogo="chainInfo.logo"
              :bg="balanceBackgroundColor"
            />
          </balance-item>
          <balance-item :balance="etherBalance" abbrev="ETH">
            <icon-status
              v-bind:custom="true"
              logo="eth.svg"
              :secondaryLogo="chainInfo.logo"
              :bg="balanceBackgroundColor"
            />
          </balance-item>
        </div>
      </div>
      <div v-if="projects.length > 0" class="projects-section">
        <h2>Projects</h2>
        <div class="project-list">
          <div
            class="project-item"
            v-for="{
              id,
              name,
              thumbnailImageUrl,
              isHidden,
              isLocked,
            } of projects"
            :key="id"
          >
            <img
              :src="thumbnailImageUrl"
              :alt="alt + ' thumbnail'"
              class="project-thumbnail"
            />
            <div class="project-details">
              <div class="project-name">
                {{ name }}
                <span v-if="isLocked">🔒</span>
              </div>
              <div v-if="isHidden" class="project-hidden">Under review</div>
            </div>
            <button class="btn-secondary" @click="navigateToProject(id)">
              {{ isLocked ? 'Preview' : 'View' }}
            </button>
          </div>
          <loader v-if="isLoading" />
        </div>
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
import { Project, getProjects } from '@/api/projects'
import { CHAIN_INFO, ChainInfo } from '@/plugins/Web3/constants/chains'
import { isSameAddress } from '@/utils/accounts'

@Component({
  components: { BalanceItem, BrightIdWidget, IconStatus, CopyButton },
})
export default class NavBar extends Vue {
  @Prop() balance!: string
  @Prop() etherBalance!: string
  projects: Project[] = []
  balanceBackgroundColor = '#2a374b'
  isLoading = true

  async created() {
    this.isLoading = true
    await this.loadProjects()
    this.isLoading = false
  }

  get walletProvider(): any {
    return this.$store.state.currentUser?.walletProvider
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get showBrightIdWidget(): boolean {
    return userRegistryType === UserRegistryType.BRIGHT_ID
  }

  get chainInfo(): ChainInfo {
    return CHAIN_INFO[Number(process.env.VUE_APP_ETHEREUM_API_CHAINID)]
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
      this.$emit('close')
    }
  }

  private async loadProjects(): Promise<void> {
    const { recipientRegistryAddress, currentRound, currentUser } =
      this.$store.state
    const projects: Project[] = await getProjects(
      recipientRegistryAddress,
      currentRound?.startTime.toSeconds(),
      currentRound?.votingDeadline.toSeconds()
    )
    const userProjects: Project[] = projects.filter(({ address }) =>
      isSameAddress(address, currentUser?.walletAddress)
    )
    this.projects = userProjects
  }

  navigateToProject(id: string): void {
    this.$emit('close')
    this.$router.push({ name: 'project', params: { id } })
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
    top: 0;
    bottom: 0;
    background: $bg-light-color;
    width: clamp(350px, 25%, 500px);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    z-index: 2;
    overflow-y: scroll;

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

    .project-item {
      display: flex;
      padding: 1rem 0;
      border-bottom: 1px solid rgba($highlight-color, 0.5);
      .project-thumbnail {
        width: 3rem;
        aspect-ratio: 1 / 1;
        object-fit: fill;
        border-radius: 0.5rem;
      }
      .project-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 0 1rem;

        .project-hidden {
          color: $error-color;
        }
      }
    }
  }
}
</style>
