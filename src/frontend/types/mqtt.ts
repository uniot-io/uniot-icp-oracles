import type { UniotDeviceData } from './uniot'

export type MqttMessageType = 'COSE' | 'CBOR' | 'JSON' | 'PlainText'

export const MqttMessageTypes: MqttMessageType[] = ['COSE', 'CBOR', 'JSON', 'PlainText']

export type MqttMessageStatus = 'up-to-date' | 'outdated'

export type MqttMessageOrigin = 'actual' | 'foreign'

export type MqttMessageSecurity = 'unsigned' | 'broker-signed' | 'device-signed' | 'icp-signed' | 'invalid-sig'

export type MqttMessageDeviceEvent = {
  eventID: string
  value: number
  sender: {
    type: 'device' | 'emulator'
    id: string
  }
  timestamp: number
}

export interface MqttMessageDeviceScript {
  runtime: string
  version: string
  code: string
  timestamp: number
}

export type MqttMessageDeviceStatus = UniotDeviceData
