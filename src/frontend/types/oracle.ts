import { MqttMessageType } from '@/types/mqtt'

export type OracleTemplateType = 'generic' | 'uniot_device'

export const OracleTemplate = {
  generic: 'generic' as OracleTemplateType,
  uniotDevice: 'uniot_device' as OracleTemplateType
}

export const OracleTemplateNames = {
  [OracleTemplate.generic]: 'Generic',
  [OracleTemplate.uniotDevice]: 'Uniot Device'
}

export const getOracleTemplateName = (template: string): string => {
  const knownTemplateName = OracleTemplateNames[template]
  return knownTemplateName || template
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

export interface OraclePublication extends OracleTopic {
  message: string
  signed: boolean
}
