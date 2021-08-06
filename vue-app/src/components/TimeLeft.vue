<template>
  <span
    v-if="
      timeLeft.days === 0 &&
      timeLeft.hours === 0 &&
      timeLeft.minutes === 0 &&
      timeLeft.seconds === 0
    "
    :class="valueClass || 'value'"
  >
    {{ timeLeft.days }}
    <span :class="unitClass || 'unit'"
      >day{{ timeLeft.days !== 1 ? 's' : '' }}</span
    >
    {{ timeLeft.hours }}
    <span :class="unitClass || 'unit'"
      >hour{{ timeLeft.hours !== 1 ? 's' : '' }}</span
    >
  </span>
  <span v-else-if="timeLeft.days > 0" :class="valueClass || 'value'">
    {{ timeLeft.days }}
    <span :class="unitClass || 'unit'"
      >day{{ timeLeft.days !== 1 ? 's' : '' }}</span
    >
    {{ timeLeft.hours }}
    <span :class="unitClass || 'unit'"
      >hour{{ timeLeft.hours !== 1 ? 's' : '' }}</span
    >
  </span>
  <span v-else-if="timeLeft.hours > 0" :class="valueClass || 'value'">
    {{ timeLeft.hours }}
    <span :class="unitClass || 'unit'"
      >hour{{ timeLeft.hours !== 1 ? 's' : '' }}</span
    >
    {{ timeLeft.minutes }}
    <span :class="unitClass || 'unit'"
      >minute{{ timeLeft.minutes !== 1 ? 's' : '' }}</span
    >
  </span>
  <span v-else-if="timeLeft.minutes > 0" :class="valueClass || 'value'">
    {{ timeLeft.minutes }}
    <span :class="unitClass || 'unit'"
      >minute{{ timeLeft.minutes !== 1 ? 's' : '' }}</span
    >
  </span>
  <span v-else-if="timeLeft.seconds > 0" :class="valueClass || 'value'">
    {{ timeLeft.seconds }}
    <span :class="unitClass || 'unit'"
      >second{{ timeLeft.seconds !== 1 ? 's' : '' }}</span
    >
  </span>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { DateTime } from 'luxon'
import { Prop } from 'vue-property-decorator'

import { getTimeLeft } from '@/utils/dates'
import { TimeLeft } from '@/api/round'

@Component
export default class extends Vue {
  @Prop() date!: DateTime
  @Prop() valueClass!: string
  @Prop() unitClass!: string

  get timeLeft(): TimeLeft {
    return getTimeLeft(this.date)
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.value {
  font-size: 24px;
  font-family: 'Glacial Indifference', sans-serif;
  color: white;
  font-weight: 700;
  line-height: 120%;

  &.large {
    font-size: 32px;
    line-height: 120%;
  }

  &.extra {
    font-size: 32px;
    font-family: 'Glacial Indifference', sans-serif;
    color: white;
    line-height: 120%;
  }
}

.unit {
  color: white;
  font-family: 'Glacial Indifference', sans-serif;
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  line-height: 150%;
  margin: 0 0.25rem;

  &:last-child {
    margin-right: 0;
  }
}

.flex {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
