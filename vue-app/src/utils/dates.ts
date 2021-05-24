import { DateTime } from 'luxon'
import * as humanizeDuration from 'humanize-duration'

export function formatDate(date: DateTime): string {
  if (!date) {
    return '...' //  TODO best place to do this?
  }
  return date.toFormat('MMMM dd')
}

export function hasDateElapsed(date: DateTime): boolean {
  return DateTime.local() >= date
}


export function getMillisecondsFromNow(date: DateTime): number {
  return date.diff(DateTime.local()).milliseconds
}

export function getSecondsFromNow(date: DateTime): number {
  return getMillisecondsFromNow(date) / 1000
}
// TODO handle dates in the past (difference < 0, returns '0 seconds')
export function formatDateFromNow(date: DateTime): string {
  if (!date) {
    return '...' //  TODO best place to do this?
  }
  const difference = getMillisecondsFromNow(date)
  return humanizeDuration(difference, { largest: 1, units: ['mo', 'w', 'd', 'h', 'm'], round: true })
}