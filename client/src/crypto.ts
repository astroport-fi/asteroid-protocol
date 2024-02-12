import { sha256 } from '@cosmjs/crypto'
import { toHex, toUtf8 } from '@cosmjs/encoding'

export function hashValue(val: string) {
  return toHex(sha256(toUtf8(val)))
}
