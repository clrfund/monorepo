// Usage: yarn ts-node scripts/get-bytecode.ts MACI <poseidonT3> <poseidonT6>
import { artifacts } from 'hardhat'
import { linkBytecode } from '../utils/deployment'

async function main() {
  const contractName = process.argv[2]
  const poseidonT3Address = process.argv[3]
  const poseidonT6Address = process.argv[4]
  const artifact = await artifacts.readArtifact(contractName)
  let result: string
  if (poseidonT3Address && poseidonT6Address) {
    result = linkBytecode(artifact.deployedBytecode, {
      'maci-contracts/sol/Poseidon.sol:PoseidonT3': poseidonT3Address,
      'maci-contracts/sol/Poseidon.sol:PoseidonT6': poseidonT6Address,
    })
  } else {
    result = artifact.deployedBytecode
  }
  console.info(result)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
