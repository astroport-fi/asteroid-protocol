export const DATETIME_FORMAT = 'MMM d yyyy h:mm a'
export const DATE_FORMAT = 'MMM d yyyy'

export function getDateAgo(value: Date | string, short = false) {
  if (!(value instanceof Date)) value = new Date(value)

  const now = new Date()
  const localTime = new Date(
    value.getTime() - value.getTimezoneOffset() * 60000,
  )

  const seconds: number = Math.floor(
    (now.getTime() - localTime.getTime()) / 1000,
  )
  let interval: number = Math.floor(seconds / 31536000)

  if (interval > 1) {
    if (short) {
      return `${interval}y`
    }
    return interval + ' years ago'
  }
  interval = Math.floor(seconds / 2592000)
  if (interval > 1) {
    if (short) {
      return `${interval}m`
    }
    return interval + ' months ago'
  }
  interval = Math.floor(seconds / 86400)
  if (interval > 1) {
    if (short) {
      return `${interval}d`
    }
    return interval + ' days ago'
  }
  interval = Math.floor(seconds / 3600)
  if (interval > 1) {
    if (short) {
      return `${interval}h`
    }
    return interval + ' hours ago'
  }
  interval = Math.floor(seconds / 60)
  if (interval > 1) {
    if (short) {
      return `${interval}m`
    }
    return interval + ' minutes ago'
  }
  if (short) {
    return `${interval}s`
  }
  return Math.floor(seconds) + ' seconds ago'
}
