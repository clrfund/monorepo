<template>
  <div id="app">
    <div id="nav-bar" :class="{'collapsed': navBarCollapsed}">
      <div id="nav-header">
        <img
          class="menu-btn"
          alt="nav"
          src="@/assets/menu.svg"
          @click="toggleNavBar()"
        >
        <img class="logo" alt="clr.fund" src="@/assets/clr.svg" />
        <img
          class="cart-btn"
          alt="cart"
          src="@/assets/cart.svg"
          @click="toggleUserBar()"
        >
      </div>
      <div id="nav-menu">
        <router-link to="/">Projects</router-link>
        <router-link to="/rounds">Rounds</router-link>
        <router-link to="/about">About</router-link>
        <a href="https://blog.clr.fund" target=_blank>Blog</a>
        <a href="https://forum.clr.fund" target=_blank>Forum</a>
        <a href="https://github.com/clrfund/monorepo/" target="_blank" rel="noopener">GitHub</a>
      </div>
    </div>
    <div id="content">
      <router-view :key="$route.path" />
    </div>
    <div id="user-bar" :class="{'collapsed': userBarCollapsed}">
      <Profile />
      <Cart />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Watch } from 'vue-property-decorator'

import { getCurrentRound } from '@/api/round'
import Cart from '@/components/Cart.vue'
import Profile from '@/components/Profile.vue'
import { SET_CURRENT_ROUND_ADDRESS } from '@/store/mutation-types'
import {
  LOAD_USER_INFO,
  LOAD_ROUND_INFO,
  LOAD_CART,
  UNWATCH_CART,
  LOAD_CONTRIBUTOR_DATA,
  UNWATCH_CONTRIBUTOR_DATA,
} from '@/store/action-types'

@Component({
  name: 'clr.fund',
  metaInfo: {
    title: 'clr.fund',
    titleTemplate: 'clr.fund - %s',
    meta: [{
      name: 'git-commit',
      content: process.env.VUE_APP_GIT_COMMIT || '',
    }],
  },
  components: {
    Cart,
    Profile,
  },
})
export default class App extends Vue {

  // Only for small screens
  navBarCollapsed = true
  userBarCollapsed = true

  async created() {
    const currentRoundAddress = await getCurrentRound()
    if (this.$store.state.currentRoundAddress === null) {
      // Set round address on init, but only if necessary.
      // ProjectList component could have already set it.
      this.$store.dispatch(UNWATCH_CART)
      this.$store.dispatch(UNWATCH_CONTRIBUTOR_DATA)
      this.$store.commit(SET_CURRENT_ROUND_ADDRESS, currentRoundAddress)
      ;(async () => {
        await this.$store.dispatch(LOAD_ROUND_INFO)
        if (this.$store.state.currentUser) {
          // Load user data if already logged in
          await this.$store.dispatch(LOAD_USER_INFO)
          this.$store.dispatch(LOAD_CART)
          this.$store.dispatch(LOAD_CONTRIBUTOR_DATA)
        }
      })()
    }
    setInterval(() => {
      this.$store.dispatch(LOAD_ROUND_INFO)
    }, 60 * 1000)
    setInterval(() => {
      this.$store.dispatch(LOAD_USER_INFO)
    }, 60 * 1000)
  }

  toggleNavBar() {
    this.userBarCollapsed = true
    this.navBarCollapsed = !this.navBarCollapsed
  }

  toggleUserBar() {
    this.navBarCollapsed = true
    this.userBarCollapsed = !this.userBarCollapsed
  }

  @Watch('$route', { immediate: true, deep: true })
  onNavigation() {
    this.navBarCollapsed = true
    this.userBarCollapsed = true
  }
}
</script>

<style lang="scss">
@import 'styles/vars';
@import 'styles/fonts';

html,
body {
  height: 100%;
  margin: 0;
}

html {
  background-color: $bg-primary-color;
  color: $text-color;
  font-family: Inter, sans-serif;
  font-size: 14px;
}

a {
  color: $highlight-color;
  cursor: pointer;
  text-decoration: none;
}

.input {
  background-color: $bg-light-color;
  border: 2px solid $button-color;
  border-radius: 2px;
  box-sizing: border-box;
  color: $text-color;
  padding: 7px;

  &.invalid {
    border-color: $error-color;
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
  min-height: 100%;
}

#nav-bar {
  background-color: $bg-secondary-color;
  border-right: $border;
  box-sizing: border-box;
  flex-shrink: 0;
  min-width: 150px;
  max-width: 350px;
  padding: $content-space;
  width: 25%;

  .logo {
    display: block;
    margin-left: 15%;
    min-width: 150px - 2 * $content-space;
    max-width: 50%;
  }

  .menu-btn,
  .cart-btn {
    display: none;
  }
}

#nav-menu {
  margin-left: 15%;
  padding: 50px 5% 0;

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
  background-color: $bg-primary-color;
  flex-grow: 1;
  padding: $content-space;

  .content-heading {
    display: block;
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 14px;
    font-weight: normal;
    letter-spacing: 6px;
    margin: 0;
    padding-bottom: $content-space;
    text-transform: uppercase;
  }
}

#user-bar {
  background-color: $bg-light-color;
  flex-shrink: 0;
  min-width: 250px;
  max-width: 350px;
  width: 25%;
}

.vm--modal {
  background-color: transparent !important;
}

.modal-body {
  background-color: $bg-light-color;
  padding: $modal-space;
  text-align: center;
}

.loader {
  display: block;
  width: 40px;
  height: 40px;
  margin: $modal-space auto;
}

.loader:after {
  content: " ";
  display: block;
  width: 32px;
  height: 32px;
  margin: 4px;
  border-radius: 50%;
  border: 6px solid #fff;
  border-color: #fff transparent #fff transparent;
  animation: loader 1.2s linear infinite;
}

@keyframes loader {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  #app {
    flex-direction: column;
  }

  #nav-bar {
    bottom: $profile-image-size + $content-space * 2; /* offset for profile block */
    border-right: none;
    max-width: 100%;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 2;

    .logo {
      height: $nav-header-height-sm;
      margin: 0 auto;
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

    &.collapsed {
      bottom: auto;

      #nav-menu {
        display: none;
      }
    }
  }

  #nav-header {
    display: flex;
  }

  #content {
    margin-bottom: $profile-image-size + $content-space * 2; /* offset for profile block */
    margin-top: $nav-header-height-sm + $content-space * 2; /* offset for nav header */
  }

  #user-bar {
    bottom: 0;
    max-width: none;
    overflow-y: scroll;
    position: fixed;
    top: $nav-header-height-sm + $content-space * 2; /* offset for nav header */
    width: 100%;
    z-index: 1;

    .cart {
      min-height: auto;
    }

    &.collapsed {
      top: auto;

      .cart {
        display: none;
      }
    }
  }
}
</style>
