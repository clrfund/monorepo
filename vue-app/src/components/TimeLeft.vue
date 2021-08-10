<template>
  <span :class="valueClass || 'value'">
    {{ values[0] }}
    <span :class="unitClass || 'unit'">
      {{ units[0] }}
    </span>
    <span v-if="units[1].length > 0">
      {{ units[1].length > 0 && values[1] }}
      <span :class="unitClass || 'unit'">
        {{ units[1] }}
      </span>
    </span>
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

  get values(): number[] {
    if (this.timeLeft.days > 0) return [this.timeLeft.days, this.timeLeft.hours]
    if (this.timeLeft.hours > 0)
      return [this.timeLeft.hours, this.timeLeft.minutes]
    if (this.timeLeft.minutes > 0) return [this.timeLeft.minutes, 0]
    if (this.timeLeft.seconds > 0) return [this.timeLeft.seconds, 0]
    return [0, 0]
  }

  get units(): string[] {
    if (this.timeLeft.days > 0)
      return [this.unitPlurality('days'), this.unitPlurality('hours')]
    if (this.timeLeft.hours > 0)
      return [this.unitPlurality('hours'), this.unitPlurality('minutes')]
    if (this.timeLeft.minutes > 0) return [this.unitPlurality('minutes'), '']
    if (this.timeLeft.seconds > 0) return [this.unitPlurality('seconds'), '']
    return [this.unitPlurality('days'), this.unitPlurality('hours')]
  }

  unitPlurality(pluralUnit: string): string {
    return this.timeLeft[pluralUnit] !== 1
      ? `${pluralUnit}`
      : `${pluralUnit.substring(0, pluralUnit.length - 1)}`
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
