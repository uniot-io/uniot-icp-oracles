import { MqttMessageType } from '@/types/mqtt'

export type OracleTopic = {
  topic: string
  msgType: MqttMessageType
}

export type OracleSettings = {
  name: string
  template: string
  topics: OracleTopic[]
}
