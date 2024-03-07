import { createCookie } from '@remix-run/cloudflare'

export const USER_ADDRESS_COOKIE = 'user-address'

export const userAddressCookie = createCookie(USER_ADDRESS_COOKIE)

export function serializeCookieValue(value: string) {
  return Buffer.from(JSON.stringify(value)).toString('base64')
}

export function deserializeCookieValue(value: string) {
  return JSON.parse(Buffer.from(value, 'base64').toString())
}

export function getAddress(request: Request): Promise<string> {
  const cookieHeader = request.headers.get('Cookie')
  return userAddressCookie.parse(cookieHeader)
}
