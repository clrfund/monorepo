<template>
  <div>
    <div class="modal-body">
      <div class="top">
        <p>{{ title || 'Unexpected error!' }}</p>
        <button class="close-button" @click="$emit('close')">
          <img class="pointer" src="@/assets/close.svg" />
        </button>
      </div>
      <div class="error">{{ message }}</div>
    </div>
  </div>
</template>

<script lang="ts">
// Libraries
import Vue from 'vue'
import { Prop } from 'vue-property-decorator'
import Component from 'vue-class-component'

@Component
export default class ErrorModal extends Vue {
  @Prop() title!: string // title on the modal
  @Prop() message!: string // Required: error message to display
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.vm--modal {
  background-color: transparent !important;
  box-shadow: none;
}

.modal-body {
  margin-top: $modal-space;
  text-align: left;
  background: var(--bg-secondary-color);
  border-radius: 1rem;
  display: grid;
  grid-gap: 10px;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -16px;
}

.close-button {
  background: transparent;
  border: none;
  img {
    filter: var(--img-filter, invert(0.3));
  }
}
</style>
