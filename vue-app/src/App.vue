<template>
  <div id="app" class="wrapper">
    <nav-bar :in-app="isInApp" />
    <div id="content-container">
      <div
        id="sidebar"
        v-if="isSidebarShown"
        :class="`${$store.state.showCartPanel ? 'desktop-l' : 'desktop'}`"
      >
        <round-information />
      </div>
      <div
        id="content"
        :class="{
          padded: isSidebarShown && !isCartPadding,
          'mr-cart-open': isCartToggledOpen && isSideCartShown,
          'mr-cart-closed': !isCartToggledOpen && isSideCartShown,
        }"
      >
        <back-link
          v-if="showBackLink"
          :to="backLinkRoute"
          :text="backLinkText"
        />
        <router-view :key="$route.path" />
      </div>
      <div
        id="cart"
        v-if="isSideCartShown"
        :class="`desktop ${isCartToggledOpen ? 'open-cart' : 'closed-cart'}`"
      >
        <cart-widget />
      </div>
    </div>
    <mobile-tabs v-if="isMobileTabsShown" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Watch } from 'vue-property-decorator'

import { getOsColorScheme } from '@/utils/theme'
import { getCurrentRound } from '@/api/round'
import { User } from '@/api/user'

import RoundInformation from '@/views/RoundInformation.vue'
import NavBar from '@/components/NavBar.vue'
import CartWidget from '@/components/CartWidget.vue'
import Cart from '@/components/Cart.vue'
import MobileTabs from '@/components/MobileTabs.vue'
import BackLink from '@/components/BackLink.vue'

import {
  LOAD_USER_INFO,
  LOAD_ROUND_INFO,
  LOAD_RECIPIENT_REGISTRY_INFO,
  SELECT_ROUND,
  LOAD_CART,
  LOAD_COMMITTED_CART,
  LOAD_CONTRIBUTOR_DATA,
  LOGIN_USER,
} from '@/store/action-types'
import { SET_CURRENT_USER } from '@/store/mutation-types'

@Component({
  name: 'clr.fund',
  metaInfo: {
    title: 'clr.fund',
    titleTemplate: 'clr.fund - %s',
    meta: [
      {
        name: 'git-commit',
        content: process.env.VUE_APP_GIT_COMMIT || '',
      },
    ],
  },
  components: {
    RoundInformation,
    NavBar,
    Cart,
    MobileTabs,
    CartWidget,
    BackLink,
  },
})
export default class App extends Vue {
  intervals: { [key: string]: any } = {}

  //NOTE: why are all these called on the landing page? makes it heavy to load
  created() {
    this.setAppTheme()
    this.intervals.round = setInterval(() => {
      this.$store.dispatch(LOAD_ROUND_INFO)
    }, 60 * 1000)
    this.intervals.recipient = setInterval(async () => {
      await this.$store.dispatch(LOAD_RECIPIENT_REGISTRY_INFO)
    }, 60 * 1000)
    this.intervals.user = setInterval(() => {
      this.$store.dispatch(LOAD_USER_INFO)
    }, 60 * 1000)
  }

  //NOTE: why are all these called on the landing page?
  async mounted() {
    //TODO: update to take factory address as a parameter, default to env. variable
    //TODO: SELECT_ROUND action also commits SET_CURRENT_FACTORY_ADDRESS on this action, should be passed optionally and default to env variable
    const roundAddress =
      this.$store.state.currentRoundAddress || (await getCurrentRound())
    await this.$store.dispatch(SELECT_ROUND, roundAddress)
    this.$store.dispatch(LOAD_ROUND_INFO)
    await this.$store.dispatch(LOAD_RECIPIENT_REGISTRY_INFO)
  }

  beforeDestroy() {
    for (const interval of Object.keys(this.intervals)) {
      clearInterval(this.intervals[interval])
    }
  }

