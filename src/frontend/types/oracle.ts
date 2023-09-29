import { MqttMessageTypes } from '@/types/mqtt'

export type OracleTopicParams = {
  name: string
  messageType: MqttMessageTypes | string
}
export type OracleParams = {
  name: string
  topics: OracleTopicParams[]
}

export type TopicMessage = string
