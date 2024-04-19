<template>
  <vue-final-modal class="modal-container" :click-to-close="false" :esc-to-close="false">
    <slot></slot>
  </vue-final-modal>
</template>

<script setup>
import { VueFinalModal } from 'vue-final-modal'
</script>
