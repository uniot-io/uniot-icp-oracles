export type ControlEmitData = {
  value: number
  pin: number
}

export type ControlEmits = {
  (e: 'value:change', data: ControlEmitData): void
}
