<template>
  <nav id="nav-bar">
    <links v-if="!inApp" to="/">
      <img
        class="ef-logo"
        alt="ethereum foundation"
        src="@/assets/eth-diamond-rainbow.svg"
      />
    </links>
    <links v-else to="/projects">
      <img
        class="ef-logo"
        alt="ethereum foundation"
        src="@/assets/eth-diamond-rainbow.svg"
      />
    </links>
    <div class="btn-row">
      <a
        href="/#/recipients"
        v-if="$store.getters.isRecipientRegistryOwner"
        class="btn-primary margin-right"
      >
        Manage Recipients
      </a>
      <div class="help-dropdown" v-if="inApp">
        <img
          @click="toggleHelpDropdown()"
          class="dropdown-btn"
          src="@/assets/help.svg"
        />
        <div id="myHelpDropdown" class="button-menu" v-if="showHelpDowndown">
          <div class="dropdown-title">Help</div>
          <div
            v-for="({ to, text, emoji }, idx) of dropdownItems"
            :key="idx"
            class="dropdown-item"
          >
            <links :to="to">
              <div class="emoji-wrapper">{{ emoji }}</div>
              <p class="item-text">{{ text }}</p>
            </links>
          </div>
        </div>
      </div>
      <!-- <div class="desktop"><cart-widget v-if="inApp" /></div> -->
      <wallet-widget class="wallet-widget" v-if="inApp" />
      <links v-if="!inApp" to="/projects" class="app-btn">App</links>
    </div>
  </nav>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import WalletWidget from './WalletWidget.vue'
import CartWidget from './CartWidget.vue'
import Links from './Links.vue'

@Component({
  components: { WalletWidget, CartWidget, Links },
})
export default class NavBar extends Vue {
  @Prop() inApp
  showHelpDowndown = false
  profileImageUrl: string | null = null
  dropdownItems: { to?: string; text: string; emoji: string }[] = [
    { to: '/', text: 'About', emoji: 'ℹ️' },
    { to: '/about/how-it-works', text: 'How it works', emoji: '⚙️' },
    { to: '/about/maci', text: 'Bribery protection', emoji: '🤑' },
    { to: '/about/sybil-resistance', text: 'Sybil resistance', emoji: '👤' },
    { to: '/about/layer-2', text: 'About Layer 2', emoji: '🚀' },
    {
      to: 'https://github.com/clrfund/monorepo/',
      text: 'Code',
      emoji: '👾',
    },
  ]

  toggleHelpDropdown(): void {
    this.showHelpDowndown = !this.showHelpDowndown
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

#nav-bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  padding: 0 1.5rem;
  height: 64px;
  justify-content: space-between;
  align-items: center;
  background: $bg-secondary-color;
  box-shadow: $box-shadow;
  @media (max-width: $breakpoint-m) {
    padding: 0 1rem;
  }

  .wallet-widget {
    margin-left: 0.5rem;
  }

  .btn-row {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .help-dropdown {
    position: relative;
    display: inline-block;
    margin-left: 0.5rem;

    .button-menu {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 2rem;
      right: 0.5rem;
      background: $bg-secondary-color;
      border: 1px solid rgba(115, 117, 166, 0.3);
      border-radius: 0.5rem;
      min-width: 160px;
      box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
      z-index: 1;
      cursor: pointer;
      overflow: hidden;

      @media (max-width: $breakpoint-s) {
        right: -4.5rem;
      }

      .dropdown-title {
        padding: 0.5rem;
        font-weight: 600;
      }

      .dropdown-item a {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        gap: 0.5rem;
        width: 176px;
        &:after {
          color: $text-color;
        }
        &:hover {
          background: $bg-light-color;
        }

        .item-text {
          margin: 0;
          color: $text-color;
        }
      }
    }
  }

  .button-menu links {
    font-size: 16px;
  }

  .ef-logo {
    margin: 0;
    height: 2.25rem;
    vertical-align: middle;
  }

  .margin-right {
    margin-right: 0.5rem;
  }
}
</style>
