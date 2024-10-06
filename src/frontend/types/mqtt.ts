export const MqttMessageTypes = ['COSE', 'CBOR', 'JSON', 'PlainText'] as const

export type MqttMessageType = 'COSE' | 'CBOR' | 'JSON' | 'PlainText'

export type MqttMessageStatus = 'up-to-date' | 'outdated'

export type MqttMessageOrigin = 'actual' | 'foreign'

export type MqttMessageSecurity = 'unsigned' | 'broker-signed' | 'device-signed' | 'icp-signed' | 'invalid-sig'

export type MqttMessageUniotDeviceEvent = {
  eventID: string
  value: number
  sender: {
    type: 'device' | 'emulator'
    id: string
  }
  timestamp: number
}

export interface MqttMessageUniotDeviceTop {
  tasks: Record<string, [number, number]>
  idle: number
  timestamp: number
  uptime: number
}

export interface MqttMessageUniotDeviceMemory {
  tasks: Record<string, [number, number]>
  idle: number
  timestamp: number
  uptime: number
}

export interface MqttMessageUniotDeviceRawData {
  connection_id: number
  online: 0 | 1
  creator: string
  timestamp: number
  primitives: Record<string, [number, number[]]>[]
  public_key: string
  mqtt_size: number
  debug: 0 | 1
}

export interface MqttMessageUniotDeviceScript {
  runtime: string
  version: string
  code: string
  timestamp: number
}

export type MqttMessageUniotDeviceStatus = MqttMessageUniotDeviceRawData
