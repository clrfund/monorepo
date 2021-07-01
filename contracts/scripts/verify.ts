// Usage: yarn ts-node scripts/verify.ts tally.json
import { verify } from 'maci-cli'

async function main() {
  const tallyFile = process.argv[2]
  await verify({
    tally_file: tallyFile, // eslint-disable-line @typescript-eslint/camelcase
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
