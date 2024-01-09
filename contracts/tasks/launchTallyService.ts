/**
 * This script launches an AWS EC2 instance to run the tally script
 *
 * * Example usage:
 * hardhat launch-tally-service \
 *   --factory 0x8981f569C3aa1C0e7f2766761c38c8896769f2f4 \
 *   --ssh-key clrfund \
 *   --network sepolia
 *
 * The default EC2 instance image has a cron job that will start the
 * tally script at reboot. The tally service parameters comes from the instance's
 * user data
 *
 * Make sure to set the following secrets in the AWS secrets manager
 *
 * 1. <Coordinator ETH wallet address>: <the wallet private key>
 * 2. <Coordinator MACI public key, e.g macpk..>: <the MACI private key>
 * 3. JSONRPC_HTTP_URL: <this will override the default network url set in hardhat.config>
 *
 * Make sure the AWS user running this script has the following permission
 * 1. EC2, secrets manager and IAM read/write permission
 * 2. pass role permission
 *  {
 *     "Version": "2012-10-17",
 *   	 "Statement": [
 *	   {
 *		    "Sid": "PassRole",
 *			    "Effect": "Allow",
 *			    "Action": [
 *				    "iam:PassRole"
 *			    ],
 *			    "Resource": [
 *				    "arn:aws:iam::639428193315:role/ClrfundInstanceRole"
 *			    ]
 *		    }
 *	    ]
 *   }
 *
 *
 */

