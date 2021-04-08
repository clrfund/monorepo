<template>
  <div id="app">
    <Nav :inApp="inApp" />
    <div id="content-container">
      <!-- TODO probably don't need both 'collapsed' & 'hidden' -->
      <div id="sidebar" :class="{'collapsed': sidebarCollapsed, 'hidden': sidebarCollapsed}">
        <div id="nav-menu">
          <div class="image-wrapper">
            <img src="@/assets/docking.png" height="100%" />
          </div>
          <div class="round">
            <h2>Eth2 CLR</h2>
            <div class="status"> 
              <div class="circle pulse open" /> Open
            </div>
          </div>

        <RoundInformation /> 
          <!-- <router-link to="/">Home</router-link>
          <router-link to="/projects">Projects</router-link>
          <router-link to="/rounds">Rounds</router-link>
          <router-link to="/recipients" v-if="hasRecipientRegistryLink()">Registry</router-link>
          <router-link to="/about">About</router-link>
          <router-link to="/join">Apply</router-link>
          <a href="https://blog.clr.fund" target=_blank>Blog</a>
          <a href="https://forum.clr.fund" target=_blank>Forum</a>
          <a href="https://github.com/clrfund/monorepo/" target="_blank" rel="noopener">GitHub</a> -->
        </div>
      </div>
      <!-- <div id="content">
        <div class="title">
          <h2 style="line-height: 130%; margin-bottom: 0.5rem;">Projects</h2>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <p style="line-height: 130%; margin: 0; ">Choose donation amounts for your favourite projects.</p>
            <router-link to="/join"><div class="btn">Add project</div></router-link>
          </div>
        </div>
      </div> -->
      <router-view :key="$route.path" />
      <!-- TODO probably don't need both 'collapsed' & 'hidden' -->
      <!-- <div id="user-bar" :class="{'collapsed': userBarCollapsed, 'hidden': userBarCollapsed}">
        <Profile />
        <Cart />
      </div> -->
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Watch } from 'vue-property-decorator'

import { recipientRegistryType } from '@/api/core'
import Cart from '@/components/Cart.vue'
import Profile from '@/components/Profile.vue'
import RoundInformation from '@/views/RoundInformation.vue'
import Nav from '@/components/Nav.vue'

import {
  LOAD_USER_INFO,
  LOAD_ROUND_INFO,
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
  components: { RoundInformation, Nav },
})
export default class App extends Vue {

  // Only for small screens
  sidebarCollapsed = false
  userBarCollapsed = true
  inApp = false
  created() {
    this.inApp = this.$route.name !== 'landing'
    this.userBarCollapsed = this.$route.name === 'landing'
    this.sidebarCollapsed = this.$route.name === 'landing'
    setInterval(() => {
      this.$store.dispatch(LOAD_ROUND_INFO)
    }, 60 * 1000)
    setInterval(() => {
      this.$store.dispatch(LOAD_USER_INFO)
    }, 60 * 1000)
  }

  updated() {
    this.userBarCollapsed = this.$route.name === 'landing'
    this.sidebarCollapsed = this.$route.name === 'landing'
  }

  toggleSidebar() {
    this.userBarCollapsed = true
    this.sidebarCollapsed = !this.sidebarCollapsed
  }

  toggleUserBar() {
    this.sidebarCollapsed = true
    this.userBarCollapsed = !this.userBarCollapsed
  }

  @Watch('$route', { immediate: true, deep: true })
  onNavigation() {
    this.sidebarCollapsed = true
    this.userBarCollapsed = true
  }

  hasRecipientRegistryLink(): boolean {
    return recipientRegistryType === 'optimistic'
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
  font-size: 16px;
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
  min-height: 100%;
}

#sidebar {
  background-color: $bg-primary-color;
  /* border-right: $border; */
  /* box-sizing: border-box; */
  flex-shrink: 0;
  padding: 1.5rem;
  width: 20%;
  height: 100%;

  .image-wrapper {
    border-radius: 8px;
    background: $clr-pink-dark-gradient;
    height: 160px;
    display: flex;
    justify-content: center;
  }

  .image-wrapper img {
    mix-blend-mode: exclusion;
    transform: rotate(15deg);
  }


  .round {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

.open{
  background: $clr-green;
}

.circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.pulse {
  animation: pulse-animation 2s infinite ease-out;
}

@keyframes pulse-animation {
  0% {
    box-shadow: 0 0 0 0px $bg-primary-color;
  }

  50% {
    box-shadow: 0 0 0 2.5px $clr-green;
  }

  100% {
    box-shadow: 0 0 0 5px $clr-pink;

  }
}


.master{
  color:black;
  float:right;
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
  background-color: $bg-light-color;
  flex-grow: 1;
  padding: $content-space;

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
    border-bottom: 1px solid rgba(115,117,166,1);
    margin-bottom: 2rem;
  }
}

#user-bar {
  background-color: $bg-light-color;
  flex-shrink: 0;
  min-width: 250px;
  max-width: 350px;
  width: 25%;
}

.loader {
  display: block;
  height: 40px;
  margin: $content-space auto;
  width: 40px;
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

@keyframes loader {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.hidden {
  display: none;
}

@media (max-width: 900px) {
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
    .ef-logo {
      margin: 0 auto 0 0;
      max-height: 100%;
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
      /* bottom: auto; */

      #nav-menu {
        display: none;
      }
    }
  }

  #nav-header {
    display: flex;
    align-items: center;
  }

  #content {
    margin-bottom: $profile-image-size + $content-space * 2; /* offset for profile block */
    padding: $nav-header-height 0 0 0;
  }

  #user-bar {
    bottom: 0;
    max-width: none;
    overflow-y: scroll;
    position: sticky;
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

  #footer {
    max-width: 100vw;
    padding: $content-space;
    > li {
      list-style-type: none;
    }
  }
}

</style>
