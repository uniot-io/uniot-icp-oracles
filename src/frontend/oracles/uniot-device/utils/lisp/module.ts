import Module from './unlisp'

type ModuleInstanceType = {
  Module: typeof Module
  Api: {
    version: () => void
    terminate: () => void
    lisp_evaluate: () => void
  }
}

let instance: ModuleInstanceType | null = null

const loadModule = (resolve: (instance: ModuleInstanceType) => void) => {
  if (instance) {
    resolve && resolve(instance)
  } else {
    Module.onRuntimeInitialized = () => {
      const Api = {
        version: Module.cwrap('version', 'number', []),
        terminate: Module.cwrap('terminate', null, []),
        lisp_evaluate: Module.cwrap('lisp_evaluate', 'number', ['number', 'number', 'number', 'number'], {
          async: true
        })
      }
      instance = { Module, Api }
      resolve && resolve(instance)
    }
  }
}

const getModule = () => new Promise((resolve) => loadModule(resolve))

export default getModule
