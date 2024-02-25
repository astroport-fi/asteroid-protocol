import { BinaryReader, BinaryWriter } from 'cosmjs-types/binary.js'
import type { DeepPartial, Exact } from 'cosmjs-types/helpers.js'

export interface Inscription {
  parentType: string
  parentIdentifier: string
  metadata: Uint8Array
  content: Uint8Array
}
export interface InscriptionProtoMsg {
  typeUrl: '/asteroid.Inscription'
  value: Uint8Array
}
export interface InscriptionSDKType {
  parent_type: string
  parent_identifier: string
  metadata: Uint8Array
  content: Uint8Array
}
function createBaseInscription(): Inscription {
  return {
    parentType: '',
    parentIdentifier: '',
    metadata: new Uint8Array(),
    content: new Uint8Array(),
  }
}
export const Inscription = {
  typeUrl: '/asteroid.Inscription',
  encode(
    message: Inscription,
    writer: BinaryWriter = BinaryWriter.create(),
  ): BinaryWriter {
    if (message.parentType !== '') {
      writer.uint32(10).string(message.parentType)
    }
    if (message.parentIdentifier !== '') {
      writer.uint32(18).string(message.parentIdentifier)
    }
    if (message.metadata.length !== 0) {
      writer.uint32(26).bytes(message.metadata)
    }
    if (message.content.length !== 0) {
      writer.uint32(34).bytes(message.content)
    }
    return writer
  },
  decode(input: BinaryReader | Uint8Array, length?: number): Inscription {
    const reader =
      input instanceof BinaryReader ? input : new BinaryReader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseInscription()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.parentType = reader.string()
          break
        case 2:
          message.parentIdentifier = reader.string()
          break
        case 3:
          message.metadata = reader.bytes()
          break
        case 4:
          message.content = reader.bytes()
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },
  fromPartial<I extends Exact<DeepPartial<Inscription>, I>>(
    object: I,
  ): Inscription {
    const message = createBaseInscription()
    message.parentType = object.parentType ?? ''
    message.parentIdentifier = object.parentIdentifier ?? ''
    message.metadata = object.metadata ?? new Uint8Array()
    message.content = object.content ?? new Uint8Array()
    return message
  },
  fromProtoMsg(message: InscriptionProtoMsg): Inscription {
    return Inscription.decode(message.value)
  },
  toProto(message: Inscription): Uint8Array {
    return Inscription.encode(message).finish()
  },
  toProtoMsg(message: Inscription): InscriptionProtoMsg {
    return {
      typeUrl: '/asteroid.Inscription',
      value: Inscription.encode(message).finish(),
    }
  },
}
