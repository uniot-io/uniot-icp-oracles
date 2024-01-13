import type { UniotDeviceData } from './uniot'

export type MqttMessageType = 'JSON' | 'CBOR' | 'PlainText'

export const MqttMessageTypes: MqttMessageType[] = ['JSON', 'CBOR', 'PlainText']

export type MqttMessageStatus = 'up-to-date' | 'outdated'

export type MqttMessageSecurity = 'unsecured' | 'secured'

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
