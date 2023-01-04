<template>
  <!--
    Tell the vue-i18n-extract the following keys are used
    $t('navBar.dropdown.home')
    $t('navBar.dropdown.about')
    $t('navBar.dropdown.how')
    $t('navBar.dropdown.maci')
    $t('navBar.dropdown.sybil')
    $t('navBar.dropdown.code')
    $t('navBar.dropdown.layer2')
    $t('navBar.dropdown.recipients')
    $t('navBar.dropdown.rounds')
  -->
  <nav id="nav-bar">
    <links to="/">
      <img
        class="clr-logo"
        :alt="$store.getters.operator"
        src="@/assets/clr.svg"
      />
    </links>
    <div class="btn-row">
      <div>
        <img
          @click="toggleTheme()"
          class="navbar-btn"
          :src="require(`@/assets/${themeIcon}`)"
        />
      </div>
      <div class="help-dropdown" v-click-outside="closeHelpDropdown">
        <img
          @click="toggleHelpDropdown()"
          class="navbar-btn"
          src="@/assets/help.svg"
        />
        <div id="myHelpDropdown" class="button-menu" v-if="showHelpDropdown">
          <div
            v-for="({ to, text, emoji }, idx) of dropdownItems"
            :key="idx"
            class="dropdown-item"
            @click="closeHelpDropdown"
          >
            <links :to="to">
              <div class="emoji-wrapper">{{ emoji }}</div>
              <p class="item-text">{{ $t(text) }}</p>
            </links>
          </div>
          <!-- language -->
          <div v-if="langs.length > 1">
            <div class="hr"></div>
            <div
              @click="changeLang(lang)"
              v-for="lang of langs"
              :key="lang"
              class="dropdown-item"
            >
              <a>
                <div class="emoji-wrapper">{{ languageEmoji(lang) }}</div>
                <p class="item-text">
                  {{ languageDescription(lang) }}
                </p>
                <div v-if="currentLocale === lang">✔️</div>
              </a>
            </div>
          </div>
        </div>
      </div>
      <wallet-widget class="wallet-widget" v-if="inApp" />
      <app-link v-if="!inApp" class="app-btn"></app-link>
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
import AppLink from './AppLink.vue'
import { chain, ThemeMode } from '@/api/core'
import Trans from '@/plugins/i18n/translations'
import { TOGGLE_THEME } from '@/store/mutation-types'
import { lsGet, lsSet } from '@/utils/localStorage'
import { isValidTheme, getOsColorScheme } from '@/utils/theme'
import ClickOutside from '@/directives/ClickOutside'

@Component({
  components: { WalletWidget, CartWidget, Links, AppLink },
  directives: {
    ClickOutside,
  },
})
export default class NavBar extends Vue {
  @Prop() inApp
  showHelpDropdown = false
  profileImageUrl: string | null = null

  dropdownItems: { to?: string; text: string; emoji: string }[] = [
    { to: '/', text: 'navBar.dropdown.home', emoji: '🏠' },
    {
      to: '/about',
      text: 'navBar.dropdown.about',
      emoji: 'ℹ️',
    },
    {
      to: '/about/how-it-works',
      text: 'navBar.dropdown.how',
      emoji: '⚙️',
    },
    {
      to: '/about/maci',
      text: 'navBar.dropdown.maci',
      emoji: '🤑',
    },
    {
      to: '/about/sybil-resistance',
      text: 'navBar.dropdown.sybil',
      emoji: '👤',
    },
    {
      to: 'https://github.com/clrfund/monorepo/',
      text: 'navBar.dropdown.code',
      emoji: '👾',
    },
    {
      to: '/recipients',
      text: 'navBar.dropdown.recipients',
      emoji: '💎',
    },
    {
      to: 'rounds',
      text: 'navBar.dropdown.rounds',
      emoji: '⏰',
    },
  ]
  langs: string[] = Trans.supportedLocales

  created() {
    const savedTheme = lsGet(this.themeKey)
    const theme = isValidTheme(savedTheme) ? savedTheme : getOsColorScheme()
    this.$store.commit(TOGGLE_THEME, theme)

    const savedLanguage = lsGet(this.languageKey)
    if (Trans.isLocaleSupported(savedLanguage)) {
      Trans.changeLocale(savedLanguage)
    }

    if (chain.isLayer2) {
      this.dropdownItems.splice(-1, 0, {
        to: '/about/layer-2',
        text: 'navBar.dropdown.layer2',
        emoji: '🚀',
      })
    }
  }

  closeHelpDropdown(): void {
    this.showHelpDropdown = false
  }

  toggleHelpDropdown(): void {
    this.showHelpDropdown = !this.showHelpDropdown
  }

  toggleTheme(): void {
    this.$store.commit(TOGGLE_THEME)
    lsSet(this.themeKey, this.$store.state.theme)
  }

  get themeIcon(): string {
    return this.$store.state.theme === ThemeMode.LIGHT
      ? 'half-moon.svg'
      : 'sun.svg'
  }

  get themeKey(): string {
    return 'theme'
  }

  get languageKey(): string {
    return 'language'
  }

  get currentLocale(): string {
    return Trans.currentLocale
  }

  changeLang(lang: string): void {
    Trans.changeLocale(lang)
    lsSet(this.languageKey, lang)
  }

  languageDescription(lang: string): string {
    return Trans.localeDescription(lang)
  }

  languageEmoji(lang: string): string {
    return Trans.localeEmoji(lang)
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
  background: $clr-black;
  box-shadow: $box-shadow-nav-bar;
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
      background: var(--bg-secondary-color);
      border: 1px solid rgba($border-light, 0.3);
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
          color: var(--text-color);
        }
        &:hover {
          background: var(--bg-light-color);
        }

        .item-text {
          margin: 0;
          color: var(--text-color);
        }
      }

      .hr {
        width: 100%;
        border-bottom: 1px solid rgba($border-light, 0.3);
        margin: 10px 0;
      }
    }
  }

  .lang-dropdown {
    display: inline-block;
    margin-left: 0.5rem;
    .button-menu {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 2rem;
      right: 0.5rem;
      background: var(--bg-secondary-color);
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
      .dropdown-item {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        gap: 0.5rem;
        width: 176px;
        &:after {
          color: var(--text-color);
        }
        &:hover {
          background: var(--bg-light-color);
        }
        .item-text {
          margin: 0;
          color: var(--text-color);
        }
      }
    }
  }

  .button-menu links {
    font-size: 16px;
  }

  .clr-logo {
    margin: 0;
    height: 2.25rem;
    vertical-align: middle;
  }

  .margin-right {
    margin-right: 0.5rem;
  }
}
</style>
