export type MqttMessageType = 'JSON' | 'CBOR' | 'Base64' | 'Hex' | 'PlainText'

export const MqttMessageTypes: MqttMessageType[] = ['JSON', 'CBOR', 'Base64', 'Hex', 'PlainText']

export type MqttMessageStatus = 'up-to-date' | 'outdated'

export type MqttMessageSecurity = 'unsecured'
