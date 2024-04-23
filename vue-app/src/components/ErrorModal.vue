<template>
  <base-modal>
    <div class="modal-body">
      <div v-if="errorMessage">
        <div class="error">{{ errorMessage }}</div>
        <button class="btn-secondary close-btn" @click="emit('close')">
          {{ $t('close') }}
        </button>
      </div>
    </div>
  </base-modal>
</template>

<script setup lang="ts">
interface Props {
  errorMessage: string
}

defineProps<Props>()
const emit = defineEmits(['close'])
</script>

<style scoped lang="scss">
@import '../styles/vars';

.modal-body {
  text-align: left;
  background: var(--bg-secondary-color);
  border-radius: 1rem;
  box-shadow: var(--box-shadow);
  padding: 1.5rem;
}

.close-btn {
  margin: $modal-space auto 0;
}
</style>
