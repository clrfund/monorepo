<template>
  <div id="app">
    <div id="nav">
      <img class="logo" alt="clr.fund" src="./assets/clr.svg" />
      <div id="menu">
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
      </div>
    </div>
    <div id="content">
      <router-view />
    </div>
    <div id="cart">
      <Profile />
      <div>cart</div>
    </div>
  </div>
</template>

<script lang="ts">
import Profile from '@/components/Profile.vue'

export default {
  name: 'clr.fund',
  components: {
    Profile,
  },
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
}

.btn {
  background-color: $button-color;
  border: none;
  border-radius: 20px;
  color: $text-color;
  cursor: pointer;
  font-weight: bold;
  line-height: 150%;
  padding: 7px 20px;

  &:hover {
    background-color: $highlight-color;
    color: $bg-secondary-color;
  }
}

#app {
  display: flex;
  font-family: Inter, sans-serif;
  font-size: 14px;
  height: 100%;
}

#nav {
  background-color: $bg-secondary-color;
  border-right: $border;
  min-width: 20%;
  padding: $content-space;
  width: 20%;

  .logo {
    margin-left: 15%;
    max-width: 50%;
  }
}

#menu {
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

  h1 {
    border-bottom: $border;
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 14px;
    font-weight: normal;
    letter-spacing: 6px;
    margin: 0 0 $content-space;
    padding-bottom: $content-space;
    text-transform: uppercase;
  }
}

#cart {
  background-color: #2c2938;
  min-width: 20%;
  text-align: center;
  width: 20%;
}
</style>
