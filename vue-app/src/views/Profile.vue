<template>
  <div class="modal-background" @click="toggleProfile">
    <div class="container">

    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component({
  components: {},
})
export default class NavBar extends Vue {
  @Prop() toggleProfile
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.modal-background {
  background: #0004;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.container {
  position: absolute;
  background: $bg-primary-color;
  height: 100%;
  right: 0;
  width: clamp(200px, 20%, 500px);
}
</style>