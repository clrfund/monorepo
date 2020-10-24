import { linkBytecode } from '../utils/deployment'

async function main() {
  const contractName = process.argv[2]
  const poseidonT3Address = process.argv[3]
  const poseidonT6Address = process.argv[4]
  const artifact = await import(`../build/contracts/${contractName}.json`)
  const result = linkBytecode(artifact.deployedBytecode, {
    'maci-contracts/sol/Poseidon.sol:PoseidonT3': poseidonT3Address,
    'maci-contracts/sol/Poseidon.sol:PoseidonT6': poseidonT6Address,
  })
  console.info(result)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
