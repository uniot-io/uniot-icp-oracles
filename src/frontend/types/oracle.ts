import { MqttMessageType } from '@/types/mqtt'

export type OracleTemplateType = 'generic' | 'uniot_device'

export const OracleTemplate = {
  generic: 'generic' as OracleTemplateType,
  uniotDevice: 'uniot_device' as OracleTemplateType
}

export interface OracleTopic {
  topic: string
  msgType: MqttMessageType
}

export interface OracleSettings {
  name: string
  template: OracleTemplateType
  topics: OracleTopic[]
}
