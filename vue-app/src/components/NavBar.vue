<template>
  <nav id="nav-bar">
    <router-link v-if="!inApp" to="/">
      <img class="ef-logo" alt="ethereum foundation" src="@/assets/eth-diamond-rainbow.svg" />
    </router-link>
    <router-link v-else to="/projects">
      <img class="ef-logo" alt="ethereum foundation" src="@/assets/eth-diamond-rainbow.svg" />
    </router-link>
    <div class="btn-row">
      <div class="dropdown">
        <button @click="openDropdown()" v-if="inApp" class="dropdown-btn">...</button>
        <div id="myDropdown" class="button-menu">
          <router-link to="/">About</router-link>
          <router-link to="/">About</router-link>
          <router-link to="/">About</router-link>
        </div>
      </div>
      <CartWidget v-if="inApp" />
      <router-link v-if="!inApp" to="/projects" class="app-btn">
          App
      </router-link>
      <WalletWidget v-if="inApp" />
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
  @Prop() isStepValid
  profileImageUrl: string | null = null

  // get currentUser(): User | null {
  //   return this.$store.state.currentUser
  // }

}

function openDropdown() {
  document.getElementById('myDropdown').classList.toggle('show')
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
  z-index: 1;
  display: flex;
  padding: 0 1.5rem;
  height: 64px;
  justify-content: space-between;
  align-items: center;
  background: $bg-secondary-color;

 .btn-row {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .dropdown-btn {
    background: rgba(44,41,56,1);
    border: 1px solid rgba(115,117,166,0.3);
    border-radius: 8px;
    padding: 0.25rem 0.5rem;
    color: white;
    margin-right: 0.5rem;
    display: flex;
    font-size: 16px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .button-menu {
    display: none;
    position: absolute;
    background-color: $bg-secondary-color;
    min-width: 160px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    z-index: 1;
    cursor: pointer;
  }

  .show {
    display: block;
  }

  .dropdown {
    position: relative;
    display: inline-block;
  }

  .button-menu router-link {
    font-size: 16px;
  }

  .ef-logo {
    margin: 0;
    /* max-height: 100%; */
    height: 75%;
  }
}
</style>