  @Watch('$web3.user')
  loginUser = async () => {
    if (!this.$web3.user) return

    this.$store.commit(SET_CURRENT_USER, this.$web3.user)
    await this.$store.dispatch(LOGIN_USER)
    if (this.$store.state.currentRound) {
      // Load cart & contributor data for current round
      await this.$store.dispatch(LOAD_USER_INFO)
      this.$store.dispatch(LOAD_CART)
      this.$store.dispatch(LOAD_COMMITTED_CART)
      this.$store.dispatch(LOAD_CONTRIBUTOR_DATA)
    }
  }

  @Watch('$store.state.theme')
  setAppTheme = () => {
    const savedTheme = this.$store.state.theme
    const theme = savedTheme || getOsColorScheme()
    document.documentElement.setAttribute('data-theme', theme)
  }

  private get currentUser(): User {
    return this.$store.state.currentUser
  }

  get isInApp(): boolean {
    return this.$route.name !== 'landing'
  }

  get isSidebarShown(): boolean {
    const excludedRoutes = [
      'landing',
      'project-added',
      'join',
      'join-step',
      'round-information',
      'transaction-success',
      'verify',
      'verify-step',
      'verified',
    ]
    return !excludedRoutes.includes(this.$route.name || '')
  }

  get isMobileTabsShown(): boolean {
    const excludedRoutes = [
      'landing',
      'project-added',
      'join',
      'join-step',
      'transaction-success',
      'verify',
      'verify-step',
      'verified',
    ]
    return !excludedRoutes.includes(this.$route.name || '')
  }

  get isSideCartShown(): boolean {
    return (
      !!this.currentUser && this.isSidebarShown && this.$route.name !== 'cart'
    )
  }

  get isCartPadding(): boolean {
    const routes = ['cart']
    return routes.includes(this.$route.name || '')
  }

  get backLinkRoute(): string {
    const route = this.$route.name || ''
    return route.includes('about-') ? '/about' : '/projects'
  }

  get backLinkText(): string {
    const route = this.$route.name || ''
    return route.includes('about-') ? '← Back to About' : '← Back to projects'
  }

  get showBackLink(): boolean {
    const excludedRoutes = [
      'landing',
      'project-added',
      'join',
      'join-step',
      'projects',
      'transaction-success',
      'verify',
      'verify-step',
      'verified',
    ]
    return !excludedRoutes.includes(this.$route.name || '')
  }

  get isCartToggledOpen(): boolean {
    return this.$store.state.showCartPanel
  }
}
</script>

<style lang="scss">
@import 'styles/vars';
@import 'styles/fonts';
@import 'styles/theme';

/**
 * Global styles
 */
html,
body {
  height: 100%;
  margin: 0;
}

html {
  background-color: var(--bg-primary-color);
  color: var(--text-color);
  font-family: Inter, sans-serif;
  font-size: 16px;
}

a {
  color: var(--link-color);
  cursor: pointer;
  text-decoration: none;
}

textarea {
  resize: vertical;
  border-end-end-radius: 0 !important;
}

.mobile {
  @media (min-width: ($breakpoint-m + 1px)) {
    display: none !important;
  }
}

.mobile-l {
  @media (min-width: ($breakpoint-l + 1px)) {
    display: none !important;
  }
}

.desktop {
  @media (max-width: $breakpoint-m) {
    display: none !important;
  }
}

.desktop-l {
  @media (max-width: $breakpoint-l) {
    display: none !important;
  }
}

.caps {
  text-transform: uppercase;
}

.btn-container {
  display: flex;
  gap: 1rem;
  @media (max-width: $breakpoint-m) {
    flex-direction: column;
  }
}

summary:focus {
  outline: none;
}

.wrapper {
  min-height: 100%;
  position: relative;
}

