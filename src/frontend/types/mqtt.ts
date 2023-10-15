export type MqttMessageType = 'JSON' | 'CBOR' | 'PlainText'

export const MqttMessageTypes: MqttMessageType[] = ['JSON', 'CBOR', 'PlainText']

export type MqttMessageStatus = 'up-to-date' | 'outdated'

export type MqttMessageSecurity = 'unsecured'
