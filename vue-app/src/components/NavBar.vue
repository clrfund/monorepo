<template>
  <nav id="nav-bar">
    <router-link v-if="!inApp" to="/">
      <img class="ef-logo" alt="ethereum foundation" src="@/assets/eth-diamond-rainbow.svg" />
    </router-link>
    <router-link v-else to="/projects">
      <img class="ef-logo" alt="ethereum foundation" src="@/assets/eth-diamond-rainbow.svg" />
    </router-link>
    <div class="btn-row">
      <router-link v-if="inApp" to="/">
        <div class="dropdown-btn">
          ...
        </div>
      </router-link>
      <button class="dropdown-btn" v-if="inApp" @click="openCart()">
          <img
          alt="cart"
          class="cart-btn"
          width="16px"
          style="margin-right: 0.5rem"
          src="@/assets/cart.svg"
        > 
          Cart
      </button>
      <router-link v-if="!inApp" to="/projects">
        <div class="app-btn">
          App
        </div>
      </router-link>
      <!-- <Profile /> -->
    </div>
  </nav>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
// import Profile from './Profile.vue'
import CartModal from './CartModal.vue'
import { Prop } from 'vue-property-decorator'

@Component
export default class NavBar extends Vue {
  @Prop() inApp;
  profileImageUrl: string | null = null

  // get currentUser(): User | null {
  //   return this.$store.state.currentUser
  // }
  openCart(): void {
    this.$modal.show(
      CartModal,
      { },
      { width: 500 },
    )
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
  padding: 1rem 1.5rem;
  justify-content: space-between;
  background: $bg-secondary-color;

 .btn-row {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .app-btn,
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
    /* box-sizing: border-box; */
  }

  .app-btn {
    padding: 0.25rem 1.25rem;
    background: $clr-pink-light-gradient;
    border: none;
    border-radius: 1rem;
  }
  .ef-logo {
    margin: 0;
    /* max-height: 100%; */
    height: 100%;
  }
}
</style>
