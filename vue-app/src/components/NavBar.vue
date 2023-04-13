<template>
  <nav id="nav-bar">
    <links to="/">
      <img class="clr-logo" :alt="operator" src="@/assets/clr.svg" />
    </links>
    <div class="btn-row">
      <div>
        <img class="navbar-btn" :src="sunImageUrl" @click="toggleTheme()" />
      </div>
      <div v-click-outside="closeHelpDropdown" class="help-dropdown">
        <img class="navbar-btn" src="@/assets/help.svg" @click="toggleHelpDropdown()" />
        <div v-if="showHelpDropdown" id="myHelpDropdown" class="button-menu">
          <div class="dropdown-item" @click="closeHelpDropdown">
            <links to="/">
              <div class="emoji-wrapper">🏠</div>
              <p class="item-text">{{ $t('navBar.dropdown.home') }}</p>
            </links>
          </div>
          <div class="dropdown-item" @click="closeHelpDropdown">
            <links to="/about">
              <div class="emoji-wrapper">ℹ️</div>
              <p class="item-text">{{ $t('navBar.dropdown.about') }}</p>
            </links>
          </div>

          <div class="dropdown-item" @click="closeHelpDropdown">
            <links to="/about/how-it-works">
              <div class="emoji-wrapper">⚙️</div>
              <p class="item-text">{{ $t('navBar.dropdown.how') }}</p>
            </links>
          </div>
          <div class="dropdown-item" @click="closeHelpDropdown">
            <links to="/about/maci">
              <div class="emoji-wrapper">🤑</div>
              <p class="item-text">{{ $t('navBar.dropdown.maci') }}</p>
            </links>
          </div>
          <div class="dropdown-item" @click="closeHelpDropdown">
            <links to="/about/sybil-resistance">
              <div class="emoji-wrapper">👤</div>
              <p class="item-text">{{ $t('navBar.dropdown.sybil') }}</p>
            </links>
          </div>
          <div v-if="chain.isLayer2" class="dropdown-item" @click="closeHelpDropdown">
            <links to="/about/layer-2">
              <div class="emoji-wrapper">🚀</div>
              <p class="item-text">{{ $t('navBar.dropdown.layer2') }}</p>
            </links>
          </div>
          <div class="dropdown-item" @click="closeHelpDropdown">
            <links to="/rounds">
              <div class="emoji-wrapper">⏰</div>
              <p class="item-text">{{ $t('navBar.dropdown.rounds') }}</p>
            </links>
          </div>
          <div class="dropdown-item" @click="closeHelpDropdown">
            <links to="/recipients">
              <div class="emoji-wrapper">💎</div>
              <p class="item-text">{{ $t('navBar.dropdown.recipients') }}</p>
            </links>
          </div>
          <div class="dropdown-item" @click="closeHelpDropdown">
            <links to="https://github.com/clrfund/monorepo/">
              <div class="emoji-wrapper">👾</div>
              <p class="item-text">{{ $t('navBar.dropdown.code') }}</p>
            </links>
          </div>
          <!-- language -->
          <div v-if="languages.length > 1">
            <div class="hr"></div>
            <div @click="onChangeLang(lang.locale)" v-for="lang of languages" :key="lang.locale" class="dropdown-item">
              <a>
                <div class="emoji-wrapper">{{ lang.emoji }}</div>
                <p class="item-text">
                  {{ lang.description }}
                </p>
                <div v-if="locale === lang.locale">✔️</div>
              </a>
            </div>
          </div>
        </div>
      </div>
      <wallet-widget v-if="inApp" class="wallet-widget" />
      <links v-if="!inApp" to="/projects" class="app-btn">{{ $t('navBar.app') }}</links>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { chain, ThemeMode } from '@/api/core'
import { lsGet, lsSet } from '@/utils/localStorage'
import { isValidTheme, getOsColorScheme } from '@/utils/theme'
import { useAppStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { languages, isLocaleSupported } from '@/plugins/i18n'
import { useI18n } from 'vue-i18n'
import { getAssetsUrl } from '@/utils/url'

const { locale } = useI18n()

const appStore = useAppStore()
const { operator } = storeToRefs(appStore)

interface Props {
  inApp: any
}

defineProps<Props>()

const showHelpDropdown = ref(false)
const themeIcon = computed<string>(() => {
  return appStore.theme === ThemeMode.LIGHT ? 'half-moon.svg' : 'sun.svg'
})
const sunImageUrl = computed(() => getAssetsUrl(themeIcon.value))
const themeKey = computed<string>(() => 'theme')
const languageKey = 'language'

onMounted(() => {
  const savedTheme = lsGet(themeKey.value)
  const theme = isValidTheme(savedTheme) ? savedTheme : getOsColorScheme()
  appStore.toggleTheme(theme)

  const savedLanguage = lsGet(languageKey)
  if (isLocaleSupported(savedLanguage)) {
    locale.value = savedLanguage
    lsSet(languageKey, locale.value)
  }
})

function onChangeLang(lang: string) {
  locale.value = lang
}

function closeHelpDropdown(): void {
  showHelpDropdown.value = false
}

function toggleHelpDropdown(): void {
  showHelpDropdown.value = !showHelpDropdown.value
}

function toggleTheme(): void {
  appStore.toggleTheme()
  lsSet(themeKey.value, appStore.theme)
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
