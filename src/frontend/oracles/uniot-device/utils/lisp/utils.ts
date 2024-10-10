/**
 * Mapping of LISP type codes to type descriptions.
 */
export const LISP_TYPES: Readonly<Record<number, string>> = Object.freeze({
  0: 'Unknown',
  1: 'Int',
  2: 'Bool',
  3: 'BoolInt',
  4: 'Symbol',
  5: 'Cell',
  6: 'Any'
})

/**
 * Mapping of type descriptions to LISP type codes.
 */
export const LISP_TYPES_REVERSED: Readonly<Record<string, number>> = Object.freeze({
  [LISP_TYPES[0]]: 0,
  [LISP_TYPES[1]]: 1,
  [LISP_TYPES[2]]: 2,
  [LISP_TYPES[3]]: 3,
  [LISP_TYPES[4]]: 4,
  [LISP_TYPES[5]]: 5,
  [LISP_TYPES[6]]: 6
})

/**
 * Mapping of LISP boolean values to JavaScript boolean values.
 */
export const LISP_TO_BOOL: Readonly<Record<string, boolean>> = Object.freeze({
  '#t': true,
  '()': false
})

/**
 * Mapping of JavaScript boolean values to LISP boolean values.
 */
export const BOOL_TO_LISP: Readonly<Record<string, string>> = Object.freeze({
  true: '#t',
  false: '()'
})

/**
 * Class representing an UnLisp primitive.
 */
export class Primitive {
  /**
   * The name of the primitive function.
   * @private
   */
  private _name: string

  /**
   * The types of the parameters that the primitive accepts.
   * @protected
   */
  protected _paramTypes: number[]

  /**
   * The return type of the primitive.
   * @private
   */
  private _returnType: number | null

  /**
   * The register IDs.
   * @private
   */
  private _registerIds: number[]

  /**
   * Creates an instance of Primitive.
   * @param name - The name of the primitive function.
   * @param registerIds - The array of register IDs.
   * @param paramTypes - The types of the parameters for the primitive function.
   * @param returnType - The return type of the primitive.
   */
  constructor(name: string, registerIds: number[] = [], paramTypes: number[] = [], returnType: number | null = null) {
    this._name = name
    this._registerIds = registerIds
    this._paramTypes = paramTypes
    this._returnType = returnType
  }

  /**
   * Gets the name of the primitive function.
   *
   * @returns The name of the primitive.
   */
  public getName(): string {
    return this._name
  }

  /**
   * Sets the parameter types for the primitive function.
   *
   * @param value - The array of parameter types.
   */
  public setParamTypes(value: number[]): void {
    this._paramTypes = value
  }

  /**
   * Gets the array of parameter types for the primitive function.
   *
   * @returns The parameter types.
   */
  public getParamTypes(): number[] {
    return this._paramTypes
  }

  /**
   * Sets a specific parameter type by index.
   *
   * @param index - The index of the parameter.
   * @param value - The type of the parameter.
   */
  public setParamType(index: number, value: number): void {
    this._paramTypes[index] = value
  }

  /**
   * Gets a specific parameter type by index.
   *
   * @param index - The index of the parameter.
   * @returns The LISP type code of the parameter.
   */
  public getParamType(index: number): number {
    return this._paramTypes[index]
  }

  /**
   * Sets the return type for the primitive.
   *
   * @param value - The type of the return value.
   */
  public setReturnType(value: number | null): void {
    this._returnType = value
  }

  /**
   * Gets the return type for the primitive.
   *
   * @returns The return type.
   */
  public getReturnType(): number | null {
    return this._returnType
  }

  /**
   * Adds a register to the primitive.
   *
   * @param register - The register ID to add.
   */
  public addRegister(register: number): void {
    this._registerIds.push(register)
  }

  /**
   * Returns the list of register IDs.
   *
   * @returns Array of register IDs.
   */
  public getRegisterIds(): number[] {
    return this._registerIds
  }

  /**
   * Checks if the provided primitive is the current primitive instance.
   *
   * @param primitive - The primitive instance or name to compare.
   * @returns True if it matches, otherwise false.
   * @throws If the argument is neither a Primitive instance nor a string.
   */
  public is(primitive: Primitive | string): boolean {
    if (!(primitive instanceof Primitive) && typeof primitive !== 'string') {
      throw new TypeError(
        `Invalid argument: Expected either an instance of Primitive or a primitive name as string, but received type ${typeof primitive}`
      )
    }
    return this === primitive || (typeof primitive === 'string' && this.getName() === primitive)
  }

  /**
   * Converts a LISP value to a JavaScript value.
   * If the value is a LISP boolean ('#t', '()'), it returns the corresponding JavaScript boolean.
   * If the value is numeric, it returns the numeric value.
   * Otherwise, it returns the value as-is.
   *
   * @param value - The LISP value to convert.
   * @returns The converted JavaScript value.
   */
  public static fromLispValue(value: string): boolean | number | string {
    if (value in LISP_TO_BOOL) {
      return LISP_TO_BOOL[value]
    } else if (!isNaN(Number(value))) {
      return Number(value)
    } else {
      return value
    }
  }

  /**
   * Converts a JavaScript value to a LISP value.
   * If the value is a boolean, it converts to the corresponding LISP boolean ('#t', '()').
   * If the value is a number, it returns the number.
   * Otherwise, it returns the value as-is, assuming that it's a Symbol.
   *
   * @param value - The JavaScript value to convert.
   * @returns The converted LISP value.
   */
  public static toLispValue(value: boolean | number | string | null): string | number {
    if (value === null) {
      return BOOL_TO_LISP['false']
    }
    if (typeof value === 'boolean') {
      return BOOL_TO_LISP[value.toString()] // Boolean can not be used as a plain object keys
    }
    const maybeNumber = Number(value)
    if (!isNaN(maybeNumber)) {
      return maybeNumber
    }
    return value
  }

  /**
   * Returns the LISP type code of a given LISP value.
   *
   * @param lispValue - The value to check.
   * @returns The LISP type code (e.g., 1 for 'Int').
   */
  public static lispValueToTypeCode(lispValue: string | number | boolean): number {
    if (typeof lispValue === 'string' && lispValue in LISP_TO_BOOL) {
      return LISP_TYPES_REVERSED['Bool']
    } else if (typeof lispValue === 'string' && !isNaN(Number(lispValue))) {
      return LISP_TYPES_REVERSED['Int']
    } else {
      return LISP_TYPES_REVERSED['Symbol']
    }
  }

  /**
   * Returns the LISP type code of a given JavaScript value.
   *
   * @param jsValue - The value to check.
   * @returns The LISP type code (e.g., 1 for 'Int').
   */
  public static jsValueToTypeCode(jsValue: string | number | boolean): number {
    if (typeof jsValue === 'boolean') {
      return LISP_TYPES_REVERSED['Bool']
    } else if (typeof jsValue === 'number') {
      return LISP_TYPES_REVERSED['Int']
    } else {
      return LISP_TYPES_REVERSED['Symbol']
    }
  }

  /**
   * Converts a numeric LISP type code to its readable string representation.
   *
   * @param value - The numeric LISP type code (e.g., 1 for 'Int').
   * @returns The string representation of the LISP type.
   */
  public static typeCodeToString(value: number): string {
    return LISP_TYPES[value]
  }
}
