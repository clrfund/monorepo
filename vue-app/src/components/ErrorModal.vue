<template>
  <div class="modal-body">
    <div class="top">
      <p>{{ $t('errorModal.header') }}</p>
      <button class="close-button" @click="$emit('close')">
        <img class="pointer" src="@/assets/close.svg" />
      </button>
    </div>

    <div class="error overflow" v-if="isWrongKey">
      {{ $t('errorModal.wrong_key') }}
    </div>
    <div class="error overflow" v-else>{{ errorMessage }}</div>
  </div>
</template>

<script lang="ts">
import { WrongKeyError } from '@/utils/accounts'
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component
export default class ErrorModal extends Vue {
  @Prop() error!: unknown

  get isWrongKey(): boolean {
    return this.error instanceof WrongKeyError
  }

  get errorMessage(): string {
    return (this.error as Error).message
  }
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

.overflow {
  word-break: break-all;
  height: 150px;
  overflow-y: scroll;
}
</style>
