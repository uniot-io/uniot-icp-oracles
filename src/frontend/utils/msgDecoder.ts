import * as CBOR from 'cbor-web'
import { MqttMessageType } from '@/types/mqtt'

export function decodeMessage(byteArray: Buffer, dataType: MqttMessageType): string {
  const textDecoded = new TextDecoder().decode(byteArray)
  try {
    switch (dataType.toLocaleLowerCase()) {
      case 'json':
        return JSON.stringify(JSON.parse(textDecoded), null, 2)
      case 'cbor':
        return JSON.stringify(CBOR.decode(byteArray), null, 2)
      case 'plaintext':
      default:
        return textDecoded
    }
  } catch (_) {
    return textDecoded
  }
}
