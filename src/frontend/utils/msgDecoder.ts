import * as CBOR from 'cbor-web'
import { MqttMessageType } from '@/types/mqtt'
import COSE from './cose'

export function decodeMessage(byteArray: Buffer, dataType: MqttMessageType): unknown {
  const textDecoded = new TextDecoder().decode(byteArray)
  try {
    switch (dataType.toLocaleLowerCase()) {
      case 'json':
        return JSON.parse(textDecoded)
      case 'cbor':
        return CBOR.decode(byteArray)
      case 'cose':
        return CBOR.decode(COSE.read(byteArray))
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
  const decoded = decodeMessage(byteArray, dataType)
  if (typeof decoded === 'string') {
    return decoded
  }
  return JSON.stringify(decoded, null, 2)
}

export function convertPublishPayloadByType(value: string, type: MqttMessageType): { payload: Buffer; type: string } {
  switch (type.toLocaleLowerCase()) {
    case 'cose':
      return { payload: COSE.build(CBOR.encode(JSON.parse(value))), type }
    case 'cbor':
      return { payload: CBOR.encode(JSON.parse(value)), type }
    case 'json':
      return { payload: Buffer.from(JSON.stringify(JSON.parse(value))), type }
    case 'plaintext':
      return { payload: Buffer.from(value), type }
    default:
      throw new Error(`Can not convert message of type "${type}". Add a handler`)
  }
}
