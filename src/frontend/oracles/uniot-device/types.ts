import { MqttMessageUniotDeviceRawData } from '@/types/mqtt'

export interface UniotDeviceRawData {
  connection_id: number
  online: 0 | 1
  creator: string
  timestamp: number
  primitives: UniotDevicePrimitives[]
  public_key: string
  mqtt_size: number
  debug: 0 | 1
  d_in: 3
  d_out: 3
  a_in: 1
  a_out: 3
}

export interface UniotDeviceLogItem {
  type: string
  msg: string
  timestamp: number
}

export interface UniotDeviceTop {
  tasks: Record<string, [number, number]>
  idle: number
  timestamp: number
  uptime: number
}

export interface UniotDeviceMemory {
  tasks: Record<string, [number, number]>
  idle: number
  timestamp: number
  uptime: number
}

export interface UniotDeviceData {
  cid: string
  name: string
  description: string
  timestamp: MqttMessageUniotDeviceRawData['timestamp']
  public_key: MqttMessageUniotDeviceRawData['public_key']
  connection_id: MqttMessageUniotDeviceRawData['connection_id']
  creator: MqttMessageUniotDeviceRawData['creator']
  online: MqttMessageUniotDeviceRawData['online']
  primitives: string[]
  d_in: 3
  d_out: 3
  a_in: 1
  a_out: 3
}

export interface UniotDevice {
  name: string
  data: UniotDeviceData
}

export const UniotGenericDevicePrimitives = ['dwrite', 'dread', 'awrite', 'aread', 'bclicked']

export type UniotDevicePrimitives = 'dwrite' | 'dread' | 'awrite' | 'aread' | 'bclicked'

export type UniotDeviceEvents = 'is_event' | 'pop_event' | 'push_event'
