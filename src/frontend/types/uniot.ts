export interface UniotDeviceData {
  connection_id: number
  online: 0 | 1
  creator: string
  timestamp: number
  primitives: UniotDevicePrimitives[]
  // primitives: string[]
  // mqtt_size: number
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
