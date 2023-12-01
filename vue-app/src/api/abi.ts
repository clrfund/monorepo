import { abi as ERC20 } from '../../../contracts/build/contracts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json'
import { abi as ClrFund } from '../../../contracts/build/contracts/contracts/ClrFund.sol/ClrFund.json'
import { abi as FundingRound } from '../../../contracts/build/contracts/contracts/FundingRound.sol/FundingRound.json'
import { abi as MACIFactory } from '../../../contracts/build/contracts/contracts/MACIFactory.sol/MACIFactory.json'
import { abi as MACI } from '../../../contracts/build/contracts/@clrfund/maci-contracts/contracts/MACI.sol/MACI.json'
import { abi as Poll } from '../../../contracts/build/contracts/@clrfund/maci-contracts/contracts/Poll.sol/Poll.json'
import { abi as UserRegistry } from '../../../contracts/build/contracts/contracts/userRegistry/IUserRegistry.sol/IUserRegistry.json'
import { abi as BrightIdUserRegistry } from '../../../contracts/build/contracts/contracts/userRegistry/BrightIdUserRegistry.sol/BrightIdUserRegistry.json'
import { abi as SnapshotUserRegistry } from '../../../contracts/build/contracts/contracts/userRegistry/SnapshotUserRegistry.sol/SnapshotUserRegistry.json'
import { abi as MerkleUserRegistry } from '../../../contracts/build/contracts/contracts/userRegistry/MerkleUserRegistry.sol/MerkleUserRegistry.json'
import { abi as SimpleRecipientRegistry } from '../../../contracts/build/contracts/contracts/recipientRegistry/SimpleRecipientRegistry.sol/SimpleRecipientRegistry.json'
import { abi as OptimisticRecipientRegistry } from '../../../contracts/build/contracts/contracts/recipientRegistry/OptimisticRecipientRegistry.sol/OptimisticRecipientRegistry.json'
import { abi as KlerosGTCR } from '../../../contracts/build/contracts/contracts/recipientRegistry/IKlerosGTCR.sol/IKlerosGTCR.json'
import { abi as KlerosGTCRAdapter } from '../../../contracts/build/contracts/contracts/recipientRegistry/KlerosGTCRAdapter.sol/KlerosGTCRAdapter.json'

export {
  ERC20,
  ClrFund,
  FundingRound,
  MACIFactory,
  MACI,
  Poll,
  UserRegistry,
  SnapshotUserRegistry,
  MerkleUserRegistry,
  BrightIdUserRegistry,
  SimpleRecipientRegistry,
  OptimisticRecipientRegistry,
  KlerosGTCR,
  KlerosGTCRAdapter,
}
