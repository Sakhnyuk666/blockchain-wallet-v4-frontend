import { takeLatest } from 'redux-saga/effects'
import * as AT from './actionTypes'
import sagas from './sagas'

export default (...args) => {
  const kvStoreEthereumSagas = sagas(...args)

  return function* coreKvStoreEthSaga () {
    yield takeLatest(
      AT.FETCH_METADATA_ETHEREUM,
      kvStoreEthereumSagas.fetchMetadataEthereum
    )
  }
}
