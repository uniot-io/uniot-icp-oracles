export interface UniotDeviceData {
  connection_id: number
  online: 0 | 1
  creator: string
  timestamp: number
  // primitives: string[]
  // mqtt_size: number
  // d_in: 3
  // d_out: 3
  // a_in: 1
  // a_out: 3
}

export interface UniotDevice {
  name: string
  data: UniotDeviceData
}
