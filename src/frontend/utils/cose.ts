import cose from 'cose-js'
import type { HeaderParameters, sign } from 'cose-js'

declare module 'cose-js' {
  interface Key {
    raw: Buffer | null
  }

  namespace sign {
    function createUnsigned(headers: HeaderParameters, payload: Buffer, options: sign.CreateOptions): Buffer
  }
}

export default class COSE {
  static verify(msg: Buffer, publicKey: Buffer | null) {
    const verifier: sign.Signer = {
      key: {
        raw: publicKey
      }
    }
    return cose.sign.verifySync(msg, verifier)
  }

  static read(msg: Buffer) {
    try {
      this.verify(msg, null)
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore @types/cose-js doesn't have the "common" namespace
      if (error instanceof cose.common.ErrorWithValue) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return error.value
      } else {
        throw error
      }
    }
  }

  static build(payload: Buffer) {
    return cose.sign.createUnsigned({}, payload, {})
  }
}
