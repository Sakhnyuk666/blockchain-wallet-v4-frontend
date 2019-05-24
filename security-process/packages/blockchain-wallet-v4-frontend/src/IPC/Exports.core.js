export default ({ BIP39, Bitcoin, crypto, ed25519, Task }) => {
  const credentialsEntropy = ({ guid, password, sharedKey }) =>
    crypto.sha256(Buffer.from(guid + sharedKey + password))

  const decryptEntropy = (
    { iterations, secondPassword, sharedKey },
    cipherText
  ) =>
    secondPassword
      ? crypto.decryptSecPass(sharedKey, iterations, secondPassword, cipherText)
      : Task.of(cipherText)

  const deriveBIP32Key = ({ network, path, seed }) =>
    Bitcoin.HDNode.fromSeedBuffer(seed, network)
      .derivePath(path)
      .toBase58()

  const deriveSLIP10ed25519Key = ({ path, seed }) =>
    ed25519.derivePath(path, seed.toString(`hex`))

  const entropyToSeed = entropy =>
    BIP39.mnemonicToSeed(BIP39.entropyToMnemonic(entropy))

  return {
    credentialsEntropy,
    decryptEntropy,
    deriveBIP32Key,
    deriveSLIP10ed25519Key,
    entropyToSeed
  }
}
