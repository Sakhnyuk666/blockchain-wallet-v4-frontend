import { serializer } from 'blockchain-wallet-v4/src/types'
import * as kernel from '../../../web-microkernel/src'
import Exports from './Exports'
import Middleware from './Middleware'

export default configureStore => () =>
  new Promise(async resolve => {
    const exportedFunction = async imports => {
      const middleware = Middleware({ imports })
      const root = await configureStore(middleware)
      resolve(root)
      return Exports(root)
    }

    const childProcess = await kernel.ChildProcess(
      { reviver: serializer.reviver },
      exportedFunction
    )

    childProcess.addEventListener(`error`, console.error)
  })
