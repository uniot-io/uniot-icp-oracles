export type MqttMessageType = 'JSON' | 'CBOR' | 'PlainText'

export const MqttMessageTypes: MqttMessageType[] = ['JSON', 'CBOR', 'PlainText']

export type MqttMessageStatus = 'up-to-date' | 'outdated'

export type MqttMessageSecurity = 'unsecured'

export type MqttMessageUserDeviceEvent = {
  eventID: string
  value: number
  sender: {
    type: 'device' | 'emulator'
    id: string
  }
  timestamp: number
}
