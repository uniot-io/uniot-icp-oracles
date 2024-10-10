import { UniotDevicePrimitives, UniotDeviceEvents } from '@/types/uniot'

type LibraryType = {
  name: UniotDevicePrimitives | UniotDeviceEvents
  params: string[]
}
const PREDEFINED_LIBRARY: LibraryType[] = [
  {
    name: 'dwrite',
    params: ['pin', 'state']
  },
  {
    name: 'dread',
    params: ['pin']
  },
  {
    name: 'awrite',
    params: ['pin', 'value']
  },
  {
    name: 'aread',
    params: ['pin']
  },
  {
    name: 'bclicked',
    params: ['button_id']
  },
  {
    name: 'is_event',
    params: ['event']
  },
  {
    name: 'pop_event',
    params: ['event']
  },
  {
    name: 'push_event',
    params: ['event', 'value']
  }
]

const createUserLibraryBlock = (primitives: LibraryType[]) => {
  if (!primitives || !primitives.length) {
    return ''
  }

  return (
    ';;; begin-user-library\n' +
    ';; This block describes the library of user functions.\n' +
    ';; So the editor knows that your device implements it.\n' +
    ';\n' +
    buildLibraryFromPrimitives(primitives)
      .map((v) => '; ' + v)
      .join('\n') +
    '\n' +
    ';\n' +
    ';;; end-user-library\n\n'
  )
}

const parseUserLibraryBlock = (code: string): LibraryType[] => {
  const library: LibraryType[] = []
  const lines = code.split('\n')
  let isLibrary = false
  for (const line of lines) {
    if (line.includes('begin-user-library')) {
      isLibrary = true
    } else if (line.includes('end-user-library')) {
      isLibrary = false
    } else if (isLibrary) {
      const match = line.match(/\(defjs\s+(\w+)\s+\((.+)\)\)/)
      if (match) {
        const name = match[1] as UniotDevicePrimitives
        const params = match[2].split(' ').filter((v) => v !== '')
        library.push({ name, params })
      }
    }
  }
  return isLibrary ? [] : library
}

const buildLibraryFromPrimitives = (primitives: typeof PREDEFINED_LIBRARY) => {
  const library = []
  if (primitives) {
    for (const primitive of primitives) {
      if (typeof primitive.params === 'number') {
        const paramNames = []
        for (let i = 0; i < primitive.params; i++) {
          paramNames.push('_' + i)
        }
        primitive.params = paramNames
      }
      const joinedParams = primitive.params.length ? primitive.params.join(' ') : '()'
      library.push(`(defjs ${primitive.name} (${joinedParams}))`)
    }
  }
  return library
}

const buildLibrary = (code: string) => {
  const userLibrary = parseUserLibraryBlock(code)
  const library = PREDEFINED_LIBRARY.concat(userLibrary)
  return buildLibraryFromPrimitives(library).join(' ')
}

export { buildLibrary, createUserLibraryBlock, parseUserLibraryBlock, PREDEFINED_LIBRARY }
