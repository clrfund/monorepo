import fs from 'fs'
import { ethers } from 'hardhat'

import { UNIT } from '../utils/constants'
import { getEventArg } from '../utils/contracts'

async function main() {
  let users = JSON.parse(fs.readFileSync('users.json').toString())
  users = users.users
  const registry = await ethers.getContractAt('SimpleUserRegistry', "0xd1ed2db0c04cc06bdc386b92cbd0d0247e2b4ba3")

  for (const user of users) {
    if (await registry.isVerifiedUser(user)) {
      console.log(`${user} already verified.`);
    }
    else {
      try {
        await registry.addUser(user)
        console.log(`Added: ${user}`);
      } catch (error) {
        console.log(`Something went wrong while adding ${user}, do you have permission?`);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
