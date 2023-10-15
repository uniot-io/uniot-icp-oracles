const beautify = (unformatted: string, config?: { indentString: string; newLineString: string }) => {
  config = config || {
    indentString: '  ',
    newLineString: '\n'
  }
  let openLists = 0
  let result = ''
  let newLine = true
  let inArray = false
  let commentActive = false
  let stringActive = false
  let charEscaped = false

  for (let i = 0; i < unformatted.length; i++) {
    switch (unformatted.charAt(i)) {
      case '(':
        if (charEscaped) {
          charEscaped = false
        } else if (!stringActive && !commentActive) {
          if (!newLine) {
            result += config.newLineString
          }
          inArray = true
          result += config.indentString.repeat(openLists)
          openLists += 1
          newLine = false
        }
        result += unformatted.charAt(i)
        break
      case ')':
        if (charEscaped) {
          charEscaped = false
        } else if (!stringActive) {
          openLists -= 1
        }
        result += unformatted.charAt(i)
        break
      case '\n':
      case '\r':
        newLine = true
        result += unformatted.charAt(i)
        inArray = false
        commentActive = false
        break
      case ' ':
      case '\t':
        if (inArray || commentActive || stringActive) {
          result += unformatted.charAt(i)
        }
        break
      case ';':
        if (charEscaped) {
          charEscaped = false
        } else if (!stringActive) {
          commentActive = true
        }
        result += unformatted.charAt(i)
        break
      case '"':
        if (charEscaped) {
          charEscaped = false
        } else {
          stringActive = !stringActive
        }
        result += unformatted.charAt(i)
        break
      case '\\':
        charEscaped = !charEscaped
        result += unformatted.charAt(i)
        break

      default:
        if (charEscaped) {
          charEscaped = false
        }
        result += unformatted.charAt(i)
        newLine = false
    }
  }
  return result
}

const uglify = (code: string) => {
  code = code.replace(/;.*/g, '') // remove all comments
  code = code.replace(/(\r\n|\n|\r)/gm, ' ') // replace all newlines with spaces
  code = code.replace(/\s+/g, ' ').trim() // remove extra spaces
  // code = code.replace(/(?<=[(|[])\s+|\s+(?=[\]|)])/g, '') // remove all spaces before and after parentheses (Lookbehinds are only available in browsers supporting ECMA2018 standard)
  code = code.replace(/([([])\s+|\s+([)\]])/g, '$1$2') // remove all spaces before and after parentheses
  return code
}

export { beautify, uglify }
