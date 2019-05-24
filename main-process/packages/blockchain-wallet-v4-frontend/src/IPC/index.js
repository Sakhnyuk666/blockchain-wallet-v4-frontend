import { serializer } from 'blockchain-wallet-v4/src/types'
import Middleware from './Middleware'
import * as kernel from '../../../web-microkernel/src'

export default configureStore => () =>
  new Promise(async resolve => {
    const exportedFunction = async imports => {
      const middleware = Middleware({ imports })

      const root = await configureStore({
        middleware,
        securityProcess: imports.securityProcess
      })

      const dispatch = action =>
        root.store.dispatch({
          ...action,
          meta: { ...action.meta, forwarded: true }
        })

      resolve(root)
      return { dispatch }
    }

    const connection = await kernel.ChildProcess(
      { reviver: serializer.reviver },
      exportedFunction
    )

    connection.addEventListener(`error`, console.error)
  })
