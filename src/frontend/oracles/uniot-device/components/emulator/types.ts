import type { Component } from 'vue'
import { UniotDevice, UniotDevicePrimitives } from '@/oracles/uniot-device/types'

export type ControlEmitData = {
  value: number
  pin: number
}

export type ControlEmits = {
  (e: 'value:change', data: ControlEmitData): void
}

export type EmulatorEmits = {
  (e: 'update:log', data: string): void
  (e: 'update:emulation', status: boolean): void
}

export type AvailablePrimitivesType = {
  name: string
  component: Component
  keyInDevice?: 'd_in' | 'd_out' | 'a_out' | 'a_in'
}

export type EmulatorViewPropsType = {
  device: UniotDevice
  script: string
  log: string
  emulation: boolean
  available: boolean
}

export type EmulatorStateType = {
  [key in UniotDevicePrimitives]: Record<number, boolean | number>
}

export type EmulatorDataType = {
  type: UniotDevicePrimitives
  name: string
  component: Component
  pins: number[]
}
