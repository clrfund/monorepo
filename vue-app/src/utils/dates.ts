import { DateTime } from 'luxon'
import * as humanizeDuration from 'humanize-duration'

export function formatDate(date: DateTime): string {
  return date.toFormat('MMMM dd, yyyy')
}

export function hasDateElapsed(date: DateTime): boolean {
  return date.diff(DateTime.local()).milliseconds < 0
}

export function getDifferenceFromNow(date: DateTime): number {
  return date.diff(DateTime.local()).milliseconds
}

export function formatDateFromNow(date: DateTime): string {
  const difference = getDifferenceFromNow(date)
  return humanizeDuration(difference, { largest: 1 })
}