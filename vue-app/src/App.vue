<template>
  <div id="app" class="wrapper">
    <nav-bar :in-app="isInApp" />
    <div id="content-container">
      <div id="sidebar" :class="{ hidden: isSidebarCollapsed, desktop: true }">
          <round-information />
      </div>
      <div id="content" :class="{ padded: !isSidebarCollapsed && !isCartPadding }">
        <router-view :key="$route.path" />
      </div>
      <div id="cart" :class="{ hidden: isSideCartCollapsed, desktop: true }">
        <cart-widget class="cart-widget" />
      </div>
    </div>
    <mobile-tabs :class="{ hidden: isSidebarCollapsed, mobile: true }" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Watch } from 'vue-property-decorator'

import { recipientRegistryType } from '@/api/core'
// import Cart from '@/components/Cart.vue'
// import WalletWidget from '@/components/WalletWidget.vue'
import RoundInformation from '@/views/RoundInformation.vue'
import NavBar from '@/components/NavBar.vue'
import CartWidget from '@/components/CartWidget.vue'
import Cart from '@/components/Cart.vue'
import MobileTabs from '@/components/MobileTabs.vue'

import { LOAD_USER_INFO, LOAD_ROUND_INFO } from '@/store/action-types'

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
  components: { RoundInformation, NavBar, Cart, MobileTabs, CartWidget },
})
export default class App extends Vue {
  created() {
    this.$store.dispatch(LOAD_ROUND_INFO) // TODO confirm we should fetch this info immediately
    this.$store.dispatch(LOAD_USER_INFO) // TODO confirm we should fetch this info immediately

    // TODO clearInterval on unmount
    setInterval(() => {
      this.$store.dispatch(LOAD_ROUND_INFO)
    }, 60 * 1000)
    setInterval(() => {
      this.$store.dispatch(LOAD_USER_INFO)
    }, 60 * 1000)
  }

  get isInApp(): boolean {
    return this.$route.name !== 'landing'
  }

  get isSidebarCollapsed(): boolean {
    const routes = ['landing', 'projectAdded', 'join', 'joinStep', 'round information']
    return routes.includes(this.$route.name || '')
  }

  get isSideCartCollapsed(): boolean {
    // Collapse side-cart on any page where sidebar is collapsed, and also on
    // the `/cart` path since this natively displays the `Cart` component
    return this.isSidebarCollapsed || this.$route.name === 'cart'
  }

  get isCartPadding(): boolean {
    const routes = ['cart']
    return routes.includes(this.$route.name || '')
  }
}
</script>

<style lang="scss">
@import "styles/vars";
@import "styles/fonts";
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
  background-color: $bg-primary-color;
  color: $text-color;
  font-family: Inter, sans-serif;
  font-size: 16px;
}

a {
  color: $highlight-color;
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

.desktop {
  @media (max-width: $breakpoint-m) {
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
  background-color: $bg-light-color;
  border: 2px solid $button-color;
  border-radius: 2px;
  box-sizing: border-box;
  color: $text-color;
  font-family: Inter, sans-serif;
  font-size: 16px;
  padding: 7px;

  &.invalid {
    border-color: $error-color;
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
  color: $text-color;
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
    color: $bg-secondary-color;
  }

  &[disabled],
  &[disabled]:hover {
    background-color: $button-disabled-color !important;
    color: $button-disabled-text-color !important;
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
  height: calc(100vh - 61.5px);
  background: $bg-primary-color;
  overflow-x: clip;
  /* overflow-y: scroll; */
}

#sidebar {
  background-color: $bg-primary-color;
  /* border-right: $border; */
  /* box-sizing: border-box; */
  flex-shrink: 0;
  padding: 1.5rem;
  width: 20%;
  height: 100%;

  .master {
    color: black;
    float: right;
  }

  .status {
    font-size: 16px;
    display: flex;
    align-items: center;
  }

  .round-info-div {
    background: $bg-light-color;
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

#nav-menu {
  /* margin-left: 15%;
  padding: 50px 5% 0; */

  a {
    color: $text-color;
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
        content: "";
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
    font-family: "Glacial Indifference", sans-serif;
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

.verified {
  background: $clr-pink-light-gradient;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  justify-content: center;
  align-items: center;
  display: flex;
  margin-left: 0.5rem;
}

.vm--modal {
  background-color: transparent !important;
}

.modal-body {
  background-color: $bg-light-color;
  padding: $modal-space;
  text-align: center;

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
  color: $error-color;
  margin-bottom: 0;
  margin-top: 0.5rem;
  font-size: 14px;
  &:before {
    content: "⚠️ "
  }
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

  /* #content {
    margin-bottom: $profile-image-size + $content-space * 2; // profile offset
  } */

  #footer {
    max-width: 100vw;
    padding: $content-space;
    > li {
      list-style-type: none;
    }
  }
}
</style>
