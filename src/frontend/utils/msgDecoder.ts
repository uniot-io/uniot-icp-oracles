import * as CBOR from 'cbor-web'
import { MqttMessageType } from '@/types/mqtt'

export function decodeMessage(byteArray: Buffer, dataType: MqttMessageType): string {
  const textDecoded = new TextDecoder().decode(byteArray)
  try {
    switch (dataType.toLocaleLowerCase()) {
      case 'json':
        return JSON.parse(textDecoded)
      case 'cbor':
        return CBOR.decode(byteArray)
      case 'plaintext':
      default:
        return textDecoded
    }
  } catch (_) {
    return textDecoded
  }
}

export function decodeIntoJSON<T>(byteArray: Buffer, dataType: MqttMessageType): T {
  return decodeMessage(byteArray, dataType) as T
}

export function decodeIntoString(byteArray: Buffer, dataType: MqttMessageType): string {
  return JSON.stringify(decodeMessage(byteArray, dataType), null, 2)
}

export function convertPublishPayloadByType(
  value: string,
  type: MqttMessageType
): { payload: string | Buffer; type: string } {
  switch (type) {
    case 'CBOR':
      return { payload: CBOR.encode(JSON.parse(value)), type: 'JSON as CBOR' }
    case 'JSON':
      return { payload: Buffer.from(JSON.stringify(JSON.parse(value))), type }
    case 'PlainText':
      return { payload: Buffer.from(value), type }
    default:
      throw new Error(`Can not convert message of type "${type}". Add a handler`)
  }
}
