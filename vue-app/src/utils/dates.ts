import { DateTime } from 'luxon'
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
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  const diff = date.diff(now)
  const [days, hours, minutes, seconds] = diff
    .toFormat('d h m s')
    .split(' ')
    .map(Number)
  return { days, hours, minutes, seconds }
}
