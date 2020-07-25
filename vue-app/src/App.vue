<template>
  <div id="app">
    <div id="nav">
      <img class="logo" alt="clr.fund" src="./assets/clr.png" />
      <div id="menu">
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
      </div>
    </div>
    <div id="content">
      <router-view />
    </div>
    <div id="cart">cart</div>
  </div>
</template>

<style lang="scss">
@import 'styles/vars';

html,
body {
  height: 100%;
  margin: 0;
}

html {
  background-color: $bg-primary-color;
  color: $text-color;
}

#app {
  display: flex;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  font-size: 14px;
  height: 100%;
}

#nav {
  background-color: $bg-secondary-color;
  border-right: $border;
  min-width: 20%;
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
    font-weight: bold;
    color: $text-color;
    display: block;
    margin-bottom: $content-space;
    text-decoration: none;

    &:hover {
      color: $highlight-color;
    }

    &.router-link-exact-active {
      color: $highlight-color;
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
        top: 0.05em;
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
    font-size: 14px;
    font-weight: lighter;
    letter-spacing: 0.5em;
    margin: 0 0 $content-space;
    padding-bottom: $content-space;
    text-transform: uppercase;
  }
}

#cart {
  background-color: $bg-secondary-color;
  min-width: 20%;
  padding: $content-space;
  text-align: center;
  width: 20%;
}
</style>