import {
  EC2Client,
  RunInstancesCommand,
  DescribeInstancesCommand,
  AuthorizeSecurityGroupIngressCommand,
  CreateSecurityGroupCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2'
import {
  SecretsManagerClient,
  ListSecretsCommand,
} from '@aws-sdk/client-secrets-manager'
import {
  IAMClient,
  GetRoleCommand,
  CreateRoleCommand,
  CreateInstanceProfileCommand,
  AttachRolePolicyCommand,
  AddRoleToInstanceProfileCommand,
  NoSuchEntityException,
  EntityAlreadyExistsException,
} from '@aws-sdk/client-iam'
import { PubKey } from '@clrfund/maci-utils'
import { Contract, BigNumber, utils } from 'ethers'
import { task, types } from 'hardhat/config'

/**
 * EC2 Instance User data type
 */
type UserData = {
  // funding round contract address
  round: string
  // MACI contract starting block
  block: number
  // network name
  network: string
  // Coordinator MACI public key
  pubkey: string
  // Coordinator wallet address
  coordinator: string
}

// coordinator address and MACI public key
type Coordinator = {
  address: string
  pubkey: string
}

// Clrfund Security Group
const ClrfundSecurityGroupName = 'ClrfundSecurityGroup'

// Tags to filter instances created for vote tallying
const instanceTagName = 'Name'
const instanceTagValue = (userData: UserData) =>
  `clrfund-tally-${userData.network}-${userData.round}`

// print the AWS command line for setting a secret in the AWS secrets manager
const printSecretSetupInstruction = (name: string, region: string) =>
  console.log(
    `e.g. aws secretsmanager create-secret --name  ${name} --secret-string <value> --region ${region}`
  )

/**
 * Get or create the ClrfundSecurityGroup
 * @param region The region the EC2 instance is created in
 * @returns the security group name
 */
async function getOrCreateSecurityGroups(region: string): Promise<string[]> {
  const client = new EC2Client({ region })

  try {
    const securityGroup = await client.send(
      new DescribeSecurityGroupsCommand({
        GroupNames: [ClrfundSecurityGroupName],
      })
    )

    if (
      securityGroup.SecurityGroups &&
      securityGroup.SecurityGroups.length > 0
    ) {
      return [ClrfundSecurityGroupName]
    }
  } catch (e) {
    if ((e as any).Code !== 'InvalidGroup.NotFound') {
      throw e
    }
  }

  // The group does not exist, create new one
  const newGroup = await client.send(
    new CreateSecurityGroupCommand({
      GroupName: ClrfundSecurityGroupName,
      Description: 'Clrfund Security Group',
    })
  )
  await client.send(
    new AuthorizeSecurityGroupIngressCommand({
      GroupId: newGroup.GroupId,
      IpPermissions: [
        {
          FromPort: 22,
          IpProtocol: 'tcp',
          IpRanges: [
            {
              CidrIp: '0.0.0.0/0',
              Description: 'SSH',
            },
          ],
          ToPort: 22,
        },
      ],
    })
  )

  return [ClrfundSecurityGroupName]
}

/**
 * Create the IAM role for the instance
 * @param region the region of the role
 * @param roleName the roleName
 * @returns IAM role for the instance
 */
async function createRole(region: string, roleName: string): Promise<string> {
  const iamClient = new IAMClient({ region })

  await iamClient.send(
    new CreateRoleCommand({
      Description: 'Allows EC2 instances to call AWS services on your behalf.',
      RoleName: roleName,
      AssumeRolePolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    })
  )

  await iamClient.send(
    new AttachRolePolicyCommand({
      RoleName: roleName,
      PolicyArn: 'arn:aws:iam::aws:policy/SecretsManagerReadWrite',
    })
  )

  await iamClient.send(
    new AttachRolePolicyCommand({
      RoleName: roleName,
      PolicyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess',
    })
  )

  try {
    await iamClient.send(
      new CreateInstanceProfileCommand({
        InstanceProfileName: roleName,
      })
    )
  } catch (e) {
    // ignore error if the Profile already exists
    if (!(e instanceof EntityAlreadyExistsException)) {
      throw e
    }
  }

  await iamClient.send(
    new AddRoleToInstanceProfileCommand({
      InstanceProfileName: roleName,
      RoleName: roleName,
    })
  )

  return roleName
}

/**
 * Get the IAM role for the instance, create if missing
 * @param region the region of the role
 * @param roleName the role name
 * @returns IAM role for the instance
 */
async function getOrCreateIamRole(
  region: string,
  roleName: string
): Promise<string> {
  const iamClient = new IAMClient({ region })

  const command = new GetRoleCommand({ RoleName: roleName })
  try {
    await iamClient.send(command)
  } catch (e) {
    if (e instanceof NoSuchEntityException) {
      return createRole(region, roleName)
    }
    throw e
  }
  return roleName
}

/**
 * Get the coordinator address and MACI public key
 * @param maci The MACI contract handle
 * @returns The coordinator address and MACI public key
 */
async function getCoordinator(maci: Contract): Promise<Coordinator> {
  const [coordinatorAddress, coordinatorRawPubKey] = await Promise.all([
    maci.coordinatorAddress(),
    maci.coordinatorPubKey(),
  ])
  const coordinatorPubKey = new PubKey(
    coordinatorRawPubKey.map((key: BigNumber) => BigInt(key.toString()))
  )
  const serializedPubKey = coordinatorPubKey.serialize()

  return {
    address: coordinatorAddress.toLowerCase(),
    pubkey: serializedPubKey.toLowerCase(),
  }
}

/**
 * Check if the secret is setup in the AWS Secrets Manager
 * @param secret The name of the secret
 * @param region The region the secret is setup
 * @returns A boolean indicating if the secret is set
 */
async function haveSecretKey(secret: string, region: string): Promise<boolean> {
  const client = new SecretsManagerClient({ region })

  try {
    const response = await client.send(
      new ListSecretsCommand({
        Filters: [{ Key: 'name', Values: [secret] }],
      })
    )
    return response.SecretList ? response.SecretList.length > 0 : false
  } catch (e) {
    console.log('Failed to get secret', secret)
    throw e
  }
}

/**
 * Check if the tally service has already started
 * @param client AWS EC2 client handle
 * @param userData AWS EC2 instance user data
 * @returns a boolean indicating whether the service has started
 */
async function hasTallyStarted(
  client: EC2Client,
  userData: UserData
): Promise<boolean> {
  const input = {
    Filters: [
      {
        Name: `tag:${instanceTagName}`,
        Values: [instanceTagValue(userData)],
      },
    ],
  }
  const command = new DescribeInstancesCommand(input)
  const response = await client.send(command)
  const hasStarted = response.Reservations
    ? response.Reservations.length > 0
    : false

  return hasStarted
}

/**
 * Check if the tally service should be started
 * @param client AWS EC2 client
 * @param fundingRound funding round contract handle
 * @param maci MACI contract handle
 * @param blockTimestamp Current block timestamp
 * @param userData
 * @returns
 */
async function shouldStartTally(
  client: EC2Client,
  fundingRound: Contract,
  maci: Contract,
  blockTimestamp: number,
  userData: UserData,
  region: string
): Promise<boolean> {
  const hasStarted = await hasTallyStarted(client, userData)
  if (hasStarted) {
    // do not start as it's already started
    console.log('Already started tallying...')
    return false
  }

  const isFinalized = await fundingRound.isFinalized()
  if (isFinalized) {
    return false
  }

  const haveEthKey = await haveSecretKey(userData.coordinator, region)
  if (!haveEthKey) {
    console.log('Please setup the coordinator wallet secret key')
    printSecretSetupInstruction(userData.coordinator, region)
    return false
  }
  console.log('Have coordinator ETH key')

  const haveMACIKey = await haveSecretKey(userData.pubkey, region)
  if (!haveMACIKey) {
    console.log('Please setup the coordinator MACI secret key')
    printSecretSetupInstruction(userData.pubkey, region)
    return false
  }
  console.log('Have coordinator MACI key')

  console.log('blockTimestamp', blockTimestamp)
  const votingDeadline = await maci.calcVotingDeadline()
  console.log('votingDeadline', votingDeadline.toString())
  if (BigNumber.from(blockTimestamp).lte(votingDeadline)) {
    // voting is still going
    return false
  }

  const hasUntalliedStateLeaves = await maci.hasUntalliedStateLeaves()
  console.log('hasUntalliedStateLeaves', hasUntalliedStateLeaves)
  return hasUntalliedStateLeaves
}

task('launch-tally-service', 'Launch an AWS EC2 instance to tally votes')
  .addParam('factory', 'Funding round factory contract address')
  .addParam(
    'region',
    'The region the AWS EC2 instance to be created in',
    'us-east-1'
  )
  .addParam('image', 'The EC2 image to use', 'ami-036683f007561148e')
  .addParam(
    'instanceType',
    'The AWS EC2 instance type to use, eg. t2.large',
    't2.large'
  )
  .addParam('role', 'The instance profile role name', 'ClrfundInstanceRole')
  .addParam('sshKey', 'The ssh key used to access the instance')
  .addParam(
    'maciStartBlock',
    'The creation block of the MACI contract',
    0,
    types.int
  )
  .addOptionalParam(
    'securityGroup',
    'The instance security group with ssh inbound rule'
  )
  .setAction(
    async (
      {
        factory,
        region,
        image,
        maciStartBlock,
        instanceType,
        role,
        sshKey,
        securityGroup,
      },
      { network, ethers }
    ) => {
      const client = new EC2Client({ region })
      const fundingRoundFactory = await ethers.getContractAt(
        'FundingRoundFactory',
        factory
      )

      const fundingRoundAddress = await fundingRoundFactory.getCurrentRound()
      console.log('fundingRoundAddress', fundingRoundAddress)
      const fundingRound = await ethers.getContractAt(
        'FundingRound',
        fundingRoundAddress
      )

      const maciAddress = await fundingRound.maci()
      const maci = await ethers.getContractAt('MACI', maciAddress)

      const blockNumber = await ethers.provider.getBlockNumber()
      const block = await ethers.provider.getBlock(blockNumber)

      const iamName = await getOrCreateIamRole(region, role)
      console.log('Instance profile role', iamName)

      const coordinator = await getCoordinator(maci)

      const userData: UserData = {
        round: fundingRound.address,
        coordinator: coordinator.address,
        pubkey: coordinator.pubkey,
        block: maciStartBlock,
        network: network.name,
      }

      const shouldStart = await shouldStartTally(
        client,
        fundingRound,
        maci,
        block.timestamp,
        userData,
        region
      )

      if (shouldStart) {
        const securityGroups = securityGroup
          ? [securityGroup]
          : await getOrCreateSecurityGroups(region)

        const command = new RunInstancesCommand({
          ImageId: image,
          InstanceType: instanceType,
          MaxCount: 1,
          MinCount: 1,
          TagSpecifications: [
            {
              ResourceType: 'instance',
              Tags: [
                { Key: instanceTagName, Value: instanceTagValue(userData) },
              ],
            },
          ],
          MetadataOptions: {
            HttpTokens: 'required',
            HttpEndpoint: 'enabled',
          },
          IamInstanceProfile: {
            Name: iamName,
          },
          KeyName: sshKey,
          SecurityGroups: securityGroups,
          UserData: utils.base64.encode(
            utils.toUtf8Bytes(JSON.stringify(userData))
          ),
        })

        try {
          const result = await client.send(command)
          console.log('Created instance id', result.Instances?.[0]?.InstanceId)
        } catch (e) {
          console.log(
            'Failed creating AWS EC2 instance. Make sure the instance image, ssh-key and security-group are valid'
          )
          throw e
        }
      }
    }
  )
