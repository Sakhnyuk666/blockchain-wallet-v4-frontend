import * as _ from 'lodash'

const fromEntries = entries =>
  Object.assign({}, ...entries.map(([key, value]) => ({ [key]: value })))

const nextEvent = addListener =>
  new Promise(resolve => {
    addListener(resolve, { once: true })
  })

export default ({ ErrorEvent, EventTarget, getRandomValues }) => {
  const inspectionCutoff = 40

  const inspect = value => {
    const stringified = JSON.stringify(value) || String(value)

    return stringified.length > inspectionCutoff
      ? `${stringified.slice(0, inspectionCutoff)}...`
      : stringified
  }

  // Create an unforgeable key.
  const Key = () => {
    const array = new Uint32Array(1)
    getRandomValues(array)
    return array[0].toString(36)
  }

  const decoders = {}
  const types = []

  // The types are defined in the same order they are tested.

  types.push(
    {
      name: `boolean`,
      test: _.isBoolean,
      encode: (context, boolean) => boolean,
      decode: (context, code) => code
    },

    {
      name: `null`,
      test: _.isNull,
      encode: () => null,
      decode: () => null
    },

    {
      name: `number`,
      test: _.isNumber,
      encode: (context, number) => number,
      decode: (context, code) => code
    },

    {
      name: `string`,
      test: _.isString,
      encode: (context, string) => string,
      decode: (context, code) => code
    },

    {
      name: `undefined`,
      test: _.isUndefined,
      encode: () => undefined,
      decode: () => undefined
    },

    {
      name: `array`,
      test: Array.isArray,

      encode: (context, array) =>
        array.map((value, index) =>
          context.memoizedEncode(context, value, index)
        ),

      decode: (context, codes) =>
        codes.map((code, index) => context.memoizedDecode(context, code, index))
    }
  )

  // error

  const isError = value => value instanceof Error

  const encodeError = (context, error) => ({
    // The `message` property has to be handled separately.
    message: context.memoizedEncode(context, error.message),

    // Encode all properties (not just standard `message` and `name`) for
    // the benefit of Axios.
    entries: encodeObject(context, error)
  })

  const decodeError = (context, { entries, message }) =>
    Object.assign(
      Error(context.memoizedDecode(context, message)),
      decodeObject(context, entries)
    )

  types.push({
    name: `error`,
    test: isError,
    encode: encodeError,
    decode: decodeError
  })

  // function

  const encodeFunction = (
    { allowFunctions, isExport, functionData, functions, processName },
    func
  ) => {
    if (!functionData.has(func)) {
      if (!allowFunctions && !isExport) {
        throw new TypeError(
          `Refusing to encode functions outside of exported function.`
        )
      }

      const address = [processName, Key()]
      functionData.set(func, { address, isExport })
      functions[String(address)] = func
    }

    return {
      ...functionData.get(func),
      length: func.length
    }
  }

  const decodeFunction = (context, { address, isExport, length }) => {
    const { functionData, functions, reportExceptionsIn, returns } = context

    if (!(String(address) in functions)) {
      const proxyFunction = (...args) =>
        new Promise(
          reportExceptionsIn((resolve, reject) => {
            const returnKey = Key()
            returns[returnKey] = { resolve, reject }
            const [processName, key] = address

            // Function application isn't a type so encode it manually.
            context.postMessage(processName, [
              `functionApply`,
              {
                args: encode({ ...context, allowFunctions: isExport }, args),
                key,
                returnAddress: [context.processName, returnKey]
              }
            ])
          })
        )

      Object.defineProperty(proxyFunction, `length`, { value: length })
      functionData.set(proxyFunction, { address, isExport })
      functions[String(address)] = proxyFunction
    }

    return functions[String(address)]
  }

  decoders.functionApply = (context, { args, key, returnAddress }) => {
    const { functionData, functions, postMessage, reportExceptionsIn } = context
    const decodedArgs = decode(context, args)
    const address = [context.processName, key]
    const func = functions[String(address)]
    const { isExport } = functionData.get(func)
    const [processName, returnKey] = returnAddress

    const functionReturn = type =>
      reportExceptionsIn(valueOrReason => {
        const encodedValueOrReason = encode(
          { ...context, allowFunctions: isExport },
          valueOrReason
        )

        // Function return isn't a type so encode it manually.
        postMessage(processName, [
          `functionReturn`,
          {
            key: returnKey,
            [type]: encodedValueOrReason
          }
        ])
      })

    Promise.resolve(func(...decodedArgs)).then(
      functionReturn(`value`),
      functionReturn(`reason`)
    )
  }

  decoders.functionReturn = (context, { key, reason, value }) => {
    const { returns } = context
    const { reject, resolve } = returns[key]
    delete returns[key]

    if (reason) {
      reject(decode(context, reason))
    } else {
      resolve(decode(context, value))
    }
  }

  types.push({
    name: `function`,
    test: _.isFunction,
    encode: encodeFunction,
    decode: decodeFunction
  })

  // map

  const encodeMap = (context, map) =>
    [...map.entries()].map(([key, value]) => [
      context.memoizedEncode(context, key),
      context.memoizedEncode(context, value, key)
    ])

  const decodeMap = (context, pairs) =>
    new Map(
      pairs.map(([encodedKey, encodedValue]) => {
        const key = context.memoizedDecode(context, encodedKey)
        const value = context.memoizedDecode(context, encodedValue, key)
        return [key, value]
      })
    )

  types.push({
    name: `map`,
    test: _.isMap,
    encode: encodeMap,
    decode: decodeMap
  })

  // set

  const encodeSet = (context, set) =>
    [...set].map(value => context.memoizedEncode(context, value))

  const decodeSet = (context, codes) =>
    new Set(codes.map(code => context.memoizedDecode(context, code)))

  types.push({
    name: `set`,
    test: _.isSet,
    encode: encodeSet,
    decode: decodeSet
  })

  // object

  const encodeObject = (context, object) =>
    Object.entries(object).map(([key, value]) => [
      key,
      context.memoizedEncode(context, value, key)
    ])

  const decodeObject = (context, entries) =>
    fromEntries(
      entries.map(([key, encodedValue]) => [
        key,
        context.memoizedDecode(context, encodedValue, key)
      ])
    )

  types.push({
    name: `object`,
    test: _.isPlainObject,
    encode: encodeObject,
    decode: decodeObject
  })

  // end of type definitions

  types.forEach(({ name, decode }) => {
    decoders[name] = decode
  })

  const encodeWithType = (context, value, key = ``) => {
    let json

    try {
      json = value.toJSON(key)
    } catch (exception) {
      const type = types.find(({ test }) => test(value))

      if (type) {
        return [type.name, type.encode(context, value)]
      } else {
        throw new TypeError(`Don't know how to encode "${inspect(value)}".`)
      }
    }

    return encodeWithType(context, json, key)
  }

  const memoizeResolver = (context, value) => value

  const encode = (context, value) => {
    const memoizedEncode = _.memoize(encodeWithType, memoizeResolver)

    try {
      return memoizedEncode({ ...context, memoizedEncode }, value)
    } catch (exception) {
      throw Object.assign(
        new Error(`Exception while encoding "${inspect(value)}"`),
        { exception, value }
      )
    }
  }

  const decodeFromType = (context, code, key = ``) => {
    const [type, encoding] = code
    const decode = decoders[type]

    if (decode === undefined) {
      throw new TypeError(`Don't know how to decode type ${inspect(type)}.`)
    }

    const value = decode(context, encoding)
    const revived = context.reviver(key, value)

    // Freeze the newly created value because it's read-only:  Changes wouldn't
    // otherwise propogate back to the original value in the other realm.
    try {
      return Object.freeze(revived)
    } catch (exception) {
      // Some types cannot be frozen (e.g., array buffer views with elements).
      return revived
    }
  }

  const decode = (context, code) => {
    const memoizedDecode = _.memoize(decodeFromType, memoizeResolver)
    return memoizedDecode({ ...context, memoizedDecode }, code)
  }

  const defaultReviver = (key, value) => value

  const ReportExceptionsIn = eventTarget => callback => (...args) => {
    try {
      return callback(...args)
    } catch (exception) {
      eventTarget.dispatchEvent(
        new ErrorEvent(`error`, {
          error: exception,
          message: exception.message
        })
      )
    }
  }

  const canSerialize = value => Boolean(types.find(({ test }) => test(value)))

  const isSanitary = value => !_.isFunction(value) && canSerialize(value)

  const sanitizeError = error =>
    Object.assign(new Error(error.message), sanitizeObject(error))

  const sanitizeObject = object =>
    fromEntries(
      Object.entries(object)
        .filter(([, value]) => isSanitary(value))
        .map(([key, value]) => [key, sanitize(value)])
    )

  const sanitize = value =>
    isError(value)
      ? sanitizeError(value)
      : _.isPlainObject(value)
      ? sanitizeObject(value)
      : isSanitary(value)
      ? value
      : null

  const sanitizeFunction = callback => async (...args) => {
    try {
      return sanitize(await callback(...args.map(sanitize)))
    } catch (exception) {
      throw sanitize(exception)
    }
  }

  const ChildProcess = (
    { addListener, postMessage, processName, reviver = defaultReviver },
    exportedFunction
  ) => {
    const eventTarget = new EventTarget()
    const reportExceptionsIn = ReportExceptionsIn(eventTarget)

    const context = {
      functionData: new Map(),
      functions: {},
      postMessage,
      processName,
      reportExceptionsIn,
      returns: {},
      reviver
    }

    const messageListener = reportExceptionsIn(({ data }) => {
      decode(context, data)
    })

    addListener(messageListener)
    postMessage(null, encode({ ...context, isExport: true }, exportedFunction))
    return eventTarget
  }

  const CreateProcess = ({ insertHTML, newProcesses }) => ({ src }) =>
    new Promise(resolve => {
      const name = Key()

      const element = insertHTML(
        `<iframe
           name="${name}"
           sandbox="allow-forms allow-same-origin allow-scripts"
           src="${src}"
         ></iframe>`
      )

      newProcesses.set(element.contentWindow, { element, resolve })
    })

  const Kernel = ({
    addListener,
    hide,
    insertHTML,
    postMessage,
    reviver = defaultReviver,
    setHead,
    show
  }) => {
    const eventTarget = new EventTarget()
    const reportExceptionsIn = ReportExceptionsIn(eventTarget)

    const context = {
      functionData: new Map(),
      functions: {},
      postMessage,
      processName: null,
      returns: {},
      reportExceptionsIn,
      reviver
    }

    const newProcesses = new Map()
    const processElements = new WeakMap()

    const messageListener = reportExceptionsIn(({ data, source }) => {
      const value = decode(context, data)

      if (newProcesses.has(source)) {
        const { element, resolve } = newProcesses.get(source)
        newProcesses.delete(source)
        processElements.set(value, element)

        if (!foregroundElement) {
          setForeground(value)
        }

        resolve(value)
      }
    })

    addListener(messageListener)
    let foregroundElement

    const setForeground = (process, color) => {
      if (foregroundElement) {
        hide(foregroundElement)
      }

      foregroundElement = processElements.get(process)
      show(foregroundElement, color)
    }

    return Object.assign(eventTarget, {
      createProcess: CreateProcess({ insertHTML, newProcesses }),
      setForeground,
      setHead
    })
  }

  return {
    canSerialize,
    ChildProcess,
    inspect,
    Kernel,
    sanitize,
    sanitizeFunction
  }
}
