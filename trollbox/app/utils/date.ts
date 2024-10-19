export function getDateFromUTCString(date: string) {
  return new Date(date + 'Z')
}
