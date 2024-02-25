import { BinaryReader, BinaryWriter } from 'cosmjs-types/binary.js'
import type { DeepPartial, Exact } from 'cosmjs-types/helpers.js'

/** ExtensionData is a data structure that can be used in transaction extensions. */
export interface ExtensionData {
  /**
   * protocol_id is the identifier of the protocol
   * the field is not used internally but it is validated for correctness
   */
  protocolId: string
  /**
   * protocol_version is the identifier of the protocol version
   * the field is not used internally but it is validated for correctness
   */
  protocolVersion: string
  /**
   * arbitrary bytes data that can be used to store any data
   * the field is not used internally but it is validated and must be provided
   */
  data: Uint8Array
}
export interface ExtensionDataProtoMsg {
  typeUrl: '/gaia.metaprotocols.ExtensionData'
  value: Uint8Array
}
/** ExtensionData is a data structure that can be used in transaction extensions. */
export interface ExtensionDataSDKType {
  protocol_id: string
  protocol_version: string
  data: Uint8Array
}
function createBaseExtensionData(): ExtensionData {
  return {
    protocolId: '',
    protocolVersion: '',
    data: new Uint8Array(),
  }
}
export const ExtensionData = {
  typeUrl: '/gaia.metaprotocols.ExtensionData',
  encode(
    message: ExtensionData,
    writer: BinaryWriter = BinaryWriter.create(),
  ): BinaryWriter {
    if (message.protocolId !== '') {
      writer.uint32(10).string(message.protocolId)
    }
    if (message.protocolVersion !== '') {
      writer.uint32(18).string(message.protocolVersion)
    }
    if (message.data.length !== 0) {
      writer.uint32(26).bytes(message.data)
    }
    return writer
  },
  decode(input: BinaryReader | Uint8Array, length?: number): ExtensionData {
    const reader =
      input instanceof BinaryReader ? input : new BinaryReader(input)
    let end = length === undefined ? reader.len : reader.pos + length
    const message = createBaseExtensionData()
    while (reader.pos < end) {
      const tag = reader.uint32()
      switch (tag >>> 3) {
        case 1:
          message.protocolId = reader.string()
          break
        case 2:
          message.protocolVersion = reader.string()
          break
        case 3:
          message.data = reader.bytes()
          break
        default:
          reader.skipType(tag & 7)
          break
      }
    }
    return message
  },
  fromPartial<I extends Exact<DeepPartial<ExtensionData>, I>>(
    object: I,
  ): ExtensionData {
    const message = createBaseExtensionData()
    message.protocolId = object.protocolId ?? ''
    message.protocolVersion = object.protocolVersion ?? ''
    message.data = object.data ?? new Uint8Array()
    return message
  },
  fromProtoMsg(message: ExtensionDataProtoMsg): ExtensionData {
    return ExtensionData.decode(message.value)
  },
  toProto(message: ExtensionData): Uint8Array {
    return ExtensionData.encode(message).finish()
  },
  toProtoMsg(message: ExtensionData): ExtensionDataProtoMsg {
    return {
      typeUrl: '/gaia.metaprotocols.ExtensionData',
      value: ExtensionData.encode(message).finish(),
    }
  },
}