.input {
  background-color: var(--bg-light-color);
  border: 2px solid $button-color;
  border-radius: 2px;
  box-sizing: border-box;
  color: var(--text-color);
  font-family: Inter, sans-serif;
  font-size: 16px;
  padding: 7px;

  &.invalid {
    border-color: var(--error-color);
  }

  &::placeholder {
    opacity: 0.5;
  }

  &:focus {
    outline: none;
  }
}

.btn {
  background-color: $button-color;
  border: none;
  border-radius: 20px;
  color: var(--text-color);
  cursor: pointer;
  font-weight: bold;
  line-height: 22px;
  padding: 6px 20px 8px;

  img {
    height: 1em;
    margin: 0 10px 0 0;
    vertical-align: middle;
  }

  &:hover {
    background-color: $highlight-color;
    color: var(--bg-secondary-color);
  }

  &[disabled],
  &[disabled]:hover {
    background-color: $button-disabled-color !important;
    color: $button-disabled-color !important;
    cursor: not-allowed;
  }
}

.btn-inactive {
  background-color: transparent;
  border: 2px solid $button-color;
  color: $button-color;
  padding: (6px - 2px) (20px - 2px) (8px - 2px);

  &:hover {
    background-color: transparent;
    color: $button-color;
  }
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

#content-container {
  display: flex;
  /* height: calc(100vh - 61.5px); */
  height: 100%;
  background: var(--bg-primary-color);
  overflow-x: clip;
  /* overflow-y: scroll; */
}

#sidebar {
  box-sizing: border-box;
  background-color: var(--bg-primary-color);
  flex-shrink: 0;
  padding: 1.5rem;
  width: $cart-width-open;
  height: 100%;
  position: sticky;
  top: 1.5rem;

  .status {
    font-size: 16px;
    display: flex;
    align-items: center;
  }

  .round-info-div {
    background: var(--bg-light-color);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 2rem;
  }

  .clr-logo {
    display: block;
    /* max-height: 100%; */
  }

  .menu-btn,
  .cart-btn {
    display: none;
    margin-right: 0.5rem;
  }
}

#cart {
  position: fixed;
  right: 0;
  top: $nav-header-height;
  bottom: 0;
}

.open-cart {
  width: $cart-width-open;
  overflow-y: scroll;
  overflow-x: hidden;
}

.closed-cart {
  width: 4rem;
}

#nav-menu {
  /* margin-left: 15%;
  padding: 50px 5% 0; */

  a {
    color: var(--text-color);
    display: block;
    font-size: 16px;
    margin-bottom: $content-space;
    text-decoration: none;

    &:hover {
      color: $highlight-color;
    }

    &.router-link-exact-active {
      color: $highlight-color;
      font-weight: bold;
      position: relative;

      &::before {
        border: 2px solid $highlight-color;
        border-radius: 10px;
        bottom: 0;
        box-sizing: border-box;
        content: '';
        display: block;
        height: 0.75em;
        left: -25px;
        position: absolute;
        top: 0.2em;
        width: 0.75em;
      }
    }
  }
}

#content {
  flex: 1;
  padding-bottom: 4rem;

  .content-heading {
    display: block;
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 16px;
    font-weight: normal;
    letter-spacing: 6px;
    margin: 0;
    padding-bottom: $content-space;
    text-transform: uppercase;
  }

  .title {
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }
}

#content.padded {
  padding: $content-space;
}

#content.mr-cart-open {
  margin-right: $cart-width-open;
  @media (max-width: $breakpoint-m) {
    margin-right: 0;
  }
}

#content.mr-cart-closed {
  margin-right: $cart-width-closed;
  @media (max-width: $breakpoint-m) {
    margin-right: 0;
  }
}

.verified {
  background: $gradient-highlight;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  justify-content: center;
  align-items: center;
  display: flex;
  margin-left: 0.5rem;
}

.vm--overlay {
  background-color: rgba(black, 0.5) !important;
}

.vm--modal {
  background-color: transparent !important;
  box-shadow: none !important;
  overflow: visible !important;
}

