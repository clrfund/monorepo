import { DateTime } from 'luxon'
import * as humanizeDuration from 'humanize-duration'

export function formatDate(date: DateTime): string {
  return date.toFormat('MMMM dd')
}

export function hasDateElapsed(date: DateTime): boolean {
  return DateTime.local() >= date
}

export function getSecondsFromNow(date: DateTime): number {
  return date.diff(DateTime.local()).milliseconds / 1000
}

export function formatDateFromNow(date: DateTime): string {
  const difference = getSecondsFromNow(date)
  return humanizeDuration(difference, { largest: 1, units: ['mo', 'w', 'd', 'h', 'm'], round: true })
}