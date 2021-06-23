import { Keypair } from 'maci-domainobjs'

async function main() {
  const keypair = new Keypair()
  const serializedPrivKey = keypair.privKey.serialize()
  const serializedPubKey = keypair.pubKey.serialize()
  console.log('Private key:', serializedPrivKey)
  console.log('Public key: ', serializedPubKey)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
