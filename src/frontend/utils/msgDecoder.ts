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