.modal-body {
  background-color: var(--bg-light-color);
  padding: $modal-space;
  text-align: center;
  box-shadow: var(--box-shadow);

  .loader {
    margin: $modal-space auto;
  }
}

.hidden {
  display: none;
}

.invisible {
  visibility: hidden;
}

.error {
  color: var(--error-color);
  margin-bottom: 0;
  margin-top: 0.5rem;
  font-size: 14px;
  &:before {
    content: '⚠️ ';
  }
}

.pointer {
  cursor: pointer;
}

@media (max-width: $breakpoint-m) {
  #app {
    flex-direction: column;
    position: relative;
  }

  #sidebar {
    /* bottom: $profile-image-size + $content-space * 2; offset for profile block */
    border-right: none;
    max-width: 100vw;
    position: fixed;
    top: 0;
    width: 100%;
    /* height: 64px; */
    z-index: 2;

    .clr-logo {
      margin-right: 0.5rem;
    }

    .menu-btn,
    .cart-btn {
      display: block;
      min-width: 25px;
      max-width: 20%;
      width: 25px;
    }

    .menu-btn {
      margin-right: 5%;
    }

    .cart-btn {
      margin-left: 5%;
    }
  }

  #nav-header {
    display: flex;
    align-items: center;
  }

  #footer {
    max-width: 100vw;
    padding: $content-space;
    > li {
      list-style-type: none;
    }
  }
}

.tooltip {
  display: block !important;
  z-index: 10000;

  .tooltip-inner {
    background: var(--bg-primary-color);
    color: var(--text-color);
    font-family: Inter;
    line-height: 150%;
    font-size: 14px;
    border: 1px solid $button-color;
    border-radius: 0.5rem;
    padding: 5px 10px 4px;
    max-width: 30ch;
    text-align: center;
  }

  .tooltip-arrow {
    width: 0;
    height: 0;
    border-style: solid;
    position: absolute;
    margin: 5px;
    border-color: $button-color;
    z-index: 1;
  }

  &[x-placement^='top'] {
    margin-bottom: 5px;

    .tooltip-arrow {
      border-width: 5px 5px 0 5px;
      border-left-color: transparent !important;
      border-right-color: transparent !important;
      border-bottom-color: transparent !important;
      bottom: -5px;
      left: calc(50% - 5px);
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  &[x-placement^='bottom'] {
    margin-top: 5px;

    .tooltip-arrow {
      border-width: 0 5px 5px 5px;
      border-left-color: transparent !important;
      border-right-color: transparent !important;
      border-top-color: transparent !important;
      top: -5px;
      left: calc(50% - 5px);
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  &[x-placement^='right'] {
    margin-left: 5px;

    .tooltip-arrow {
      border-width: 5px 5px 5px 0;
      border-left-color: transparent !important;
      border-top-color: transparent !important;
      border-bottom-color: transparent !important;
      left: -5px;
      top: calc(50% - 5px);
      margin-left: 0;
      margin-right: 0;
    }
  }

  &[x-placement^='left'] {
    margin-right: 5px;

    .tooltip-arrow {
      border-width: 5px 0 5px 5px;
      border-top-color: transparent !important;
      border-right-color: transparent !important;
      border-bottom-color: transparent !important;
      right: -5px;
      top: calc(50% - 5px);
      margin-left: 0;
      margin-right: 0;
    }
  }

  &.popover {
    .popover-inner {
      background: var(--bg-primary-color);
      color: var(--text-color);
      padding: 1rem;
      margin: 0.5rem;
      border-radius: 5px;
      box-shadow: 0 5px 30px rgba(black, 0.1);
    }

    .popover-arrow {
      border-color: var(--bg-primary-color);
    }
  }

  &[aria-hidden='true'] {
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.15s, visibility 0.15s;
  }

  &[aria-hidden='false'] {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.15s;
  }
}
</style>
