<template>
  <nav id="nav-bar">
    <router-link v-if="!inApp" to="/">
      <img class="ef-logo" alt="ethereum foundation" src="@/assets/eth-diamond-rainbow.svg" />
    </router-link>
    <router-link v-else to="/projects">
      <img class="ef-logo" alt="ethereum foundation" src="@/assets/eth-diamond-rainbow.svg" />
    </router-link>
    <div class="btn-row">
      <div class="help-dropdown" v-if="inApp" >
        <img @click="openHelpDropdown()" class="dropdown-btn" src="@/assets/help.svg" />
        <div id="myHelpDropdown" class="button-menu">
          <div class="dropdown-title">Help</div>
          <div v-for="({ to, href, text, emoji }, idx) of helpDropdownItems" :key="idx" class="dropdown-item">
            <template v-if="href">
              <a :href="href" target="_blank">
                <div>{{ emoji }}</div>
                <p class="item-text">{{ text }} ↗</p>
              </a>
            </template>
            <template v-else>
              <router-link :to="to">
                <div class="emoji-wrapper">{{ emoji }}</div>
                <p class="item-text">{{ text }}</p>
              </router-link>
            </template>
          </div>
        </div>
      </div>
      <div class="dropdown" v-if="inApp" >
        <img @click="openDropdown()" class="dropdown-btn" src="@/assets/more.svg" />
        <div id="myDropdown" class="button-menu">
          <div v-for="({ to, href, text, emoji }, idx) of dropdownItems" :key="idx" class="dropdown-item">
            <template v-if="href">
              <a :href="href" target="_blank">
                <div>{{ emoji }}</div>
                <p class="item-text">{{ text }} ↗</p>
              </a>
            </template>
            <template v-else>
              <router-link :to="to">
                <div class="emoji-wrapper">{{ emoji }}</div>
                <p class="item-text">{{ text }}</p>
              </router-link>
            </template>
          </div>
        </div>
      </div>
      <cart-widget v-if="inApp" />
      <wallet-widget class="wallet-widget" v-if="inApp" />
      <router-link v-if="!inApp" to="/projects" class="app-btn">
        App
      </router-link>
    </div>
  </nav>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import WalletWidget from './WalletWidget.vue'
import CartWidget from './CartWidget.vue'
import { Prop } from 'vue-property-decorator'

@Component({
  components: { WalletWidget, CartWidget },
})
export default class NavBar extends Vue {
  @Prop() inApp
  profileImageUrl: string | null = null
  dropdownItems: {to?: string; href?: string; text: string; emoji: string}[] = [
    { to: '/', text: 'About', emoji: 'ℹ️' },
    { to: '/join', text: 'Add project', emoji: '➕' },
    { href: 'https://github.com/clrfund/monorepo/', text: 'Code', emoji: '👾' },
    { href: 'https://github.com/clrfund/monorepo/', text: 'Docs', emoji: '📑' },
    { to: '#', text: 'Light Mode', emoji: '🔆' },
  ]
  helpDropdownItems: {to?: string; href?: string; text: string; emoji: string}[] = [
    { to: '/about-round', text: 'About the round', emoji: '⚙️' },
    { to: '/about-maci', text: 'Bribery protection', emoji: '🤑' },
    { to: '/about-sybil-resistance', text: 'Sybil resistance', emoji: '👤' },
    { to: '/about-layer2', text: 'About [layer 2]', emoji: '🚀' },
  ]

  openDropdown(): void {
    document.getElementById('myDropdown')?.classList.toggle('show')
  }

  openHelpDropdown(): void {
    document.getElementById('myHelpDropdown')?.classList.toggle('show')
  }
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropdown-btn')) {
    const dropdowns = document.getElementsByClassName('button-menu')
    let i 
    for (i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i]
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show')
      }
    }
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

  .wallet-widget {
    margin-left: 0.5rem;
  }

  .btn-row {
    display: flex;
    flex-direction: row;
    align-items: center;

    .dropdown {
      position: relative;
      display: inline-block;

      .button-menu {
        display: none;
        flex-direction: column;
        position: absolute;
        top: 2rem;
        right: 0.5rem;
        background: $bg-secondary-color;
        border: 1px solid rgba(115,117,166,0.3);
        border-radius: 0.5rem;
        min-width: 160px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
        cursor: pointer;
        overflow: hidden;

        .dropdown-item a {
          display: flex;
          align-items: center;
          padding: 0.5rem; 
          gap: 0.5rem;
          &:hover {
            background: $bg-light-color;
          }
          
          .item-text {
            margin: 0;
            color: $text-color;
          }
        }
      }
      .show {
        display: flex;
      }

    }
  }

  .help-dropdown {
      position: relative;
      display: inline-block;

      .button-menu {
        display: none;
        flex-direction: column;
        position: absolute;
        top: 2rem;
        right: 0.5rem;
        background: $bg-secondary-color;
        border: 1px solid rgba(115,117,166,0.3);
        border-radius: 0.5rem;
        min-width: 160px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
        cursor: pointer;
        overflow: hidden;

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
          &:hover {
            background: $bg-light-color;
          }
          
          .item-text {
            margin: 0;
            color: $text-color;
          }
        }
      }
      .show {
        display: flex;
      }
    }

  .button-menu router-link {
    font-size: 16px;
  }

  .ef-logo {
    margin: 0;
    height: 2.25rem;
    vertical-align: middle;
  }
}
</style>
