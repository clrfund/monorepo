<template>
  <span class="flex round-info-value">
    <h2 :class="valueClass || ''">
      {{ values[0] }}
      <h4 :class="unitClass || ''">
        {{ units[0] }}
      </h4>
    </h2>
    <span v-if="units[1].length > 0">
      <h2 :class="valueClass || ''">
        {{ values[1] }}
        <h4 :class="unitClass || ''">
          {{ units[1] }}
        </h4>
      </h2>
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

  timeLeft: TimeLeft = getTimeLeft(this.date)
  interval

  mounted() {
    this.interval = setInterval(() => {
      this.timeLeft = getTimeLeft(this.date)
    }, 1000)
  }

  beforeDestroy() {
    clearInterval(this.interval)
  }

  get values(): number[] {
    if (this.timeLeft.days > 0) return [this.timeLeft.days, this.timeLeft.hours]
    if (this.timeLeft.hours > 0)
      return [this.timeLeft.hours, this.timeLeft.minutes]
    if (this.timeLeft.minutes > 5) return [this.timeLeft.minutes, 0]
    if (this.timeLeft.minutes > 0)
      return [this.timeLeft.minutes, this.timeLeft.seconds]
    if (this.timeLeft.seconds > 0) return [this.timeLeft.seconds, 0]
    return [0, 0]
  }

  get units(): string[] {
    if (this.timeLeft.days > 0)
      return [this.unitPlurality('days'), this.unitPlurality('hours')]
    if (this.timeLeft.hours > 0)
      return [this.unitPlurality('hours'), this.unitPlurality('minutes')]
    if (this.timeLeft.minutes > 5) return [this.unitPlurality('minutes'), '']
    if (this.timeLeft.minutes > 0)
      return [this.unitPlurality('minutes'), this.unitPlurality('seconds')]
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

.round-info-value {
  h2 {
    margin: 0;
  }

  h4 {
    margin: 0;
    display: inline;
  }
}

.flex {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
