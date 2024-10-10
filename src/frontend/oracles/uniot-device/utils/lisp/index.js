import { buildLibrary } from './library'

const MAX_TASK_ITERATIONS = 9999

let isEvaluating = false

let instance = null

const setWasmInstance = (wasm) => {
  instance = wasm
}

const lispTerminate = () => {
  instance?.Api.terminate()
}

const lispEval = async (maxHeap, library, script, stateHandler = null, taskLimiter = MAX_TASK_ITERATIONS) => {
  if (!instance) {
    return null
  }
  if (isEvaluating) {
    return null
  }
  isEvaluating = true

  const { Module, Api } = instance

  const inputPtr = Module._malloc(script.length + 1)
  const libraryPtr = Module._malloc(library.length + 1)
  const outputPtr = Module._malloc(10485760)
  const handlerAnswerPtr = Module._malloc(64)

  if (stateHandler) {
    Module.lisp_handler = (value, wakeUp) => {
      // eslint-disable-next-line
      new Promise(async (resolve) => {
        try {
          // eslint-disable-next-line
          resolve(await stateHandler(value))
        } catch (err) {
          console.warn(err) // eslint-disable-line no-console
          resolve('()')
        }
      }).then((result) => {
        Module.writeAsciiToMemory(result, handlerAnswerPtr, false)
        wakeUp(handlerAnswerPtr)
      })
    }
  } else {
    Module.lisp_handler = null
  }

  Module.writeAsciiToMemory(script, inputPtr, false)
  Module.writeAsciiToMemory(library, libraryPtr, false)
  await Api.lisp_evaluate(maxHeap, libraryPtr, inputPtr, outputPtr, taskLimiter)
  const result = JSON.parse(Module.AsciiToString(outputPtr))

  Module._free(inputPtr)
  Module._free(outputPtr)
  Module._free(handlerAnswerPtr)

  isEvaluating = false
  return result
}

const lispMinimalHandler = (value) => {
  const ask = value.split(' ')
  const fn = ask[0]
  switch (fn) {
    case 'task':
      return ask[3]
    default:
      return '()'
  }
}

/**
 * @typedef {Object} ExecutionResult
 * @property {Object} output - Interpretator output
 * @property {string} [error]
 */
/**
 * Execute uLisp script.
 * @param {string} script
 * @param {Function} handler
 * @param {string} [taskLimiter]
 * @returns {Promise<ExecutionResult>}
 */
const lispExecute = async (script, handler, taskLimiter) => {
  const _config = {
    handler,
    maxHeap: 10000,
    taskLimiter: taskLimiter || MAX_TASK_ITERATIONS
  }
  try {
    const output = await lispEval(_config.maxHeap, buildLibrary(script), script, _config.handler, _config.taskLimiter)
    return { output }
  } catch (error) {
    return { error: error.message }
  }
}

export { setWasmInstance, lispTerminate, lispMinimalHandler, lispExecute }
