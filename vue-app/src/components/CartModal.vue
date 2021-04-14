<template>
  <div id="modal">
    <cart />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Cart from './Cart.vue'


@Component({
  components: {
    Cart,
  },
})
export default class CartModal extends Vue {

}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.close-btn {
  margin-top: $modal-space;
  color: white;
  text-decoration: underline;
  font-size: 16px;
  cursor: pointer;
}

#back {
    background: $bg-primary-color;
    padding: 1rem;
    box-shadow: 0px -1px 0px 0px 115,117,166,1 inset;
}

#modal {
    font-family: Inter;
    height: 100%;
    top: 64;
    background: red;
    width: 100%;
}

#modal-body {
    background: $bg-primary-color;
    height: 100%;
    padding: 1rem;
    padding-top: 3rem;
    box-shadow: 0px -1px 0px 0px 115,117,166,1 inset;
}

.btn {
  padding: 0.5rem 1.5rem;
  margin: 0 auto;
  border-radius: 2rem;
  color: white;
  font-family: Inter;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 150%;
  text-align: center;
  background: none;
  border: none;
}

.btn-primary {
  background: #16C8B5;
  margin-top: 2rem;
}
</style>