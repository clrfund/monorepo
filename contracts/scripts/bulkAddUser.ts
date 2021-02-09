import fs from 'fs'
import { ethers } from 'hardhat'

async function main() {
  let users = JSON.parse(fs.readFileSync('users.json').toString())
  users = users.users
  const registry = await ethers.getContractAt('SimpleUserRegistry', "0xd1ed2db0c04cc06bdc386b92cbd0d0247e2b4ba3")

  for (let i = 0; i < users.length; i++) {
    try {
      if (await registry.isVerifiedUser(users[i].address)) {
        console.log(`${users[i].address} already verified.`);
      }
      else {
        try {
          await registry.addUser(users[i].address)
          console.log(`Added: ${users[i].address}`);
        } catch (error) {
          console.log(`Error adding ${users[i].address}`);
          console.log(error)
          i--;
        }
        await delay(6000);
      }
    } catch (error) {
      console.log(error);
    }
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
