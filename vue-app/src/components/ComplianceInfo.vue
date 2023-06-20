<template>
  <i18n-t :keypath="keypath" tag="p" scope="global">
    <template #link_1>
      <links :hideArrow="true" to="https://app.humanbound.xyz/">{{ $t('compliance.humanbound_sbt') }}</links>
    </template>
    <template #link_2>
      <links :hideArrow="true" to="https://esp.ethereum.foundation/">{{ $t('compliance.esp') }}</links>
    </template>
  </i18n-t>
</template>

<script setup lang="ts">
interface Props {
  keypath: string // translation key path
}

defineProps<Props>()
</script>
