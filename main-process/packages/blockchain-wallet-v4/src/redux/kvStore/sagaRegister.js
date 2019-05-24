import { fork } from 'redux-saga/effects'

import whatsNew from './whatsNew/sagaRegister'
import ethereum from './eth/sagaRegister'
import bch from './bch/sagaRegister'
import btc from './btc/sagaRegister'
import bsv from './bsv/sagaRegister'
import xlm from './xlm/sagaRegister'
import shapeShift from './shapeShift/sagaRegister'
import buySell from './buySell/sagaRegister'
import contacts from './contacts/sagaRegister'
import lockbox from './lockbox/sagaRegister'
import userCredentials from './userCredentials/sagaRegister'

export default (...args) =>
  function* coreKvStoreSaga () {
    yield fork(whatsNew(...args))
    yield fork(ethereum(...args))
    yield fork(bch(...args))
    yield fork(btc(...args))
    yield fork(bsv(...args))
    yield fork(xlm(...args))
    yield fork(shapeShift(...args))
    yield fork(buySell(...args))
    yield fork(contacts(...args))
    yield fork(lockbox(...args))
    yield fork(userCredentials(...args))
  }
