<template>
  <div>
    {{ $d(startDate.toJSDate(), 'short') }}
    &ndash;
    {{ $d(endDate.toJSDate(), 'short') }}
  </div>
</template>

<script setup lang="ts">
import type { DateTime } from 'luxon'

interface Props {
  startDate: DateTime
  endDate: DateTime
}

defineProps<Props>()
</script>
