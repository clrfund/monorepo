import { DateTime } from 'luxon'
import * as humanizeDuration from 'humanize-duration'
import { TimeLeft } from '@/api/round'

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

export function getTimeLeft(date: DateTime): TimeLeft {
  const now = DateTime.local()
  if (now >= date) {
    return { days: 0, hours: 0, minutes: 0 }
  }
  const { days, hours, minutes } = date.diff(now, ['days', 'hours', 'minutes'])
  return { days, hours, minutes: Math.ceil(minutes) }
}

// TODO handle dates in the past (difference < 0, returns '0 seconds')
export function formatDateFromNow(date: DateTime): string {
  if (!date) {
    return '...' //  TODO best place to do this?
  }
  const difference = getMillisecondsFromNow(date)
  return humanizeDuration(difference, { largest: 1, units: ['mo', 'w', 'd', 'h', 'm'], round: true })
}