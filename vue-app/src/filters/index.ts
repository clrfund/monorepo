import Vue from 'vue'
import { FixedNumber } from 'ethers'
import { DateTime } from 'luxon'

Vue.filter('formatDate', (value: DateTime): string | null => {
  return value ? value.toLocaleString(DateTime.DATETIME_SHORT) : null
})

Vue.filter('formatAmount', (value: FixedNumber): string | null => {
  return value ? (value._value === '0.0' ? '0' : value.toString()) : null
})
