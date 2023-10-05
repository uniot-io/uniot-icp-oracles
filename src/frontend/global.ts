import { Buffer } from 'buffer'

// @dfinity/agent requires this. Can be removed once it's fixed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).global = window

// Workaround for setting Buffer at a single and predictable place
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).Buffer = Buffer

export default {}
