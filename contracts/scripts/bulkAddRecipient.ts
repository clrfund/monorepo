import fs from 'fs'
import { ethers } from 'hardhat'

async function main() {
  let recipients = JSON.parse(fs.readFileSync('recipients.json').toString()).recipients
  const registry = await ethers.getContractAt('SimpleRecipientRegistry', '0x83aa15D4e973B9ECef9985f739825a54aC8677F3')

  for (let i = 0; i < recipients.length; i++) {
    try {
      await registry.addRecipient(recipients[i].address,recipients[i].metadata)
      console.log(`Added: ${recipients[i].address}`);
    } catch (error) {
      console.log(`Error adding ${recipients[i].address}`);
      console.log(error)
      i--;
    }
    await delay(6000);
  }
  console.log("great success 👍️");

}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
