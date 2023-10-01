import { MqttMessageType } from '@/types/mqtt'

export type OracleTopicSettings = {
  messageType: MqttMessageType
}

export type OracleTopics = {
  name: string
  settings: OracleTopicSettings
}

export type OracleSettings = {
  name: string
  topics: OracleTopics[]
}
