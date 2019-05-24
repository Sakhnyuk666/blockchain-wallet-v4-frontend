import BIP39 from 'bip39'
import Bitcoin from 'bitcoinjs-lib'
import * as ed25519 from 'ed25519-hd-key'
import Task from 'data.task'

import Core from './Exports.core'
import * as crypto from 'blockchain-wallet-v4/src/walletCrypto'
import { taskToPromise } from 'blockchain-wallet-v4/src/utils/functional'

import * as StellarSdk from 'stellar-sdk'

const core = Core({ BIP39, Bitcoin, crypto, ed25519, Task })

it(`generates entropy from the user's credentials`, () => {
  expect(
    core
      .credentialsEntropy({
        guid: `50dae286-e42e-4d67-8419-d5dcc563746c`,
        password: `password`,
        sharedKey: `b91c904b-53ab-44b1-bf79-5b60c018da15`
      })
      .toString(`base64`)
  ).toEqual(`jqdTiIA0jYETn9EjAGljE5697lc8kSkxod79srxfLug=`)
})

describe(`decryptEntropy`, () => {
  it(`doesn't decrypt the cipherText if there's no second password`, async () => {
    expect(
      await taskToPromise(
        core.decryptEntropy({}, `b8370dee9c086bb87b81cc8b72278eb2`)
      )
    ).toEqual(`b8370dee9c086bb87b81cc8b72278eb2`)
  })

  it(`decrypts the entropy if there's a second password`, async () => {
    const cipherText = `/oIKDKsrIAEY5qFo7thB5f8zG8c/WmNghWrMa2dhx9+q4UJWRgQZn6TpEQeXo93Nn2AxpTfG4NGiMuhzTnLN7A==`

    expect(
      await taskToPromise(
        core.decryptEntropy(
          {
            iterations: 5000,
            secondPassword: `second`,
            sharedKey: `b91c904b-53ab-44b1-bf79-5b60c018da15`
          },
          cipherText
        )
      )
    ).toEqual(`b8370dee9c086bb87b81cc8b72278eb2`)
  })
})

it(`derives a BIP32 key from the seed`, () => {
  expect(
    core.deriveBIP32Key({
      network: Bitcoin.networks.bitcoin,
      path: `m/0'`,
      seed: Buffer.from(`000102030405060708090a0b0c0d0e0f`, `hex`)
    })
  ).toEqual(
    `xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7`
  )
})

describe(`derives a SLIP-10 ed25519 key from the seed`, () => {
  const testVectors = [
    {
      mnemonic:
        'illness spike retreat truth genius clock brain pass fit cave bargain toe',
      publicKey: 'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6',
      secret: 'SBGWSG6BTNCKCOB3DIFBGCVMUPQFYPA2G4O34RMTB343OYPXU5DJDVMN'
    },
    {
      mnemonic:
        'resource asthma orphan phone ice canvas fire useful arch jewel impose vague theory cushion top',
      publicKey: 'GAVXVW5MCK7Q66RIBWZZKZEDQTRXWCZUP4DIIFXCCENGW2P6W4OA34RH',
      secret: 'SAKS7I2PNDBE5SJSUSU2XLJ7K5XJ3V3K4UDFAHMSBQYPOKE247VHAGDB'
    },
    {
      mnemonic:
        'bench hurt jump file august wise shallow faculty impulse spring exact slush thunder author capable act festival slice deposit sauce coconut afford frown better',
      publicKey: 'GC3MMSXBWHL6CPOAVERSJITX7BH76YU252WGLUOM5CJX3E7UCYZBTPJQ',
      secret: 'SAEWIVK3VLNEJ3WEJRZXQGDAS5NVG2BYSYDFRSH4GKVTS5RXNVED5AX7'
    },
    {
      mnemonic:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      publicKey: 'GB3JDWCQJCWMJ3IILWIGDTQJJC5567PGVEVXSCVPEQOTDN64VJBDQBYX',
      secret: 'SBUV3MRWKNS6AYKZ6E6MOUVF2OYMON3MIUASWL3JLY5E3ISDJFELYBRZ'
    }
  ]

  testVectors.forEach(({ mnemonic, publicKey, secret }, index) => {
    it(`test vector ${index}`, () => {
      const seed = BIP39.mnemonicToSeed(mnemonic)

      const { key } = core.deriveSLIP10ed25519Key({
        path: `m/44'/148'/0'`,
        seed
      })

      const keypair = StellarSdk.Keypair.fromRawEd25519Seed(key)
      expect(keypair.publicKey()).toEqual(publicKey)
      expect(keypair.secret()).toEqual(secret)
    })
  })
})

it(`converts entropy to the seed`, () => {
  expect(
    core.entropyToSeed(`7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f`).toString(`base64`)
  ).toEqual(
    `h4OG77eIRbM1W9FepNOe+X0XnLcSt31cEra+QV//7/5fN3ugK/P4VEq4ALlV5R+/8Jgo9oIFKiD6pq3bvd+wlg==`
  )
})
