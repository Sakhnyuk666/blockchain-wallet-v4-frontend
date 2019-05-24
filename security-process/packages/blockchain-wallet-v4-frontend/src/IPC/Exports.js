import axios from 'axios'
import BIP39 from 'bip39'
import Bitcoin from 'bitcoinjs-lib'
import Task from 'data.task'
import * as ed25519 from 'ed25519-hd-key'

import {
  getDefaultHDWallet,
  getMainPassword,
  getSharedKey
} from 'blockchain-wallet-v4/src/redux/wallet/selectors'

import Core from './Exports.core'
import { HDWallet } from 'blockchain-wallet-v4/src/types'
import { taskToPromise } from 'blockchain-wallet-v4/src/utils/functional'
import * as crypto from 'blockchain-wallet-v4/src/walletCrypto'
import * as kernel from '../../../web-microkernel/src'

const core = Core({ BIP39, Bitcoin, crypto, ed25519, Task })

export default ({ api, store }) => {
  const credentialsEntropy = ({ guid }) => {
    const state = store.getState()
    const password = getMainPassword(state)
    const sharedKey = getSharedKey(state)
    return core.credentialsEntropy({ guid, password, sharedKey })
  }

  const getSeed = async secondCredentials => {
    const state = store.getState()
    const cipherText = HDWallet.selectSeedHex(getDefaultHDWallet(state))
    const sharedKey = getSharedKey(state)

    const entropy = await taskToPromise(
      core.decryptEntropy({ ...secondCredentials, sharedKey }, cipherText)
    )

    return core.entropyToSeed(entropy)
  }

  const deriveBIP32Key = async (
    { iterations, secondPassword },
    { network, path }
  ) => {
    const seed = await getSeed({ iterations, secondPassword })
    return core.deriveBIP32Key({ network, path, seed })
  }

  const deriveSLIP10ed25519Key = async (
    { iterations, secondPassword },
    { path }
  ) => {
    const seed = await getSeed({ iterations, secondPassword })
    return core.deriveSLIP10ed25519Key({ path, seed })
  }

  const dispatch = action =>
    store.dispatch({
      ...action,
      meta: { ...action.meta, forwarded: true }
    })

  const getSettings = guid => {
    const state = store.getState()
    const sharedKey = getSharedKey(state)
    return api.getSettings(guid, sharedKey)
  }

  const updateSettings = (guid, method, payload, querystring = '') => {
    const state = store.getState()
    const sharedKey = getSharedKey(state)
    return api.updateSettings(guid, sharedKey, method, payload, querystring)
  }

  return {
    axios: kernel.sanitizeFunction(axios),
    credentialsEntropy,
    deriveBIP32Key,
    deriveSLIP10ed25519Key,
    dispatch,
    getSettings,
    updateSettings
  }
}
