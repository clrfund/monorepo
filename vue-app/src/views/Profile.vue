<template>
  <div class="wrapper">
    <div class="modal-background" @click="toggleProfile" />
    <div class="container">
      <div class="flex-row" style="justify-content: flex-end;">
        <div class="close-btn" @click="toggleProfile()">
          <p class="no-margin">Close</p>
          <img src="@/assets/close.svg" />
        </div>
      </div>
      <div class="flex-row">
        <h2 class="no-margin">Your wallet</h2>
      </div>
      <div class="address-card">
        <h2 class="address">{{ ens || renderUserAddress(16)}}</h2>
        <div class="action-row">
          <div class="copy btn" @click="copyAddress"><img src="@/assets/copy.svg"></div>
          <div class="address">{{ens && renderUserAddress(20)}}</div>
          <div class="disconnect btn" @click="disconnect"><img src="@/assets/disconnect.svg"></div>
        </div>
      </div>
      <div class="setup-card">
        <div class="flex-row">
          <h2 class="no-margin">Contributor setup</h2>
          3/5
        </div>
        <div class="contributor-setup-progress">
          ===== ===== ===== ----- -----
        </div>
        <router-link to="#" class="complete-link">Complete setup</router-link>
      </div>
      <div class="balances-section">
        <div class="flex-row">
          <h2>Optimism balances</h2>
          <img src="@/assets/info.svg">
        </div>
        <div class="balances-card">
          <balance-item :balance="balance" abbrev="DAI" />
          <balance-item :balance="etherBalance" abbrev="ETH" />
        </div>
      </div>
      <div class="projects-section">
        <h2>Projects</h2>
        <!-- <div class="project-item" v-for=" eacah project user owns " /> -->
      </div>
      <!-- <div class="btn-warning">Disconnect wallet</div> -->
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import BalanceItem from '@/components/BalanceItem'


@Component({
  components: { BalanceItem },
})
export default class NavBar extends Vue {
  @Prop() toggleProfile

  @Prop()
  balance!: string

  @Prop()
  etherBalance!: string

  renderUserAddress(digitsToShow?: number): string {
    if (this.$store.state.currentUser?.walletAddress) {
      const address: string = this.$store.state.currentUser.walletAddress
      if (digitsToShow) {
        const beginDigits: number = Math.ceil(digitsToShow / 2)
        const endDigits: number = Math.floor(digitsToShow / 2)
        const begin: string = address.substr(0, 2 + beginDigits)
        const end: string = address.substr(address.length - endDigits, endDigits)
        return `${begin}…${end}`
      }
      return address
    }
    return ''
  }

  get ens(): string {
    return this.$store.state.currentUser?.ens
  }

  async copyAddress(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.$store.state.currentUser.walletAddress)
      // TODO: UX success feedback
    } catch (error) {
      console.warn('Error in copying text: ', error)
    }
  }

  async disconnect(): Promise<void> {
    console.log('todo')
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
    background: rgba(0,0,0,0.7);
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .container {
    position: absolute;
    right: 0;
    background: $bg-secondary-color;
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
      background: $clr-pink-light-gradient;

      .address {
        margin: 0;
        text-transform: uppercase;
      }

      .action-row {
        display: grid;
        gap: 0.5rem;
        grid-template-columns: auto 1fr auto;
        grid-template-areas: "copy address disconnect";

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
          /* background: none; */
          border: 1px solid $text-color;
          padding: 0.5rem;
          height: 2rem;
          width: 2rem;
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.1);
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