import { GraphQLClient } from 'graphql-request';
import * as Dom from 'graphql-request/dist/types.dom';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigDecimal: any;
  BigInt: any;
  Bytes: any;
};

export type BlockChangedFilter = {
  number_gte: Scalars['Int'];
};

export type Block_Height = {
  hash: InputMaybe<Scalars['Bytes']>;
  number: InputMaybe<Scalars['Int']>;
  number_gte: InputMaybe<Scalars['Int']>;
};

export type Contribution = {
  __typename?: 'Contribution';
  amount: Maybe<Scalars['BigInt']>;
  contributor: Maybe<Contributor>;
  createdAt: Maybe<Scalars['String']>;
  fundingRound: Maybe<FundingRound>;
  id: Scalars['ID'];
  voiceCredits: Maybe<Scalars['BigInt']>;
};

export type Contribution_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  amount: InputMaybe<Scalars['BigInt']>;
  amount_gt: InputMaybe<Scalars['BigInt']>;
  amount_gte: InputMaybe<Scalars['BigInt']>;
  amount_in: InputMaybe<Array<Scalars['BigInt']>>;
  amount_lt: InputMaybe<Scalars['BigInt']>;
  amount_lte: InputMaybe<Scalars['BigInt']>;
  amount_not: InputMaybe<Scalars['BigInt']>;
  amount_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  and: InputMaybe<Array<InputMaybe<Contribution_Filter>>>;
  contributor: InputMaybe<Scalars['String']>;
  contributor_: InputMaybe<Contributor_Filter>;
  contributor_contains: InputMaybe<Scalars['String']>;
  contributor_contains_nocase: InputMaybe<Scalars['String']>;
  contributor_ends_with: InputMaybe<Scalars['String']>;
  contributor_ends_with_nocase: InputMaybe<Scalars['String']>;
  contributor_gt: InputMaybe<Scalars['String']>;
  contributor_gte: InputMaybe<Scalars['String']>;
  contributor_in: InputMaybe<Array<Scalars['String']>>;
  contributor_lt: InputMaybe<Scalars['String']>;
  contributor_lte: InputMaybe<Scalars['String']>;
  contributor_not: InputMaybe<Scalars['String']>;
  contributor_not_contains: InputMaybe<Scalars['String']>;
  contributor_not_contains_nocase: InputMaybe<Scalars['String']>;
  contributor_not_ends_with: InputMaybe<Scalars['String']>;
  contributor_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  contributor_not_in: InputMaybe<Array<Scalars['String']>>;
  contributor_not_starts_with: InputMaybe<Scalars['String']>;
  contributor_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  contributor_starts_with: InputMaybe<Scalars['String']>;
  contributor_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt: InputMaybe<Scalars['String']>;
  createdAt_contains: InputMaybe<Scalars['String']>;
  createdAt_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_ends_with: InputMaybe<Scalars['String']>;
  createdAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_gt: InputMaybe<Scalars['String']>;
  createdAt_gte: InputMaybe<Scalars['String']>;
  createdAt_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_lt: InputMaybe<Scalars['String']>;
  createdAt_lte: InputMaybe<Scalars['String']>;
  createdAt_not: InputMaybe<Scalars['String']>;
  createdAt_not_contains: InputMaybe<Scalars['String']>;
  createdAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_not_starts_with: InputMaybe<Scalars['String']>;
  createdAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_starts_with: InputMaybe<Scalars['String']>;
  createdAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound: InputMaybe<Scalars['String']>;
  fundingRound_: InputMaybe<FundingRound_Filter>;
  fundingRound_contains: InputMaybe<Scalars['String']>;
  fundingRound_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRound_ends_with: InputMaybe<Scalars['String']>;
  fundingRound_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_gt: InputMaybe<Scalars['String']>;
  fundingRound_gte: InputMaybe<Scalars['String']>;
  fundingRound_in: InputMaybe<Array<Scalars['String']>>;
  fundingRound_lt: InputMaybe<Scalars['String']>;
  fundingRound_lte: InputMaybe<Scalars['String']>;
  fundingRound_not: InputMaybe<Scalars['String']>;
  fundingRound_not_contains: InputMaybe<Scalars['String']>;
  fundingRound_not_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRound_not_ends_with: InputMaybe<Scalars['String']>;
  fundingRound_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_not_in: InputMaybe<Array<Scalars['String']>>;
  fundingRound_not_starts_with: InputMaybe<Scalars['String']>;
  fundingRound_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_starts_with: InputMaybe<Scalars['String']>;
  fundingRound_starts_with_nocase: InputMaybe<Scalars['String']>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  or: InputMaybe<Array<InputMaybe<Contribution_Filter>>>;
  voiceCredits: InputMaybe<Scalars['BigInt']>;
  voiceCredits_gt: InputMaybe<Scalars['BigInt']>;
  voiceCredits_gte: InputMaybe<Scalars['BigInt']>;
  voiceCredits_in: InputMaybe<Array<Scalars['BigInt']>>;
  voiceCredits_lt: InputMaybe<Scalars['BigInt']>;
  voiceCredits_lte: InputMaybe<Scalars['BigInt']>;
  voiceCredits_not: InputMaybe<Scalars['BigInt']>;
  voiceCredits_not_in: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum Contribution_OrderBy {
  Amount = 'amount',
  Contributor = 'contributor',
  ContributorContributorAddress = 'contributor__contributorAddress',
  ContributorCreatedAt = 'contributor__createdAt',
  ContributorId = 'contributor__id',
  ContributorLastUpdatedAt = 'contributor__lastUpdatedAt',
  ContributorVerifiedTimeStamp = 'contributor__verifiedTimeStamp',
  CreatedAt = 'createdAt',
  FundingRound = 'fundingRound',
  FundingRoundContributorCount = 'fundingRound__contributorCount',
  FundingRoundContributorRegistryAddress = 'fundingRound__contributorRegistryAddress',
  FundingRoundCoordinator = 'fundingRound__coordinator',
  FundingRoundCreatedAt = 'fundingRound__createdAt',
  FundingRoundId = 'fundingRound__id',
  FundingRoundIsCancelled = 'fundingRound__isCancelled',
  FundingRoundIsFinalized = 'fundingRound__isFinalized',
  FundingRoundLastUpdatedAt = 'fundingRound__lastUpdatedAt',
  FundingRoundMaci = 'fundingRound__maci',
  FundingRoundMatchingPoolSize = 'fundingRound__matchingPoolSize',
  FundingRoundNativeToken = 'fundingRound__nativeToken',
  FundingRoundRecipientCount = 'fundingRound__recipientCount',
  FundingRoundRecipientRegistryAddress = 'fundingRound__recipientRegistryAddress',
  FundingRoundSignUpDeadline = 'fundingRound__signUpDeadline',
  FundingRoundStartTime = 'fundingRound__startTime',
  FundingRoundTallyHash = 'fundingRound__tallyHash',
  FundingRoundTotalSpent = 'fundingRound__totalSpent',
  FundingRoundTotalVotes = 'fundingRound__totalVotes',
  FundingRoundVoiceCreditFactor = 'fundingRound__voiceCreditFactor',
  FundingRoundVotingDeadline = 'fundingRound__votingDeadline',
  Id = 'id',
  VoiceCredits = 'voiceCredits'
}

export type Contributor = {
  __typename?: 'Contributor';
  contributions: Maybe<Array<Contribution>>;
  contributorAddress: Maybe<Scalars['Bytes']>;
  contributorRegistry: ContributorRegistry;
  createdAt: Maybe<Scalars['String']>;
  fundingRounds: Maybe<Array<FundingRound>>;
  id: Scalars['ID'];
  lastUpdatedAt: Maybe<Scalars['String']>;
  verifiedTimeStamp: Maybe<Scalars['String']>;
  votes: Maybe<Array<Vote>>;
};


export type ContributorContributionsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Contribution_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<Contribution_Filter>;
};


export type ContributorFundingRoundsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<FundingRound_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<FundingRound_Filter>;
};


export type ContributorVotesArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Vote_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<Vote_Filter>;
};

export type ContributorRegistry = {
  __typename?: 'ContributorRegistry';
  context: Maybe<Scalars['String']>;
  contributors: Maybe<Array<Contributor>>;
  createdAt: Maybe<Scalars['String']>;
  fundingRoundFactory: FundingRoundFactory;
  id: Scalars['ID'];
  lastUpdatedAt: Maybe<Scalars['String']>;
  owner: Maybe<Scalars['Bytes']>;
};


export type ContributorRegistryContributorsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Contributor_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<Contributor_Filter>;
};

export type ContributorRegistry_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  and: InputMaybe<Array<InputMaybe<ContributorRegistry_Filter>>>;
  context: InputMaybe<Scalars['String']>;
  context_contains: InputMaybe<Scalars['String']>;
  context_contains_nocase: InputMaybe<Scalars['String']>;
  context_ends_with: InputMaybe<Scalars['String']>;
  context_ends_with_nocase: InputMaybe<Scalars['String']>;
  context_gt: InputMaybe<Scalars['String']>;
  context_gte: InputMaybe<Scalars['String']>;
  context_in: InputMaybe<Array<Scalars['String']>>;
  context_lt: InputMaybe<Scalars['String']>;
  context_lte: InputMaybe<Scalars['String']>;
  context_not: InputMaybe<Scalars['String']>;
  context_not_contains: InputMaybe<Scalars['String']>;
  context_not_contains_nocase: InputMaybe<Scalars['String']>;
  context_not_ends_with: InputMaybe<Scalars['String']>;
  context_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  context_not_in: InputMaybe<Array<Scalars['String']>>;
  context_not_starts_with: InputMaybe<Scalars['String']>;
  context_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  context_starts_with: InputMaybe<Scalars['String']>;
  context_starts_with_nocase: InputMaybe<Scalars['String']>;
  contributors_: InputMaybe<Contributor_Filter>;
  createdAt: InputMaybe<Scalars['String']>;
  createdAt_contains: InputMaybe<Scalars['String']>;
  createdAt_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_ends_with: InputMaybe<Scalars['String']>;
  createdAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_gt: InputMaybe<Scalars['String']>;
  createdAt_gte: InputMaybe<Scalars['String']>;
  createdAt_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_lt: InputMaybe<Scalars['String']>;
  createdAt_lte: InputMaybe<Scalars['String']>;
  createdAt_not: InputMaybe<Scalars['String']>;
  createdAt_not_contains: InputMaybe<Scalars['String']>;
  createdAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_not_starts_with: InputMaybe<Scalars['String']>;
  createdAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_starts_with: InputMaybe<Scalars['String']>;
  createdAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory: InputMaybe<Scalars['String']>;
  fundingRoundFactory_: InputMaybe<FundingRoundFactory_Filter>;
  fundingRoundFactory_contains: InputMaybe<Scalars['String']>;
  fundingRoundFactory_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_ends_with: InputMaybe<Scalars['String']>;
  fundingRoundFactory_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_gt: InputMaybe<Scalars['String']>;
  fundingRoundFactory_gte: InputMaybe<Scalars['String']>;
  fundingRoundFactory_in: InputMaybe<Array<Scalars['String']>>;
  fundingRoundFactory_lt: InputMaybe<Scalars['String']>;
  fundingRoundFactory_lte: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_contains: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_ends_with: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_in: InputMaybe<Array<Scalars['String']>>;
  fundingRoundFactory_not_starts_with: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_starts_with: InputMaybe<Scalars['String']>;
  fundingRoundFactory_starts_with_nocase: InputMaybe<Scalars['String']>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  lastUpdatedAt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_lt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_lte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  or: InputMaybe<Array<InputMaybe<ContributorRegistry_Filter>>>;
  owner: InputMaybe<Scalars['Bytes']>;
  owner_contains: InputMaybe<Scalars['Bytes']>;
  owner_gt: InputMaybe<Scalars['Bytes']>;
  owner_gte: InputMaybe<Scalars['Bytes']>;
  owner_in: InputMaybe<Array<Scalars['Bytes']>>;
  owner_lt: InputMaybe<Scalars['Bytes']>;
  owner_lte: InputMaybe<Scalars['Bytes']>;
  owner_not: InputMaybe<Scalars['Bytes']>;
  owner_not_contains: InputMaybe<Scalars['Bytes']>;
  owner_not_in: InputMaybe<Array<Scalars['Bytes']>>;
};

export enum ContributorRegistry_OrderBy {
  Context = 'context',
  Contributors = 'contributors',
  CreatedAt = 'createdAt',
  FundingRoundFactory = 'fundingRoundFactory',
  FundingRoundFactoryBatchUstVerifier = 'fundingRoundFactory__batchUstVerifier',
  FundingRoundFactoryContributorRegistryAddress = 'fundingRoundFactory__contributorRegistryAddress',
  FundingRoundFactoryCoordinator = 'fundingRoundFactory__coordinator',
  FundingRoundFactoryCoordinatorPubKey = 'fundingRoundFactory__coordinatorPubKey',
  FundingRoundFactoryCreatedAt = 'fundingRoundFactory__createdAt',
  FundingRoundFactoryId = 'fundingRoundFactory__id',
  FundingRoundFactoryLastUpdatedAt = 'fundingRoundFactory__lastUpdatedAt',
  FundingRoundFactoryMaciFactory = 'fundingRoundFactory__maciFactory',
  FundingRoundFactoryMaxMessages = 'fundingRoundFactory__maxMessages',
  FundingRoundFactoryMaxUsers = 'fundingRoundFactory__maxUsers',
  FundingRoundFactoryMaxVoteOptions = 'fundingRoundFactory__maxVoteOptions',
  FundingRoundFactoryMessageBatchSize = 'fundingRoundFactory__messageBatchSize',
  FundingRoundFactoryMessageTreeDepth = 'fundingRoundFactory__messageTreeDepth',
  FundingRoundFactoryNativeToken = 'fundingRoundFactory__nativeToken',
  FundingRoundFactoryOwner = 'fundingRoundFactory__owner',
  FundingRoundFactoryQvtVerifier = 'fundingRoundFactory__qvtVerifier',
  FundingRoundFactoryRecipientRegistryAddress = 'fundingRoundFactory__recipientRegistryAddress',
  FundingRoundFactorySignUpDuration = 'fundingRoundFactory__signUpDuration',
  FundingRoundFactoryStateTreeDepth = 'fundingRoundFactory__stateTreeDepth',
  FundingRoundFactoryTallyBatchSize = 'fundingRoundFactory__tallyBatchSize',
  FundingRoundFactoryVoteOptionTreeDepth = 'fundingRoundFactory__voteOptionTreeDepth',
  FundingRoundFactoryVotingDuration = 'fundingRoundFactory__votingDuration',
  Id = 'id',
  LastUpdatedAt = 'lastUpdatedAt',
  Owner = 'owner'
}

export type Contributor_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  and: InputMaybe<Array<InputMaybe<Contributor_Filter>>>;
  contributions_: InputMaybe<Contribution_Filter>;
  contributorAddress: InputMaybe<Scalars['Bytes']>;
  contributorAddress_contains: InputMaybe<Scalars['Bytes']>;
  contributorAddress_gt: InputMaybe<Scalars['Bytes']>;
  contributorAddress_gte: InputMaybe<Scalars['Bytes']>;
  contributorAddress_in: InputMaybe<Array<Scalars['Bytes']>>;
  contributorAddress_lt: InputMaybe<Scalars['Bytes']>;
  contributorAddress_lte: InputMaybe<Scalars['Bytes']>;
  contributorAddress_not: InputMaybe<Scalars['Bytes']>;
  contributorAddress_not_contains: InputMaybe<Scalars['Bytes']>;
  contributorAddress_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  contributorRegistry: InputMaybe<Scalars['String']>;
  contributorRegistry_: InputMaybe<ContributorRegistry_Filter>;
  contributorRegistry_contains: InputMaybe<Scalars['String']>;
  contributorRegistry_contains_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_ends_with: InputMaybe<Scalars['String']>;
  contributorRegistry_ends_with_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_gt: InputMaybe<Scalars['String']>;
  contributorRegistry_gte: InputMaybe<Scalars['String']>;
  contributorRegistry_in: InputMaybe<Array<Scalars['String']>>;
  contributorRegistry_lt: InputMaybe<Scalars['String']>;
  contributorRegistry_lte: InputMaybe<Scalars['String']>;
  contributorRegistry_not: InputMaybe<Scalars['String']>;
  contributorRegistry_not_contains: InputMaybe<Scalars['String']>;
  contributorRegistry_not_contains_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_not_ends_with: InputMaybe<Scalars['String']>;
  contributorRegistry_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_not_in: InputMaybe<Array<Scalars['String']>>;
  contributorRegistry_not_starts_with: InputMaybe<Scalars['String']>;
  contributorRegistry_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_starts_with: InputMaybe<Scalars['String']>;
  contributorRegistry_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt: InputMaybe<Scalars['String']>;
  createdAt_contains: InputMaybe<Scalars['String']>;
  createdAt_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_ends_with: InputMaybe<Scalars['String']>;
  createdAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_gt: InputMaybe<Scalars['String']>;
  createdAt_gte: InputMaybe<Scalars['String']>;
  createdAt_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_lt: InputMaybe<Scalars['String']>;
  createdAt_lte: InputMaybe<Scalars['String']>;
  createdAt_not: InputMaybe<Scalars['String']>;
  createdAt_not_contains: InputMaybe<Scalars['String']>;
  createdAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_not_starts_with: InputMaybe<Scalars['String']>;
  createdAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_starts_with: InputMaybe<Scalars['String']>;
  createdAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRounds: InputMaybe<Array<Scalars['String']>>;
  fundingRounds_: InputMaybe<FundingRound_Filter>;
  fundingRounds_contains: InputMaybe<Array<Scalars['String']>>;
  fundingRounds_contains_nocase: InputMaybe<Array<Scalars['String']>>;
  fundingRounds_not: InputMaybe<Array<Scalars['String']>>;
  fundingRounds_not_contains: InputMaybe<Array<Scalars['String']>>;
  fundingRounds_not_contains_nocase: InputMaybe<Array<Scalars['String']>>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  lastUpdatedAt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_lt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_lte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  or: InputMaybe<Array<InputMaybe<Contributor_Filter>>>;
  verifiedTimeStamp: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_contains: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_contains_nocase: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_ends_with: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_ends_with_nocase: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_gt: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_gte: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_in: InputMaybe<Array<Scalars['String']>>;
  verifiedTimeStamp_lt: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_lte: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_not: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_not_contains: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_not_contains_nocase: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_not_ends_with: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_not_in: InputMaybe<Array<Scalars['String']>>;
  verifiedTimeStamp_not_starts_with: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_starts_with: InputMaybe<Scalars['String']>;
  verifiedTimeStamp_starts_with_nocase: InputMaybe<Scalars['String']>;
  votes_: InputMaybe<Vote_Filter>;
};

export enum Contributor_OrderBy {
  Contributions = 'contributions',
  ContributorAddress = 'contributorAddress',
  ContributorRegistry = 'contributorRegistry',
  ContributorRegistryContext = 'contributorRegistry__context',
  ContributorRegistryCreatedAt = 'contributorRegistry__createdAt',
  ContributorRegistryId = 'contributorRegistry__id',
  ContributorRegistryLastUpdatedAt = 'contributorRegistry__lastUpdatedAt',
  ContributorRegistryOwner = 'contributorRegistry__owner',
  CreatedAt = 'createdAt',
  FundingRounds = 'fundingRounds',
  Id = 'id',
  LastUpdatedAt = 'lastUpdatedAt',
  VerifiedTimeStamp = 'verifiedTimeStamp',
  Votes = 'votes'
}

export type Coordinator = {
  __typename?: 'Coordinator';
  contact: Maybe<Scalars['String']>;
  createdAt: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  lastUpdatedAt: Maybe<Scalars['String']>;
};

export type Coordinator_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  and: InputMaybe<Array<InputMaybe<Coordinator_Filter>>>;
  contact: InputMaybe<Scalars['String']>;
  contact_contains: InputMaybe<Scalars['String']>;
  contact_contains_nocase: InputMaybe<Scalars['String']>;
  contact_ends_with: InputMaybe<Scalars['String']>;
  contact_ends_with_nocase: InputMaybe<Scalars['String']>;
  contact_gt: InputMaybe<Scalars['String']>;
  contact_gte: InputMaybe<Scalars['String']>;
  contact_in: InputMaybe<Array<Scalars['String']>>;
  contact_lt: InputMaybe<Scalars['String']>;
  contact_lte: InputMaybe<Scalars['String']>;
  contact_not: InputMaybe<Scalars['String']>;
  contact_not_contains: InputMaybe<Scalars['String']>;
  contact_not_contains_nocase: InputMaybe<Scalars['String']>;
  contact_not_ends_with: InputMaybe<Scalars['String']>;
  contact_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  contact_not_in: InputMaybe<Array<Scalars['String']>>;
  contact_not_starts_with: InputMaybe<Scalars['String']>;
  contact_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  contact_starts_with: InputMaybe<Scalars['String']>;
  contact_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt: InputMaybe<Scalars['String']>;
  createdAt_contains: InputMaybe<Scalars['String']>;
  createdAt_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_ends_with: InputMaybe<Scalars['String']>;
  createdAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_gt: InputMaybe<Scalars['String']>;
  createdAt_gte: InputMaybe<Scalars['String']>;
  createdAt_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_lt: InputMaybe<Scalars['String']>;
  createdAt_lte: InputMaybe<Scalars['String']>;
  createdAt_not: InputMaybe<Scalars['String']>;
  createdAt_not_contains: InputMaybe<Scalars['String']>;
  createdAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_not_starts_with: InputMaybe<Scalars['String']>;
  createdAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_starts_with: InputMaybe<Scalars['String']>;
  createdAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  lastUpdatedAt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_lt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_lte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  or: InputMaybe<Array<InputMaybe<Coordinator_Filter>>>;
};

export enum Coordinator_OrderBy {
  Contact = 'contact',
  CreatedAt = 'createdAt',
  Id = 'id',
  LastUpdatedAt = 'lastUpdatedAt'
}

export type Donation = {
  __typename?: 'Donation';
  amount: Maybe<Scalars['BigInt']>;
  createdAt: Maybe<Scalars['String']>;
  fundingRound: Maybe<FundingRound>;
  id: Scalars['ID'];
  recipient: Maybe<Scalars['Bytes']>;
  voteOptionIndex: Maybe<Scalars['BigInt']>;
};

export type Donation_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  amount: InputMaybe<Scalars['BigInt']>;
  amount_gt: InputMaybe<Scalars['BigInt']>;
  amount_gte: InputMaybe<Scalars['BigInt']>;
  amount_in: InputMaybe<Array<Scalars['BigInt']>>;
  amount_lt: InputMaybe<Scalars['BigInt']>;
  amount_lte: InputMaybe<Scalars['BigInt']>;
  amount_not: InputMaybe<Scalars['BigInt']>;
  amount_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  and: InputMaybe<Array<InputMaybe<Donation_Filter>>>;
  createdAt: InputMaybe<Scalars['String']>;
  createdAt_contains: InputMaybe<Scalars['String']>;
  createdAt_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_ends_with: InputMaybe<Scalars['String']>;
  createdAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_gt: InputMaybe<Scalars['String']>;
  createdAt_gte: InputMaybe<Scalars['String']>;
  createdAt_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_lt: InputMaybe<Scalars['String']>;
  createdAt_lte: InputMaybe<Scalars['String']>;
  createdAt_not: InputMaybe<Scalars['String']>;
  createdAt_not_contains: InputMaybe<Scalars['String']>;
  createdAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_not_starts_with: InputMaybe<Scalars['String']>;
  createdAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_starts_with: InputMaybe<Scalars['String']>;
  createdAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound: InputMaybe<Scalars['String']>;
  fundingRound_: InputMaybe<FundingRound_Filter>;
  fundingRound_contains: InputMaybe<Scalars['String']>;
  fundingRound_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRound_ends_with: InputMaybe<Scalars['String']>;
  fundingRound_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_gt: InputMaybe<Scalars['String']>;
  fundingRound_gte: InputMaybe<Scalars['String']>;
  fundingRound_in: InputMaybe<Array<Scalars['String']>>;
  fundingRound_lt: InputMaybe<Scalars['String']>;
  fundingRound_lte: InputMaybe<Scalars['String']>;
  fundingRound_not: InputMaybe<Scalars['String']>;
  fundingRound_not_contains: InputMaybe<Scalars['String']>;
  fundingRound_not_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRound_not_ends_with: InputMaybe<Scalars['String']>;
  fundingRound_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_not_in: InputMaybe<Array<Scalars['String']>>;
  fundingRound_not_starts_with: InputMaybe<Scalars['String']>;
  fundingRound_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_starts_with: InputMaybe<Scalars['String']>;
  fundingRound_starts_with_nocase: InputMaybe<Scalars['String']>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  or: InputMaybe<Array<InputMaybe<Donation_Filter>>>;
  recipient: InputMaybe<Scalars['Bytes']>;
  recipient_contains: InputMaybe<Scalars['Bytes']>;
  recipient_gt: InputMaybe<Scalars['Bytes']>;
  recipient_gte: InputMaybe<Scalars['Bytes']>;
  recipient_in: InputMaybe<Array<Scalars['Bytes']>>;
  recipient_lt: InputMaybe<Scalars['Bytes']>;
  recipient_lte: InputMaybe<Scalars['Bytes']>;
  recipient_not: InputMaybe<Scalars['Bytes']>;
  recipient_not_contains: InputMaybe<Scalars['Bytes']>;
  recipient_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  voteOptionIndex: InputMaybe<Scalars['BigInt']>;
  voteOptionIndex_gt: InputMaybe<Scalars['BigInt']>;
  voteOptionIndex_gte: InputMaybe<Scalars['BigInt']>;
  voteOptionIndex_in: InputMaybe<Array<Scalars['BigInt']>>;
  voteOptionIndex_lt: InputMaybe<Scalars['BigInt']>;
  voteOptionIndex_lte: InputMaybe<Scalars['BigInt']>;
  voteOptionIndex_not: InputMaybe<Scalars['BigInt']>;
  voteOptionIndex_not_in: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum Donation_OrderBy {
  Amount = 'amount',
  CreatedAt = 'createdAt',
  FundingRound = 'fundingRound',
  FundingRoundContributorCount = 'fundingRound__contributorCount',
  FundingRoundContributorRegistryAddress = 'fundingRound__contributorRegistryAddress',
  FundingRoundCoordinator = 'fundingRound__coordinator',
  FundingRoundCreatedAt = 'fundingRound__createdAt',
  FundingRoundId = 'fundingRound__id',
  FundingRoundIsCancelled = 'fundingRound__isCancelled',
  FundingRoundIsFinalized = 'fundingRound__isFinalized',
  FundingRoundLastUpdatedAt = 'fundingRound__lastUpdatedAt',
  FundingRoundMaci = 'fundingRound__maci',
  FundingRoundMatchingPoolSize = 'fundingRound__matchingPoolSize',
  FundingRoundNativeToken = 'fundingRound__nativeToken',
  FundingRoundRecipientCount = 'fundingRound__recipientCount',
  FundingRoundRecipientRegistryAddress = 'fundingRound__recipientRegistryAddress',
  FundingRoundSignUpDeadline = 'fundingRound__signUpDeadline',
  FundingRoundStartTime = 'fundingRound__startTime',
  FundingRoundTallyHash = 'fundingRound__tallyHash',
  FundingRoundTotalSpent = 'fundingRound__totalSpent',
  FundingRoundTotalVotes = 'fundingRound__totalVotes',
  FundingRoundVoiceCreditFactor = 'fundingRound__voiceCreditFactor',
  FundingRoundVotingDeadline = 'fundingRound__votingDeadline',
  Id = 'id',
  Recipient = 'recipient',
  VoteOptionIndex = 'voteOptionIndex'
}

export type FundingRound = {
  __typename?: 'FundingRound';
  contributions: Maybe<Array<Contribution>>;
  contributorCount: Scalars['BigInt'];
  contributorRegistry: Maybe<ContributorRegistry>;
  contributorRegistryAddress: Maybe<Scalars['Bytes']>;
  contributors: Maybe<Array<Contributor>>;
  coordinator: Maybe<Scalars['Bytes']>;
  createdAt: Maybe<Scalars['String']>;
  fundingRoundFactory: Maybe<FundingRoundFactory>;
  id: Scalars['ID'];
  isCancelled: Maybe<Scalars['Boolean']>;
  isFinalized: Maybe<Scalars['Boolean']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
  maci: Maybe<Scalars['Bytes']>;
  matchingPoolSize: Maybe<Scalars['BigInt']>;
  messages: Maybe<Array<Message>>;
  nativeToken: Maybe<Scalars['Bytes']>;
  nativeTokenInfo: Maybe<Token>;
  recipientCount: Scalars['BigInt'];
  recipientRegistry: Maybe<RecipientRegistry>;
  recipientRegistryAddress: Maybe<Scalars['Bytes']>;
  recipients: Maybe<Array<Recipient>>;
  signUpDeadline: Maybe<Scalars['BigInt']>;
  startTime: Maybe<Scalars['BigInt']>;
  tallyHash: Maybe<Scalars['String']>;
  totalSpent: Maybe<Scalars['BigInt']>;
  totalVotes: Maybe<Scalars['BigInt']>;
  voiceCreditFactor: Maybe<Scalars['BigInt']>;
  votes: Maybe<Array<Vote>>;
  votingDeadline: Maybe<Scalars['BigInt']>;
};


export type FundingRoundContributionsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Contribution_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<Contribution_Filter>;
};


export type FundingRoundContributorsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Contributor_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<Contributor_Filter>;
};


export type FundingRoundMessagesArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Message_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<Message_Filter>;
};


export type FundingRoundRecipientsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Recipient_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<Recipient_Filter>;
};


export type FundingRoundVotesArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Vote_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<Vote_Filter>;
};

export type FundingRoundFactory = {
  __typename?: 'FundingRoundFactory';
  batchUstVerifier: Maybe<Scalars['Bytes']>;
  contributorRegistry: Maybe<ContributorRegistry>;
  contributorRegistryAddress: Maybe<Scalars['Bytes']>;
  coordinator: Maybe<Scalars['Bytes']>;
  coordinatorPubKey: Maybe<Scalars['String']>;
  createdAt: Maybe<Scalars['String']>;
  currentRound: Maybe<FundingRound>;
  fundingRounds: Maybe<Array<FundingRound>>;
  id: Scalars['ID'];
  lastUpdatedAt: Maybe<Scalars['String']>;
  maciFactory: Maybe<Scalars['Bytes']>;
  maxMessages: Maybe<Scalars['BigInt']>;
  maxUsers: Maybe<Scalars['BigInt']>;
  maxVoteOptions: Maybe<Scalars['BigInt']>;
  messageBatchSize: Maybe<Scalars['BigInt']>;
  messageTreeDepth: Maybe<Scalars['BigInt']>;
  nativeToken: Maybe<Scalars['Bytes']>;
  nativeTokenInfo: Maybe<Token>;
  owner: Maybe<Scalars['Bytes']>;
  qvtVerifier: Maybe<Scalars['Bytes']>;
  recipientRegistry: Maybe<RecipientRegistry>;
  recipientRegistryAddress: Maybe<Scalars['Bytes']>;
  signUpDuration: Maybe<Scalars['BigInt']>;
  stateTreeDepth: Maybe<Scalars['BigInt']>;
  tallyBatchSize: Maybe<Scalars['BigInt']>;
  voteOptionTreeDepth: Maybe<Scalars['BigInt']>;
  votingDuration: Maybe<Scalars['BigInt']>;
};


export type FundingRoundFactoryFundingRoundsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<FundingRound_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<FundingRound_Filter>;
};

export type FundingRoundFactory_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  and: InputMaybe<Array<InputMaybe<FundingRoundFactory_Filter>>>;
  batchUstVerifier: InputMaybe<Scalars['Bytes']>;
  batchUstVerifier_contains: InputMaybe<Scalars['Bytes']>;
  batchUstVerifier_gt: InputMaybe<Scalars['Bytes']>;
  batchUstVerifier_gte: InputMaybe<Scalars['Bytes']>;
  batchUstVerifier_in: InputMaybe<Array<Scalars['Bytes']>>;
  batchUstVerifier_lt: InputMaybe<Scalars['Bytes']>;
  batchUstVerifier_lte: InputMaybe<Scalars['Bytes']>;
  batchUstVerifier_not: InputMaybe<Scalars['Bytes']>;
  batchUstVerifier_not_contains: InputMaybe<Scalars['Bytes']>;
  batchUstVerifier_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  contributorRegistry: InputMaybe<Scalars['String']>;
  contributorRegistryAddress: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_contains: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_gt: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_gte: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_in: InputMaybe<Array<Scalars['Bytes']>>;
  contributorRegistryAddress_lt: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_lte: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_not: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_not_contains: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  contributorRegistry_: InputMaybe<ContributorRegistry_Filter>;
  contributorRegistry_contains: InputMaybe<Scalars['String']>;
  contributorRegistry_contains_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_ends_with: InputMaybe<Scalars['String']>;
  contributorRegistry_ends_with_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_gt: InputMaybe<Scalars['String']>;
  contributorRegistry_gte: InputMaybe<Scalars['String']>;
  contributorRegistry_in: InputMaybe<Array<Scalars['String']>>;
  contributorRegistry_lt: InputMaybe<Scalars['String']>;
  contributorRegistry_lte: InputMaybe<Scalars['String']>;
  contributorRegistry_not: InputMaybe<Scalars['String']>;
  contributorRegistry_not_contains: InputMaybe<Scalars['String']>;
  contributorRegistry_not_contains_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_not_ends_with: InputMaybe<Scalars['String']>;
  contributorRegistry_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_not_in: InputMaybe<Array<Scalars['String']>>;
  contributorRegistry_not_starts_with: InputMaybe<Scalars['String']>;
  contributorRegistry_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_starts_with: InputMaybe<Scalars['String']>;
  contributorRegistry_starts_with_nocase: InputMaybe<Scalars['String']>;
  coordinator: InputMaybe<Scalars['Bytes']>;
  coordinatorPubKey: InputMaybe<Scalars['String']>;
  coordinatorPubKey_contains: InputMaybe<Scalars['String']>;
  coordinatorPubKey_contains_nocase: InputMaybe<Scalars['String']>;
  coordinatorPubKey_ends_with: InputMaybe<Scalars['String']>;
  coordinatorPubKey_ends_with_nocase: InputMaybe<Scalars['String']>;
  coordinatorPubKey_gt: InputMaybe<Scalars['String']>;
  coordinatorPubKey_gte: InputMaybe<Scalars['String']>;
  coordinatorPubKey_in: InputMaybe<Array<Scalars['String']>>;
  coordinatorPubKey_lt: InputMaybe<Scalars['String']>;
  coordinatorPubKey_lte: InputMaybe<Scalars['String']>;
  coordinatorPubKey_not: InputMaybe<Scalars['String']>;
  coordinatorPubKey_not_contains: InputMaybe<Scalars['String']>;
  coordinatorPubKey_not_contains_nocase: InputMaybe<Scalars['String']>;
  coordinatorPubKey_not_ends_with: InputMaybe<Scalars['String']>;
  coordinatorPubKey_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  coordinatorPubKey_not_in: InputMaybe<Array<Scalars['String']>>;
  coordinatorPubKey_not_starts_with: InputMaybe<Scalars['String']>;
  coordinatorPubKey_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  coordinatorPubKey_starts_with: InputMaybe<Scalars['String']>;
  coordinatorPubKey_starts_with_nocase: InputMaybe<Scalars['String']>;
  coordinator_contains: InputMaybe<Scalars['Bytes']>;
  coordinator_gt: InputMaybe<Scalars['Bytes']>;
  coordinator_gte: InputMaybe<Scalars['Bytes']>;
  coordinator_in: InputMaybe<Array<Scalars['Bytes']>>;
  coordinator_lt: InputMaybe<Scalars['Bytes']>;
  coordinator_lte: InputMaybe<Scalars['Bytes']>;
  coordinator_not: InputMaybe<Scalars['Bytes']>;
  coordinator_not_contains: InputMaybe<Scalars['Bytes']>;
  coordinator_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  createdAt: InputMaybe<Scalars['String']>;
  createdAt_contains: InputMaybe<Scalars['String']>;
  createdAt_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_ends_with: InputMaybe<Scalars['String']>;
  createdAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_gt: InputMaybe<Scalars['String']>;
  createdAt_gte: InputMaybe<Scalars['String']>;
  createdAt_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_lt: InputMaybe<Scalars['String']>;
  createdAt_lte: InputMaybe<Scalars['String']>;
  createdAt_not: InputMaybe<Scalars['String']>;
  createdAt_not_contains: InputMaybe<Scalars['String']>;
  createdAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_not_starts_with: InputMaybe<Scalars['String']>;
  createdAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_starts_with: InputMaybe<Scalars['String']>;
  createdAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  currentRound: InputMaybe<Scalars['String']>;
  currentRound_: InputMaybe<FundingRound_Filter>;
  currentRound_contains: InputMaybe<Scalars['String']>;
  currentRound_contains_nocase: InputMaybe<Scalars['String']>;
  currentRound_ends_with: InputMaybe<Scalars['String']>;
  currentRound_ends_with_nocase: InputMaybe<Scalars['String']>;
  currentRound_gt: InputMaybe<Scalars['String']>;
  currentRound_gte: InputMaybe<Scalars['String']>;
  currentRound_in: InputMaybe<Array<Scalars['String']>>;
  currentRound_lt: InputMaybe<Scalars['String']>;
  currentRound_lte: InputMaybe<Scalars['String']>;
  currentRound_not: InputMaybe<Scalars['String']>;
  currentRound_not_contains: InputMaybe<Scalars['String']>;
  currentRound_not_contains_nocase: InputMaybe<Scalars['String']>;
  currentRound_not_ends_with: InputMaybe<Scalars['String']>;
  currentRound_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  currentRound_not_in: InputMaybe<Array<Scalars['String']>>;
  currentRound_not_starts_with: InputMaybe<Scalars['String']>;
  currentRound_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  currentRound_starts_with: InputMaybe<Scalars['String']>;
  currentRound_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRounds_: InputMaybe<FundingRound_Filter>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  lastUpdatedAt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_lt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_lte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  maciFactory: InputMaybe<Scalars['Bytes']>;
  maciFactory_contains: InputMaybe<Scalars['Bytes']>;
  maciFactory_gt: InputMaybe<Scalars['Bytes']>;
  maciFactory_gte: InputMaybe<Scalars['Bytes']>;
  maciFactory_in: InputMaybe<Array<Scalars['Bytes']>>;
  maciFactory_lt: InputMaybe<Scalars['Bytes']>;
  maciFactory_lte: InputMaybe<Scalars['Bytes']>;
  maciFactory_not: InputMaybe<Scalars['Bytes']>;
  maciFactory_not_contains: InputMaybe<Scalars['Bytes']>;
  maciFactory_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  maxMessages: InputMaybe<Scalars['BigInt']>;
  maxMessages_gt: InputMaybe<Scalars['BigInt']>;
  maxMessages_gte: InputMaybe<Scalars['BigInt']>;
  maxMessages_in: InputMaybe<Array<Scalars['BigInt']>>;
  maxMessages_lt: InputMaybe<Scalars['BigInt']>;
  maxMessages_lte: InputMaybe<Scalars['BigInt']>;
  maxMessages_not: InputMaybe<Scalars['BigInt']>;
  maxMessages_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  maxUsers: InputMaybe<Scalars['BigInt']>;
  maxUsers_gt: InputMaybe<Scalars['BigInt']>;
  maxUsers_gte: InputMaybe<Scalars['BigInt']>;
  maxUsers_in: InputMaybe<Array<Scalars['BigInt']>>;
  maxUsers_lt: InputMaybe<Scalars['BigInt']>;
  maxUsers_lte: InputMaybe<Scalars['BigInt']>;
  maxUsers_not: InputMaybe<Scalars['BigInt']>;
  maxUsers_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  maxVoteOptions: InputMaybe<Scalars['BigInt']>;
  maxVoteOptions_gt: InputMaybe<Scalars['BigInt']>;
  maxVoteOptions_gte: InputMaybe<Scalars['BigInt']>;
  maxVoteOptions_in: InputMaybe<Array<Scalars['BigInt']>>;
  maxVoteOptions_lt: InputMaybe<Scalars['BigInt']>;
  maxVoteOptions_lte: InputMaybe<Scalars['BigInt']>;
  maxVoteOptions_not: InputMaybe<Scalars['BigInt']>;
  maxVoteOptions_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  messageBatchSize: InputMaybe<Scalars['BigInt']>;
  messageBatchSize_gt: InputMaybe<Scalars['BigInt']>;
  messageBatchSize_gte: InputMaybe<Scalars['BigInt']>;
  messageBatchSize_in: InputMaybe<Array<Scalars['BigInt']>>;
  messageBatchSize_lt: InputMaybe<Scalars['BigInt']>;
  messageBatchSize_lte: InputMaybe<Scalars['BigInt']>;
  messageBatchSize_not: InputMaybe<Scalars['BigInt']>;
  messageBatchSize_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  messageTreeDepth: InputMaybe<Scalars['BigInt']>;
  messageTreeDepth_gt: InputMaybe<Scalars['BigInt']>;
  messageTreeDepth_gte: InputMaybe<Scalars['BigInt']>;
  messageTreeDepth_in: InputMaybe<Array<Scalars['BigInt']>>;
  messageTreeDepth_lt: InputMaybe<Scalars['BigInt']>;
  messageTreeDepth_lte: InputMaybe<Scalars['BigInt']>;
  messageTreeDepth_not: InputMaybe<Scalars['BigInt']>;
  messageTreeDepth_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  nativeToken: InputMaybe<Scalars['Bytes']>;
  nativeTokenInfo: InputMaybe<Scalars['String']>;
  nativeTokenInfo_: InputMaybe<Token_Filter>;
  nativeTokenInfo_contains: InputMaybe<Scalars['String']>;
  nativeTokenInfo_contains_nocase: InputMaybe<Scalars['String']>;
  nativeTokenInfo_ends_with: InputMaybe<Scalars['String']>;
  nativeTokenInfo_ends_with_nocase: InputMaybe<Scalars['String']>;
  nativeTokenInfo_gt: InputMaybe<Scalars['String']>;
  nativeTokenInfo_gte: InputMaybe<Scalars['String']>;
  nativeTokenInfo_in: InputMaybe<Array<Scalars['String']>>;
  nativeTokenInfo_lt: InputMaybe<Scalars['String']>;
  nativeTokenInfo_lte: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not_contains: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not_contains_nocase: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not_ends_with: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not_in: InputMaybe<Array<Scalars['String']>>;
  nativeTokenInfo_not_starts_with: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  nativeTokenInfo_starts_with: InputMaybe<Scalars['String']>;
  nativeTokenInfo_starts_with_nocase: InputMaybe<Scalars['String']>;
  nativeToken_contains: InputMaybe<Scalars['Bytes']>;
  nativeToken_gt: InputMaybe<Scalars['Bytes']>;
  nativeToken_gte: InputMaybe<Scalars['Bytes']>;
  nativeToken_in: InputMaybe<Array<Scalars['Bytes']>>;
  nativeToken_lt: InputMaybe<Scalars['Bytes']>;
  nativeToken_lte: InputMaybe<Scalars['Bytes']>;
  nativeToken_not: InputMaybe<Scalars['Bytes']>;
  nativeToken_not_contains: InputMaybe<Scalars['Bytes']>;
  nativeToken_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  or: InputMaybe<Array<InputMaybe<FundingRoundFactory_Filter>>>;
  owner: InputMaybe<Scalars['Bytes']>;
  owner_contains: InputMaybe<Scalars['Bytes']>;
  owner_gt: InputMaybe<Scalars['Bytes']>;
  owner_gte: InputMaybe<Scalars['Bytes']>;
  owner_in: InputMaybe<Array<Scalars['Bytes']>>;
  owner_lt: InputMaybe<Scalars['Bytes']>;
  owner_lte: InputMaybe<Scalars['Bytes']>;
  owner_not: InputMaybe<Scalars['Bytes']>;
  owner_not_contains: InputMaybe<Scalars['Bytes']>;
  owner_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  qvtVerifier: InputMaybe<Scalars['Bytes']>;
  qvtVerifier_contains: InputMaybe<Scalars['Bytes']>;
  qvtVerifier_gt: InputMaybe<Scalars['Bytes']>;
  qvtVerifier_gte: InputMaybe<Scalars['Bytes']>;
  qvtVerifier_in: InputMaybe<Array<Scalars['Bytes']>>;
  qvtVerifier_lt: InputMaybe<Scalars['Bytes']>;
  qvtVerifier_lte: InputMaybe<Scalars['Bytes']>;
  qvtVerifier_not: InputMaybe<Scalars['Bytes']>;
  qvtVerifier_not_contains: InputMaybe<Scalars['Bytes']>;
  qvtVerifier_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  recipientRegistry: InputMaybe<Scalars['String']>;
  recipientRegistryAddress: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_contains: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_gt: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_gte: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_in: InputMaybe<Array<Scalars['Bytes']>>;
  recipientRegistryAddress_lt: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_lte: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_not: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_not_contains: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  recipientRegistry_: InputMaybe<RecipientRegistry_Filter>;
  recipientRegistry_contains: InputMaybe<Scalars['String']>;
  recipientRegistry_contains_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_ends_with: InputMaybe<Scalars['String']>;
  recipientRegistry_ends_with_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_gt: InputMaybe<Scalars['String']>;
  recipientRegistry_gte: InputMaybe<Scalars['String']>;
  recipientRegistry_in: InputMaybe<Array<Scalars['String']>>;
  recipientRegistry_lt: InputMaybe<Scalars['String']>;
  recipientRegistry_lte: InputMaybe<Scalars['String']>;
  recipientRegistry_not: InputMaybe<Scalars['String']>;
  recipientRegistry_not_contains: InputMaybe<Scalars['String']>;
  recipientRegistry_not_contains_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_not_ends_with: InputMaybe<Scalars['String']>;
  recipientRegistry_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_not_in: InputMaybe<Array<Scalars['String']>>;
  recipientRegistry_not_starts_with: InputMaybe<Scalars['String']>;
  recipientRegistry_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_starts_with: InputMaybe<Scalars['String']>;
  recipientRegistry_starts_with_nocase: InputMaybe<Scalars['String']>;
  signUpDuration: InputMaybe<Scalars['BigInt']>;
  signUpDuration_gt: InputMaybe<Scalars['BigInt']>;
  signUpDuration_gte: InputMaybe<Scalars['BigInt']>;
  signUpDuration_in: InputMaybe<Array<Scalars['BigInt']>>;
  signUpDuration_lt: InputMaybe<Scalars['BigInt']>;
  signUpDuration_lte: InputMaybe<Scalars['BigInt']>;
  signUpDuration_not: InputMaybe<Scalars['BigInt']>;
  signUpDuration_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  stateTreeDepth: InputMaybe<Scalars['BigInt']>;
  stateTreeDepth_gt: InputMaybe<Scalars['BigInt']>;
  stateTreeDepth_gte: InputMaybe<Scalars['BigInt']>;
  stateTreeDepth_in: InputMaybe<Array<Scalars['BigInt']>>;
  stateTreeDepth_lt: InputMaybe<Scalars['BigInt']>;
  stateTreeDepth_lte: InputMaybe<Scalars['BigInt']>;
  stateTreeDepth_not: InputMaybe<Scalars['BigInt']>;
  stateTreeDepth_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  tallyBatchSize: InputMaybe<Scalars['BigInt']>;
  tallyBatchSize_gt: InputMaybe<Scalars['BigInt']>;
  tallyBatchSize_gte: InputMaybe<Scalars['BigInt']>;
  tallyBatchSize_in: InputMaybe<Array<Scalars['BigInt']>>;
  tallyBatchSize_lt: InputMaybe<Scalars['BigInt']>;
  tallyBatchSize_lte: InputMaybe<Scalars['BigInt']>;
  tallyBatchSize_not: InputMaybe<Scalars['BigInt']>;
  tallyBatchSize_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  voteOptionTreeDepth: InputMaybe<Scalars['BigInt']>;
  voteOptionTreeDepth_gt: InputMaybe<Scalars['BigInt']>;
  voteOptionTreeDepth_gte: InputMaybe<Scalars['BigInt']>;
  voteOptionTreeDepth_in: InputMaybe<Array<Scalars['BigInt']>>;
  voteOptionTreeDepth_lt: InputMaybe<Scalars['BigInt']>;
  voteOptionTreeDepth_lte: InputMaybe<Scalars['BigInt']>;
  voteOptionTreeDepth_not: InputMaybe<Scalars['BigInt']>;
  voteOptionTreeDepth_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  votingDuration: InputMaybe<Scalars['BigInt']>;
  votingDuration_gt: InputMaybe<Scalars['BigInt']>;
  votingDuration_gte: InputMaybe<Scalars['BigInt']>;
  votingDuration_in: InputMaybe<Array<Scalars['BigInt']>>;
  votingDuration_lt: InputMaybe<Scalars['BigInt']>;
  votingDuration_lte: InputMaybe<Scalars['BigInt']>;
  votingDuration_not: InputMaybe<Scalars['BigInt']>;
  votingDuration_not_in: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum FundingRoundFactory_OrderBy {
  BatchUstVerifier = 'batchUstVerifier',
  ContributorRegistry = 'contributorRegistry',
  ContributorRegistryAddress = 'contributorRegistryAddress',
  ContributorRegistryContext = 'contributorRegistry__context',
  ContributorRegistryCreatedAt = 'contributorRegistry__createdAt',
  ContributorRegistryId = 'contributorRegistry__id',
  ContributorRegistryLastUpdatedAt = 'contributorRegistry__lastUpdatedAt',
  ContributorRegistryOwner = 'contributorRegistry__owner',
  Coordinator = 'coordinator',
  CoordinatorPubKey = 'coordinatorPubKey',
  CreatedAt = 'createdAt',
  CurrentRound = 'currentRound',
  CurrentRoundContributorCount = 'currentRound__contributorCount',
  CurrentRoundContributorRegistryAddress = 'currentRound__contributorRegistryAddress',
  CurrentRoundCoordinator = 'currentRound__coordinator',
  CurrentRoundCreatedAt = 'currentRound__createdAt',
  CurrentRoundId = 'currentRound__id',
  CurrentRoundIsCancelled = 'currentRound__isCancelled',
  CurrentRoundIsFinalized = 'currentRound__isFinalized',
  CurrentRoundLastUpdatedAt = 'currentRound__lastUpdatedAt',
  CurrentRoundMaci = 'currentRound__maci',
  CurrentRoundMatchingPoolSize = 'currentRound__matchingPoolSize',
  CurrentRoundNativeToken = 'currentRound__nativeToken',
  CurrentRoundRecipientCount = 'currentRound__recipientCount',
  CurrentRoundRecipientRegistryAddress = 'currentRound__recipientRegistryAddress',
  CurrentRoundSignUpDeadline = 'currentRound__signUpDeadline',
  CurrentRoundStartTime = 'currentRound__startTime',
  CurrentRoundTallyHash = 'currentRound__tallyHash',
  CurrentRoundTotalSpent = 'currentRound__totalSpent',
  CurrentRoundTotalVotes = 'currentRound__totalVotes',
  CurrentRoundVoiceCreditFactor = 'currentRound__voiceCreditFactor',
  CurrentRoundVotingDeadline = 'currentRound__votingDeadline',
  FundingRounds = 'fundingRounds',
  Id = 'id',
  LastUpdatedAt = 'lastUpdatedAt',
  MaciFactory = 'maciFactory',
  MaxMessages = 'maxMessages',
  MaxUsers = 'maxUsers',
  MaxVoteOptions = 'maxVoteOptions',
  MessageBatchSize = 'messageBatchSize',
  MessageTreeDepth = 'messageTreeDepth',
  NativeToken = 'nativeToken',
  NativeTokenInfo = 'nativeTokenInfo',
  NativeTokenInfoCreatedAt = 'nativeTokenInfo__createdAt',
  NativeTokenInfoDecimals = 'nativeTokenInfo__decimals',
  NativeTokenInfoId = 'nativeTokenInfo__id',
  NativeTokenInfoLastUpdatedAt = 'nativeTokenInfo__lastUpdatedAt',
  NativeTokenInfoSymbol = 'nativeTokenInfo__symbol',
  NativeTokenInfoTokenAddress = 'nativeTokenInfo__tokenAddress',
  Owner = 'owner',
  QvtVerifier = 'qvtVerifier',
  RecipientRegistry = 'recipientRegistry',
  RecipientRegistryAddress = 'recipientRegistryAddress',
  RecipientRegistryBaseDeposit = 'recipientRegistry__baseDeposit',
  RecipientRegistryChallengePeriodDuration = 'recipientRegistry__challengePeriodDuration',
  RecipientRegistryController = 'recipientRegistry__controller',
  RecipientRegistryCreatedAt = 'recipientRegistry__createdAt',
  RecipientRegistryId = 'recipientRegistry__id',
  RecipientRegistryLastUpdatedAt = 'recipientRegistry__lastUpdatedAt',
  RecipientRegistryMaxRecipients = 'recipientRegistry__maxRecipients',
  RecipientRegistryOwner = 'recipientRegistry__owner',
  SignUpDuration = 'signUpDuration',
  StateTreeDepth = 'stateTreeDepth',
  TallyBatchSize = 'tallyBatchSize',
  VoteOptionTreeDepth = 'voteOptionTreeDepth',
  VotingDuration = 'votingDuration'
}

export type FundingRound_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  and: InputMaybe<Array<InputMaybe<FundingRound_Filter>>>;
  contributions_: InputMaybe<Contribution_Filter>;
  contributorCount: InputMaybe<Scalars['BigInt']>;
  contributorCount_gt: InputMaybe<Scalars['BigInt']>;
  contributorCount_gte: InputMaybe<Scalars['BigInt']>;
  contributorCount_in: InputMaybe<Array<Scalars['BigInt']>>;
  contributorCount_lt: InputMaybe<Scalars['BigInt']>;
  contributorCount_lte: InputMaybe<Scalars['BigInt']>;
  contributorCount_not: InputMaybe<Scalars['BigInt']>;
  contributorCount_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  contributorRegistry: InputMaybe<Scalars['String']>;
  contributorRegistryAddress: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_contains: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_gt: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_gte: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_in: InputMaybe<Array<Scalars['Bytes']>>;
  contributorRegistryAddress_lt: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_lte: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_not: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_not_contains: InputMaybe<Scalars['Bytes']>;
  contributorRegistryAddress_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  contributorRegistry_: InputMaybe<ContributorRegistry_Filter>;
  contributorRegistry_contains: InputMaybe<Scalars['String']>;
  contributorRegistry_contains_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_ends_with: InputMaybe<Scalars['String']>;
  contributorRegistry_ends_with_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_gt: InputMaybe<Scalars['String']>;
  contributorRegistry_gte: InputMaybe<Scalars['String']>;
  contributorRegistry_in: InputMaybe<Array<Scalars['String']>>;
  contributorRegistry_lt: InputMaybe<Scalars['String']>;
  contributorRegistry_lte: InputMaybe<Scalars['String']>;
  contributorRegistry_not: InputMaybe<Scalars['String']>;
  contributorRegistry_not_contains: InputMaybe<Scalars['String']>;
  contributorRegistry_not_contains_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_not_ends_with: InputMaybe<Scalars['String']>;
  contributorRegistry_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_not_in: InputMaybe<Array<Scalars['String']>>;
  contributorRegistry_not_starts_with: InputMaybe<Scalars['String']>;
  contributorRegistry_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  contributorRegistry_starts_with: InputMaybe<Scalars['String']>;
  contributorRegistry_starts_with_nocase: InputMaybe<Scalars['String']>;
  contributors_: InputMaybe<Contributor_Filter>;
  coordinator: InputMaybe<Scalars['Bytes']>;
  coordinator_contains: InputMaybe<Scalars['Bytes']>;
  coordinator_gt: InputMaybe<Scalars['Bytes']>;
  coordinator_gte: InputMaybe<Scalars['Bytes']>;
  coordinator_in: InputMaybe<Array<Scalars['Bytes']>>;
  coordinator_lt: InputMaybe<Scalars['Bytes']>;
  coordinator_lte: InputMaybe<Scalars['Bytes']>;
  coordinator_not: InputMaybe<Scalars['Bytes']>;
  coordinator_not_contains: InputMaybe<Scalars['Bytes']>;
  coordinator_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  createdAt: InputMaybe<Scalars['String']>;
  createdAt_contains: InputMaybe<Scalars['String']>;
  createdAt_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_ends_with: InputMaybe<Scalars['String']>;
  createdAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_gt: InputMaybe<Scalars['String']>;
  createdAt_gte: InputMaybe<Scalars['String']>;
  createdAt_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_lt: InputMaybe<Scalars['String']>;
  createdAt_lte: InputMaybe<Scalars['String']>;
  createdAt_not: InputMaybe<Scalars['String']>;
  createdAt_not_contains: InputMaybe<Scalars['String']>;
  createdAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_not_starts_with: InputMaybe<Scalars['String']>;
  createdAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_starts_with: InputMaybe<Scalars['String']>;
  createdAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory: InputMaybe<Scalars['String']>;
  fundingRoundFactory_: InputMaybe<FundingRoundFactory_Filter>;
  fundingRoundFactory_contains: InputMaybe<Scalars['String']>;
  fundingRoundFactory_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_ends_with: InputMaybe<Scalars['String']>;
  fundingRoundFactory_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_gt: InputMaybe<Scalars['String']>;
  fundingRoundFactory_gte: InputMaybe<Scalars['String']>;
  fundingRoundFactory_in: InputMaybe<Array<Scalars['String']>>;
  fundingRoundFactory_lt: InputMaybe<Scalars['String']>;
  fundingRoundFactory_lte: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_contains: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_ends_with: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_in: InputMaybe<Array<Scalars['String']>>;
  fundingRoundFactory_not_starts_with: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_starts_with: InputMaybe<Scalars['String']>;
  fundingRoundFactory_starts_with_nocase: InputMaybe<Scalars['String']>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  isCancelled: InputMaybe<Scalars['Boolean']>;
  isCancelled_in: InputMaybe<Array<Scalars['Boolean']>>;
  isCancelled_not: InputMaybe<Scalars['Boolean']>;
  isCancelled_not_in: InputMaybe<Array<Scalars['Boolean']>>;
  isFinalized: InputMaybe<Scalars['Boolean']>;
  isFinalized_in: InputMaybe<Array<Scalars['Boolean']>>;
  isFinalized_not: InputMaybe<Scalars['Boolean']>;
  isFinalized_not_in: InputMaybe<Array<Scalars['Boolean']>>;
  lastUpdatedAt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_lt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_lte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  maci: InputMaybe<Scalars['Bytes']>;
  maci_contains: InputMaybe<Scalars['Bytes']>;
  maci_gt: InputMaybe<Scalars['Bytes']>;
  maci_gte: InputMaybe<Scalars['Bytes']>;
  maci_in: InputMaybe<Array<Scalars['Bytes']>>;
  maci_lt: InputMaybe<Scalars['Bytes']>;
  maci_lte: InputMaybe<Scalars['Bytes']>;
  maci_not: InputMaybe<Scalars['Bytes']>;
  maci_not_contains: InputMaybe<Scalars['Bytes']>;
  maci_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  matchingPoolSize: InputMaybe<Scalars['BigInt']>;
  matchingPoolSize_gt: InputMaybe<Scalars['BigInt']>;
  matchingPoolSize_gte: InputMaybe<Scalars['BigInt']>;
  matchingPoolSize_in: InputMaybe<Array<Scalars['BigInt']>>;
  matchingPoolSize_lt: InputMaybe<Scalars['BigInt']>;
  matchingPoolSize_lte: InputMaybe<Scalars['BigInt']>;
  matchingPoolSize_not: InputMaybe<Scalars['BigInt']>;
  matchingPoolSize_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  messages_: InputMaybe<Message_Filter>;
  nativeToken: InputMaybe<Scalars['Bytes']>;
  nativeTokenInfo: InputMaybe<Scalars['String']>;
  nativeTokenInfo_: InputMaybe<Token_Filter>;
  nativeTokenInfo_contains: InputMaybe<Scalars['String']>;
  nativeTokenInfo_contains_nocase: InputMaybe<Scalars['String']>;
  nativeTokenInfo_ends_with: InputMaybe<Scalars['String']>;
  nativeTokenInfo_ends_with_nocase: InputMaybe<Scalars['String']>;
  nativeTokenInfo_gt: InputMaybe<Scalars['String']>;
  nativeTokenInfo_gte: InputMaybe<Scalars['String']>;
  nativeTokenInfo_in: InputMaybe<Array<Scalars['String']>>;
  nativeTokenInfo_lt: InputMaybe<Scalars['String']>;
  nativeTokenInfo_lte: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not_contains: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not_contains_nocase: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not_ends_with: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not_in: InputMaybe<Array<Scalars['String']>>;
  nativeTokenInfo_not_starts_with: InputMaybe<Scalars['String']>;
  nativeTokenInfo_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  nativeTokenInfo_starts_with: InputMaybe<Scalars['String']>;
  nativeTokenInfo_starts_with_nocase: InputMaybe<Scalars['String']>;
  nativeToken_contains: InputMaybe<Scalars['Bytes']>;
  nativeToken_gt: InputMaybe<Scalars['Bytes']>;
  nativeToken_gte: InputMaybe<Scalars['Bytes']>;
  nativeToken_in: InputMaybe<Array<Scalars['Bytes']>>;
  nativeToken_lt: InputMaybe<Scalars['Bytes']>;
  nativeToken_lte: InputMaybe<Scalars['Bytes']>;
  nativeToken_not: InputMaybe<Scalars['Bytes']>;
  nativeToken_not_contains: InputMaybe<Scalars['Bytes']>;
  nativeToken_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  or: InputMaybe<Array<InputMaybe<FundingRound_Filter>>>;
  recipientCount: InputMaybe<Scalars['BigInt']>;
  recipientCount_gt: InputMaybe<Scalars['BigInt']>;
  recipientCount_gte: InputMaybe<Scalars['BigInt']>;
  recipientCount_in: InputMaybe<Array<Scalars['BigInt']>>;
  recipientCount_lt: InputMaybe<Scalars['BigInt']>;
  recipientCount_lte: InputMaybe<Scalars['BigInt']>;
  recipientCount_not: InputMaybe<Scalars['BigInt']>;
  recipientCount_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  recipientRegistry: InputMaybe<Scalars['String']>;
  recipientRegistryAddress: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_contains: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_gt: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_gte: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_in: InputMaybe<Array<Scalars['Bytes']>>;
  recipientRegistryAddress_lt: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_lte: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_not: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_not_contains: InputMaybe<Scalars['Bytes']>;
  recipientRegistryAddress_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  recipientRegistry_: InputMaybe<RecipientRegistry_Filter>;
  recipientRegistry_contains: InputMaybe<Scalars['String']>;
  recipientRegistry_contains_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_ends_with: InputMaybe<Scalars['String']>;
  recipientRegistry_ends_with_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_gt: InputMaybe<Scalars['String']>;
  recipientRegistry_gte: InputMaybe<Scalars['String']>;
  recipientRegistry_in: InputMaybe<Array<Scalars['String']>>;
  recipientRegistry_lt: InputMaybe<Scalars['String']>;
  recipientRegistry_lte: InputMaybe<Scalars['String']>;
  recipientRegistry_not: InputMaybe<Scalars['String']>;
  recipientRegistry_not_contains: InputMaybe<Scalars['String']>;
  recipientRegistry_not_contains_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_not_ends_with: InputMaybe<Scalars['String']>;
  recipientRegistry_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_not_in: InputMaybe<Array<Scalars['String']>>;
  recipientRegistry_not_starts_with: InputMaybe<Scalars['String']>;
  recipientRegistry_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_starts_with: InputMaybe<Scalars['String']>;
  recipientRegistry_starts_with_nocase: InputMaybe<Scalars['String']>;
  recipients_: InputMaybe<Recipient_Filter>;
  signUpDeadline: InputMaybe<Scalars['BigInt']>;
  signUpDeadline_gt: InputMaybe<Scalars['BigInt']>;
  signUpDeadline_gte: InputMaybe<Scalars['BigInt']>;
  signUpDeadline_in: InputMaybe<Array<Scalars['BigInt']>>;
  signUpDeadline_lt: InputMaybe<Scalars['BigInt']>;
  signUpDeadline_lte: InputMaybe<Scalars['BigInt']>;
  signUpDeadline_not: InputMaybe<Scalars['BigInt']>;
  signUpDeadline_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  startTime: InputMaybe<Scalars['BigInt']>;
  startTime_gt: InputMaybe<Scalars['BigInt']>;
  startTime_gte: InputMaybe<Scalars['BigInt']>;
  startTime_in: InputMaybe<Array<Scalars['BigInt']>>;
  startTime_lt: InputMaybe<Scalars['BigInt']>;
  startTime_lte: InputMaybe<Scalars['BigInt']>;
  startTime_not: InputMaybe<Scalars['BigInt']>;
  startTime_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  tallyHash: InputMaybe<Scalars['String']>;
  tallyHash_contains: InputMaybe<Scalars['String']>;
  tallyHash_contains_nocase: InputMaybe<Scalars['String']>;
  tallyHash_ends_with: InputMaybe<Scalars['String']>;
  tallyHash_ends_with_nocase: InputMaybe<Scalars['String']>;
  tallyHash_gt: InputMaybe<Scalars['String']>;
  tallyHash_gte: InputMaybe<Scalars['String']>;
  tallyHash_in: InputMaybe<Array<Scalars['String']>>;
  tallyHash_lt: InputMaybe<Scalars['String']>;
  tallyHash_lte: InputMaybe<Scalars['String']>;
  tallyHash_not: InputMaybe<Scalars['String']>;
  tallyHash_not_contains: InputMaybe<Scalars['String']>;
  tallyHash_not_contains_nocase: InputMaybe<Scalars['String']>;
  tallyHash_not_ends_with: InputMaybe<Scalars['String']>;
  tallyHash_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  tallyHash_not_in: InputMaybe<Array<Scalars['String']>>;
  tallyHash_not_starts_with: InputMaybe<Scalars['String']>;
  tallyHash_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  tallyHash_starts_with: InputMaybe<Scalars['String']>;
  tallyHash_starts_with_nocase: InputMaybe<Scalars['String']>;
  totalSpent: InputMaybe<Scalars['BigInt']>;
  totalSpent_gt: InputMaybe<Scalars['BigInt']>;
  totalSpent_gte: InputMaybe<Scalars['BigInt']>;
  totalSpent_in: InputMaybe<Array<Scalars['BigInt']>>;
  totalSpent_lt: InputMaybe<Scalars['BigInt']>;
  totalSpent_lte: InputMaybe<Scalars['BigInt']>;
  totalSpent_not: InputMaybe<Scalars['BigInt']>;
  totalSpent_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  totalVotes: InputMaybe<Scalars['BigInt']>;
  totalVotes_gt: InputMaybe<Scalars['BigInt']>;
  totalVotes_gte: InputMaybe<Scalars['BigInt']>;
  totalVotes_in: InputMaybe<Array<Scalars['BigInt']>>;
  totalVotes_lt: InputMaybe<Scalars['BigInt']>;
  totalVotes_lte: InputMaybe<Scalars['BigInt']>;
  totalVotes_not: InputMaybe<Scalars['BigInt']>;
  totalVotes_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  voiceCreditFactor: InputMaybe<Scalars['BigInt']>;
  voiceCreditFactor_gt: InputMaybe<Scalars['BigInt']>;
  voiceCreditFactor_gte: InputMaybe<Scalars['BigInt']>;
  voiceCreditFactor_in: InputMaybe<Array<Scalars['BigInt']>>;
  voiceCreditFactor_lt: InputMaybe<Scalars['BigInt']>;
  voiceCreditFactor_lte: InputMaybe<Scalars['BigInt']>;
  voiceCreditFactor_not: InputMaybe<Scalars['BigInt']>;
  voiceCreditFactor_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  votes_: InputMaybe<Vote_Filter>;
  votingDeadline: InputMaybe<Scalars['BigInt']>;
  votingDeadline_gt: InputMaybe<Scalars['BigInt']>;
  votingDeadline_gte: InputMaybe<Scalars['BigInt']>;
  votingDeadline_in: InputMaybe<Array<Scalars['BigInt']>>;
  votingDeadline_lt: InputMaybe<Scalars['BigInt']>;
  votingDeadline_lte: InputMaybe<Scalars['BigInt']>;
  votingDeadline_not: InputMaybe<Scalars['BigInt']>;
  votingDeadline_not_in: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum FundingRound_OrderBy {
  Contributions = 'contributions',
  ContributorCount = 'contributorCount',
  ContributorRegistry = 'contributorRegistry',
  ContributorRegistryAddress = 'contributorRegistryAddress',
  ContributorRegistryContext = 'contributorRegistry__context',
  ContributorRegistryCreatedAt = 'contributorRegistry__createdAt',
  ContributorRegistryId = 'contributorRegistry__id',
  ContributorRegistryLastUpdatedAt = 'contributorRegistry__lastUpdatedAt',
  ContributorRegistryOwner = 'contributorRegistry__owner',
  Contributors = 'contributors',
  Coordinator = 'coordinator',
  CreatedAt = 'createdAt',
  FundingRoundFactory = 'fundingRoundFactory',
  FundingRoundFactoryBatchUstVerifier = 'fundingRoundFactory__batchUstVerifier',
  FundingRoundFactoryContributorRegistryAddress = 'fundingRoundFactory__contributorRegistryAddress',
  FundingRoundFactoryCoordinator = 'fundingRoundFactory__coordinator',
  FundingRoundFactoryCoordinatorPubKey = 'fundingRoundFactory__coordinatorPubKey',
  FundingRoundFactoryCreatedAt = 'fundingRoundFactory__createdAt',
  FundingRoundFactoryId = 'fundingRoundFactory__id',
  FundingRoundFactoryLastUpdatedAt = 'fundingRoundFactory__lastUpdatedAt',
  FundingRoundFactoryMaciFactory = 'fundingRoundFactory__maciFactory',
  FundingRoundFactoryMaxMessages = 'fundingRoundFactory__maxMessages',
  FundingRoundFactoryMaxUsers = 'fundingRoundFactory__maxUsers',
  FundingRoundFactoryMaxVoteOptions = 'fundingRoundFactory__maxVoteOptions',
  FundingRoundFactoryMessageBatchSize = 'fundingRoundFactory__messageBatchSize',
  FundingRoundFactoryMessageTreeDepth = 'fundingRoundFactory__messageTreeDepth',
  FundingRoundFactoryNativeToken = 'fundingRoundFactory__nativeToken',
  FundingRoundFactoryOwner = 'fundingRoundFactory__owner',
  FundingRoundFactoryQvtVerifier = 'fundingRoundFactory__qvtVerifier',
  FundingRoundFactoryRecipientRegistryAddress = 'fundingRoundFactory__recipientRegistryAddress',
  FundingRoundFactorySignUpDuration = 'fundingRoundFactory__signUpDuration',
  FundingRoundFactoryStateTreeDepth = 'fundingRoundFactory__stateTreeDepth',
  FundingRoundFactoryTallyBatchSize = 'fundingRoundFactory__tallyBatchSize',
  FundingRoundFactoryVoteOptionTreeDepth = 'fundingRoundFactory__voteOptionTreeDepth',
  FundingRoundFactoryVotingDuration = 'fundingRoundFactory__votingDuration',
  Id = 'id',
  IsCancelled = 'isCancelled',
  IsFinalized = 'isFinalized',
  LastUpdatedAt = 'lastUpdatedAt',
  Maci = 'maci',
  MatchingPoolSize = 'matchingPoolSize',
  Messages = 'messages',
  NativeToken = 'nativeToken',
  NativeTokenInfo = 'nativeTokenInfo',
  NativeTokenInfoCreatedAt = 'nativeTokenInfo__createdAt',
  NativeTokenInfoDecimals = 'nativeTokenInfo__decimals',
  NativeTokenInfoId = 'nativeTokenInfo__id',
  NativeTokenInfoLastUpdatedAt = 'nativeTokenInfo__lastUpdatedAt',
  NativeTokenInfoSymbol = 'nativeTokenInfo__symbol',
  NativeTokenInfoTokenAddress = 'nativeTokenInfo__tokenAddress',
  RecipientCount = 'recipientCount',
  RecipientRegistry = 'recipientRegistry',
  RecipientRegistryAddress = 'recipientRegistryAddress',
  RecipientRegistryBaseDeposit = 'recipientRegistry__baseDeposit',
  RecipientRegistryChallengePeriodDuration = 'recipientRegistry__challengePeriodDuration',
  RecipientRegistryController = 'recipientRegistry__controller',
  RecipientRegistryCreatedAt = 'recipientRegistry__createdAt',
  RecipientRegistryId = 'recipientRegistry__id',
  RecipientRegistryLastUpdatedAt = 'recipientRegistry__lastUpdatedAt',
  RecipientRegistryMaxRecipients = 'recipientRegistry__maxRecipients',
  RecipientRegistryOwner = 'recipientRegistry__owner',
  Recipients = 'recipients',
  SignUpDeadline = 'signUpDeadline',
  StartTime = 'startTime',
  TallyHash = 'tallyHash',
  TotalSpent = 'totalSpent',
  TotalVotes = 'totalVotes',
  VoiceCreditFactor = 'voiceCreditFactor',
  Votes = 'votes',
  VotingDeadline = 'votingDeadline'
}

export type Message = {
  __typename?: 'Message';
  blockNumber: Scalars['BigInt'];
  data: Maybe<Array<Scalars['BigInt']>>;
  fundingRound: Maybe<FundingRound>;
  id: Scalars['ID'];
  iv: Scalars['BigInt'];
  publicKey: Maybe<PublicKey>;
  submittedBy: Maybe<Scalars['Bytes']>;
  timestamp: Maybe<Scalars['String']>;
  transactionIndex: Scalars['BigInt'];
};

export type Message_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  and: InputMaybe<Array<InputMaybe<Message_Filter>>>;
  blockNumber: InputMaybe<Scalars['BigInt']>;
  blockNumber_gt: InputMaybe<Scalars['BigInt']>;
  blockNumber_gte: InputMaybe<Scalars['BigInt']>;
  blockNumber_in: InputMaybe<Array<Scalars['BigInt']>>;
  blockNumber_lt: InputMaybe<Scalars['BigInt']>;
  blockNumber_lte: InputMaybe<Scalars['BigInt']>;
  blockNumber_not: InputMaybe<Scalars['BigInt']>;
  blockNumber_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  data: InputMaybe<Array<Scalars['BigInt']>>;
  data_contains: InputMaybe<Array<Scalars['BigInt']>>;
  data_contains_nocase: InputMaybe<Array<Scalars['BigInt']>>;
  data_not: InputMaybe<Array<Scalars['BigInt']>>;
  data_not_contains: InputMaybe<Array<Scalars['BigInt']>>;
  data_not_contains_nocase: InputMaybe<Array<Scalars['BigInt']>>;
  fundingRound: InputMaybe<Scalars['String']>;
  fundingRound_: InputMaybe<FundingRound_Filter>;
  fundingRound_contains: InputMaybe<Scalars['String']>;
  fundingRound_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRound_ends_with: InputMaybe<Scalars['String']>;
  fundingRound_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_gt: InputMaybe<Scalars['String']>;
  fundingRound_gte: InputMaybe<Scalars['String']>;
  fundingRound_in: InputMaybe<Array<Scalars['String']>>;
  fundingRound_lt: InputMaybe<Scalars['String']>;
  fundingRound_lte: InputMaybe<Scalars['String']>;
  fundingRound_not: InputMaybe<Scalars['String']>;
  fundingRound_not_contains: InputMaybe<Scalars['String']>;
  fundingRound_not_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRound_not_ends_with: InputMaybe<Scalars['String']>;
  fundingRound_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_not_in: InputMaybe<Array<Scalars['String']>>;
  fundingRound_not_starts_with: InputMaybe<Scalars['String']>;
  fundingRound_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_starts_with: InputMaybe<Scalars['String']>;
  fundingRound_starts_with_nocase: InputMaybe<Scalars['String']>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  iv: InputMaybe<Scalars['BigInt']>;
  iv_gt: InputMaybe<Scalars['BigInt']>;
  iv_gte: InputMaybe<Scalars['BigInt']>;
  iv_in: InputMaybe<Array<Scalars['BigInt']>>;
  iv_lt: InputMaybe<Scalars['BigInt']>;
  iv_lte: InputMaybe<Scalars['BigInt']>;
  iv_not: InputMaybe<Scalars['BigInt']>;
  iv_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  or: InputMaybe<Array<InputMaybe<Message_Filter>>>;
  publicKey: InputMaybe<Scalars['String']>;
  publicKey_: InputMaybe<PublicKey_Filter>;
  publicKey_contains: InputMaybe<Scalars['String']>;
  publicKey_contains_nocase: InputMaybe<Scalars['String']>;
  publicKey_ends_with: InputMaybe<Scalars['String']>;
  publicKey_ends_with_nocase: InputMaybe<Scalars['String']>;
  publicKey_gt: InputMaybe<Scalars['String']>;
  publicKey_gte: InputMaybe<Scalars['String']>;
  publicKey_in: InputMaybe<Array<Scalars['String']>>;
  publicKey_lt: InputMaybe<Scalars['String']>;
  publicKey_lte: InputMaybe<Scalars['String']>;
  publicKey_not: InputMaybe<Scalars['String']>;
  publicKey_not_contains: InputMaybe<Scalars['String']>;
  publicKey_not_contains_nocase: InputMaybe<Scalars['String']>;
  publicKey_not_ends_with: InputMaybe<Scalars['String']>;
  publicKey_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  publicKey_not_in: InputMaybe<Array<Scalars['String']>>;
  publicKey_not_starts_with: InputMaybe<Scalars['String']>;
  publicKey_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  publicKey_starts_with: InputMaybe<Scalars['String']>;
  publicKey_starts_with_nocase: InputMaybe<Scalars['String']>;
  submittedBy: InputMaybe<Scalars['Bytes']>;
  submittedBy_contains: InputMaybe<Scalars['Bytes']>;
  submittedBy_gt: InputMaybe<Scalars['Bytes']>;
  submittedBy_gte: InputMaybe<Scalars['Bytes']>;
  submittedBy_in: InputMaybe<Array<Scalars['Bytes']>>;
  submittedBy_lt: InputMaybe<Scalars['Bytes']>;
  submittedBy_lte: InputMaybe<Scalars['Bytes']>;
  submittedBy_not: InputMaybe<Scalars['Bytes']>;
  submittedBy_not_contains: InputMaybe<Scalars['Bytes']>;
  submittedBy_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  timestamp: InputMaybe<Scalars['String']>;
  timestamp_contains: InputMaybe<Scalars['String']>;
  timestamp_contains_nocase: InputMaybe<Scalars['String']>;
  timestamp_ends_with: InputMaybe<Scalars['String']>;
  timestamp_ends_with_nocase: InputMaybe<Scalars['String']>;
  timestamp_gt: InputMaybe<Scalars['String']>;
  timestamp_gte: InputMaybe<Scalars['String']>;
  timestamp_in: InputMaybe<Array<Scalars['String']>>;
  timestamp_lt: InputMaybe<Scalars['String']>;
  timestamp_lte: InputMaybe<Scalars['String']>;
  timestamp_not: InputMaybe<Scalars['String']>;
  timestamp_not_contains: InputMaybe<Scalars['String']>;
  timestamp_not_contains_nocase: InputMaybe<Scalars['String']>;
  timestamp_not_ends_with: InputMaybe<Scalars['String']>;
  timestamp_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  timestamp_not_in: InputMaybe<Array<Scalars['String']>>;
  timestamp_not_starts_with: InputMaybe<Scalars['String']>;
  timestamp_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  timestamp_starts_with: InputMaybe<Scalars['String']>;
  timestamp_starts_with_nocase: InputMaybe<Scalars['String']>;
  transactionIndex: InputMaybe<Scalars['BigInt']>;
  transactionIndex_gt: InputMaybe<Scalars['BigInt']>;
  transactionIndex_gte: InputMaybe<Scalars['BigInt']>;
  transactionIndex_in: InputMaybe<Array<Scalars['BigInt']>>;
  transactionIndex_lt: InputMaybe<Scalars['BigInt']>;
  transactionIndex_lte: InputMaybe<Scalars['BigInt']>;
  transactionIndex_not: InputMaybe<Scalars['BigInt']>;
  transactionIndex_not_in: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum Message_OrderBy {
  BlockNumber = 'blockNumber',
  Data = 'data',
  FundingRound = 'fundingRound',
  FundingRoundContributorCount = 'fundingRound__contributorCount',
  FundingRoundContributorRegistryAddress = 'fundingRound__contributorRegistryAddress',
  FundingRoundCoordinator = 'fundingRound__coordinator',
  FundingRoundCreatedAt = 'fundingRound__createdAt',
  FundingRoundId = 'fundingRound__id',
  FundingRoundIsCancelled = 'fundingRound__isCancelled',
  FundingRoundIsFinalized = 'fundingRound__isFinalized',
  FundingRoundLastUpdatedAt = 'fundingRound__lastUpdatedAt',
  FundingRoundMaci = 'fundingRound__maci',
  FundingRoundMatchingPoolSize = 'fundingRound__matchingPoolSize',
  FundingRoundNativeToken = 'fundingRound__nativeToken',
  FundingRoundRecipientCount = 'fundingRound__recipientCount',
  FundingRoundRecipientRegistryAddress = 'fundingRound__recipientRegistryAddress',
  FundingRoundSignUpDeadline = 'fundingRound__signUpDeadline',
  FundingRoundStartTime = 'fundingRound__startTime',
  FundingRoundTallyHash = 'fundingRound__tallyHash',
  FundingRoundTotalSpent = 'fundingRound__totalSpent',
  FundingRoundTotalVotes = 'fundingRound__totalVotes',
  FundingRoundVoiceCreditFactor = 'fundingRound__voiceCreditFactor',
  FundingRoundVotingDeadline = 'fundingRound__votingDeadline',
  Id = 'id',
  Iv = 'iv',
  PublicKey = 'publicKey',
  PublicKeyId = 'publicKey__id',
  PublicKeyStateIndex = 'publicKey__stateIndex',
  PublicKeyVoiceCreditBalance = 'publicKey__voiceCreditBalance',
  PublicKeyX = 'publicKey__x',
  PublicKeyY = 'publicKey__y',
  SubmittedBy = 'submittedBy',
  Timestamp = 'timestamp',
  TransactionIndex = 'transactionIndex'
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type PublicKey = {
  __typename?: 'PublicKey';
  fundingRound: Maybe<FundingRound>;
  id: Scalars['ID'];
  messages: Maybe<Array<Message>>;
  stateIndex: Maybe<Scalars['BigInt']>;
  voiceCreditBalance: Maybe<Scalars['BigInt']>;
  x: Scalars['BigInt'];
  y: Scalars['BigInt'];
};


export type PublicKeyMessagesArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Message_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<Message_Filter>;
};

export type PublicKey_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  and: InputMaybe<Array<InputMaybe<PublicKey_Filter>>>;
  fundingRound: InputMaybe<Scalars['String']>;
  fundingRound_: InputMaybe<FundingRound_Filter>;
  fundingRound_contains: InputMaybe<Scalars['String']>;
  fundingRound_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRound_ends_with: InputMaybe<Scalars['String']>;
  fundingRound_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_gt: InputMaybe<Scalars['String']>;
  fundingRound_gte: InputMaybe<Scalars['String']>;
  fundingRound_in: InputMaybe<Array<Scalars['String']>>;
  fundingRound_lt: InputMaybe<Scalars['String']>;
  fundingRound_lte: InputMaybe<Scalars['String']>;
  fundingRound_not: InputMaybe<Scalars['String']>;
  fundingRound_not_contains: InputMaybe<Scalars['String']>;
  fundingRound_not_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRound_not_ends_with: InputMaybe<Scalars['String']>;
  fundingRound_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_not_in: InputMaybe<Array<Scalars['String']>>;
  fundingRound_not_starts_with: InputMaybe<Scalars['String']>;
  fundingRound_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_starts_with: InputMaybe<Scalars['String']>;
  fundingRound_starts_with_nocase: InputMaybe<Scalars['String']>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  messages_: InputMaybe<Message_Filter>;
  or: InputMaybe<Array<InputMaybe<PublicKey_Filter>>>;
  stateIndex: InputMaybe<Scalars['BigInt']>;
  stateIndex_gt: InputMaybe<Scalars['BigInt']>;
  stateIndex_gte: InputMaybe<Scalars['BigInt']>;
  stateIndex_in: InputMaybe<Array<Scalars['BigInt']>>;
  stateIndex_lt: InputMaybe<Scalars['BigInt']>;
  stateIndex_lte: InputMaybe<Scalars['BigInt']>;
  stateIndex_not: InputMaybe<Scalars['BigInt']>;
  stateIndex_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  voiceCreditBalance: InputMaybe<Scalars['BigInt']>;
  voiceCreditBalance_gt: InputMaybe<Scalars['BigInt']>;
  voiceCreditBalance_gte: InputMaybe<Scalars['BigInt']>;
  voiceCreditBalance_in: InputMaybe<Array<Scalars['BigInt']>>;
  voiceCreditBalance_lt: InputMaybe<Scalars['BigInt']>;
  voiceCreditBalance_lte: InputMaybe<Scalars['BigInt']>;
  voiceCreditBalance_not: InputMaybe<Scalars['BigInt']>;
  voiceCreditBalance_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  x: InputMaybe<Scalars['BigInt']>;
  x_gt: InputMaybe<Scalars['BigInt']>;
  x_gte: InputMaybe<Scalars['BigInt']>;
  x_in: InputMaybe<Array<Scalars['BigInt']>>;
  x_lt: InputMaybe<Scalars['BigInt']>;
  x_lte: InputMaybe<Scalars['BigInt']>;
  x_not: InputMaybe<Scalars['BigInt']>;
  x_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  y: InputMaybe<Scalars['BigInt']>;
  y_gt: InputMaybe<Scalars['BigInt']>;
  y_gte: InputMaybe<Scalars['BigInt']>;
  y_in: InputMaybe<Array<Scalars['BigInt']>>;
  y_lt: InputMaybe<Scalars['BigInt']>;
  y_lte: InputMaybe<Scalars['BigInt']>;
  y_not: InputMaybe<Scalars['BigInt']>;
  y_not_in: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum PublicKey_OrderBy {
  FundingRound = 'fundingRound',
  FundingRoundContributorCount = 'fundingRound__contributorCount',
  FundingRoundContributorRegistryAddress = 'fundingRound__contributorRegistryAddress',
  FundingRoundCoordinator = 'fundingRound__coordinator',
  FundingRoundCreatedAt = 'fundingRound__createdAt',
  FundingRoundId = 'fundingRound__id',
  FundingRoundIsCancelled = 'fundingRound__isCancelled',
  FundingRoundIsFinalized = 'fundingRound__isFinalized',
  FundingRoundLastUpdatedAt = 'fundingRound__lastUpdatedAt',
  FundingRoundMaci = 'fundingRound__maci',
  FundingRoundMatchingPoolSize = 'fundingRound__matchingPoolSize',
  FundingRoundNativeToken = 'fundingRound__nativeToken',
  FundingRoundRecipientCount = 'fundingRound__recipientCount',
  FundingRoundRecipientRegistryAddress = 'fundingRound__recipientRegistryAddress',
  FundingRoundSignUpDeadline = 'fundingRound__signUpDeadline',
  FundingRoundStartTime = 'fundingRound__startTime',
  FundingRoundTallyHash = 'fundingRound__tallyHash',
  FundingRoundTotalSpent = 'fundingRound__totalSpent',
  FundingRoundTotalVotes = 'fundingRound__totalVotes',
  FundingRoundVoiceCreditFactor = 'fundingRound__voiceCreditFactor',
  FundingRoundVotingDeadline = 'fundingRound__votingDeadline',
  Id = 'id',
  Messages = 'messages',
  StateIndex = 'stateIndex',
  VoiceCreditBalance = 'voiceCreditBalance',
  X = 'x',
  Y = 'y'
}

export type Query = {
  __typename?: 'Query';
  /** Access to subgraph metadata */
  _meta: Maybe<_Meta_>;
  contribution: Maybe<Contribution>;
  contributions: Array<Contribution>;
  contributor: Maybe<Contributor>;
  contributorRegistries: Array<ContributorRegistry>;
  contributorRegistry: Maybe<ContributorRegistry>;
  contributors: Array<Contributor>;
  coordinator: Maybe<Coordinator>;
  coordinators: Array<Coordinator>;
  donation: Maybe<Donation>;
  donations: Array<Donation>;
  fundingRound: Maybe<FundingRound>;
  fundingRoundFactories: Array<FundingRoundFactory>;
  fundingRoundFactory: Maybe<FundingRoundFactory>;
  fundingRounds: Array<FundingRound>;
  message: Maybe<Message>;
  messages: Array<Message>;
  publicKey: Maybe<PublicKey>;
  publicKeys: Array<PublicKey>;
  recipient: Maybe<Recipient>;
  recipientRegistries: Array<RecipientRegistry>;
  recipientRegistry: Maybe<RecipientRegistry>;
  recipients: Array<Recipient>;
  token: Maybe<Token>;
  tokens: Array<Token>;
  vote: Maybe<Vote>;
  votes: Array<Vote>;
};


export type Query_MetaArgs = {
  block: InputMaybe<Block_Height>;
};


export type QueryContributionArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryContributionsArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Contribution_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Contribution_Filter>;
};


export type QueryContributorArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryContributorRegistriesArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<ContributorRegistry_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<ContributorRegistry_Filter>;
};


export type QueryContributorRegistryArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryContributorsArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Contributor_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Contributor_Filter>;
};


export type QueryCoordinatorArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryCoordinatorsArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Coordinator_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Coordinator_Filter>;
};


export type QueryDonationArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryDonationsArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Donation_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Donation_Filter>;
};


export type QueryFundingRoundArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryFundingRoundFactoriesArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<FundingRoundFactory_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<FundingRoundFactory_Filter>;
};


export type QueryFundingRoundFactoryArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryFundingRoundsArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<FundingRound_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<FundingRound_Filter>;
};


export type QueryMessageArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryMessagesArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Message_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Message_Filter>;
};


export type QueryPublicKeyArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPublicKeysArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<PublicKey_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<PublicKey_Filter>;
};


export type QueryRecipientArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryRecipientRegistriesArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<RecipientRegistry_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<RecipientRegistry_Filter>;
};


export type QueryRecipientRegistryArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryRecipientsArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Recipient_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Recipient_Filter>;
};


export type QueryTokenArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokensArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Token_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Token_Filter>;
};


export type QueryVoteArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryVotesArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Vote_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Vote_Filter>;
};

export type Recipient = {
  __typename?: 'Recipient';
  createdAt: Maybe<Scalars['String']>;
  deposit: Maybe<Scalars['BigInt']>;
  fundingRounds: Maybe<Array<FundingRound>>;
  id: Scalars['ID'];
  lastUpdatedAt: Maybe<Scalars['String']>;
  recipientAddress: Maybe<Scalars['Bytes']>;
  recipientIndex: Maybe<Scalars['BigInt']>;
  recipientMetadata: Maybe<Scalars['String']>;
  recipientRegistry: Maybe<RecipientRegistry>;
  rejected: Maybe<Scalars['Boolean']>;
  requestResolvedHash: Maybe<Scalars['Bytes']>;
  requestSubmittedHash: Maybe<Scalars['Bytes']>;
  requestType: Maybe<Scalars['String']>;
  requester: Maybe<Scalars['String']>;
  submissionTime: Maybe<Scalars['String']>;
  verified: Maybe<Scalars['Boolean']>;
  voteOptionIndex: Maybe<Scalars['BigInt']>;
};


export type RecipientFundingRoundsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<FundingRound_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<FundingRound_Filter>;
};

export type RecipientRegistry = {
  __typename?: 'RecipientRegistry';
  baseDeposit: Maybe<Scalars['BigInt']>;
  challengePeriodDuration: Maybe<Scalars['BigInt']>;
  controller: Maybe<Scalars['Bytes']>;
  createdAt: Maybe<Scalars['String']>;
  fundingRoundFactory: Maybe<FundingRoundFactory>;
  id: Scalars['ID'];
  lastUpdatedAt: Maybe<Scalars['String']>;
  maxRecipients: Maybe<Scalars['BigInt']>;
  owner: Maybe<Scalars['Bytes']>;
  recipients: Maybe<Array<Recipient>>;
};


export type RecipientRegistryRecipientsArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Recipient_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where: InputMaybe<Recipient_Filter>;
};

export type RecipientRegistry_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  and: InputMaybe<Array<InputMaybe<RecipientRegistry_Filter>>>;
  baseDeposit: InputMaybe<Scalars['BigInt']>;
  baseDeposit_gt: InputMaybe<Scalars['BigInt']>;
  baseDeposit_gte: InputMaybe<Scalars['BigInt']>;
  baseDeposit_in: InputMaybe<Array<Scalars['BigInt']>>;
  baseDeposit_lt: InputMaybe<Scalars['BigInt']>;
  baseDeposit_lte: InputMaybe<Scalars['BigInt']>;
  baseDeposit_not: InputMaybe<Scalars['BigInt']>;
  baseDeposit_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  challengePeriodDuration: InputMaybe<Scalars['BigInt']>;
  challengePeriodDuration_gt: InputMaybe<Scalars['BigInt']>;
  challengePeriodDuration_gte: InputMaybe<Scalars['BigInt']>;
  challengePeriodDuration_in: InputMaybe<Array<Scalars['BigInt']>>;
  challengePeriodDuration_lt: InputMaybe<Scalars['BigInt']>;
  challengePeriodDuration_lte: InputMaybe<Scalars['BigInt']>;
  challengePeriodDuration_not: InputMaybe<Scalars['BigInt']>;
  challengePeriodDuration_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  controller: InputMaybe<Scalars['Bytes']>;
  controller_contains: InputMaybe<Scalars['Bytes']>;
  controller_gt: InputMaybe<Scalars['Bytes']>;
  controller_gte: InputMaybe<Scalars['Bytes']>;
  controller_in: InputMaybe<Array<Scalars['Bytes']>>;
  controller_lt: InputMaybe<Scalars['Bytes']>;
  controller_lte: InputMaybe<Scalars['Bytes']>;
  controller_not: InputMaybe<Scalars['Bytes']>;
  controller_not_contains: InputMaybe<Scalars['Bytes']>;
  controller_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  createdAt: InputMaybe<Scalars['String']>;
  createdAt_contains: InputMaybe<Scalars['String']>;
  createdAt_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_ends_with: InputMaybe<Scalars['String']>;
  createdAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_gt: InputMaybe<Scalars['String']>;
  createdAt_gte: InputMaybe<Scalars['String']>;
  createdAt_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_lt: InputMaybe<Scalars['String']>;
  createdAt_lte: InputMaybe<Scalars['String']>;
  createdAt_not: InputMaybe<Scalars['String']>;
  createdAt_not_contains: InputMaybe<Scalars['String']>;
  createdAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_not_starts_with: InputMaybe<Scalars['String']>;
  createdAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_starts_with: InputMaybe<Scalars['String']>;
  createdAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory: InputMaybe<Scalars['String']>;
  fundingRoundFactory_: InputMaybe<FundingRoundFactory_Filter>;
  fundingRoundFactory_contains: InputMaybe<Scalars['String']>;
  fundingRoundFactory_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_ends_with: InputMaybe<Scalars['String']>;
  fundingRoundFactory_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_gt: InputMaybe<Scalars['String']>;
  fundingRoundFactory_gte: InputMaybe<Scalars['String']>;
  fundingRoundFactory_in: InputMaybe<Array<Scalars['String']>>;
  fundingRoundFactory_lt: InputMaybe<Scalars['String']>;
  fundingRoundFactory_lte: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_contains: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_ends_with: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_in: InputMaybe<Array<Scalars['String']>>;
  fundingRoundFactory_not_starts_with: InputMaybe<Scalars['String']>;
  fundingRoundFactory_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRoundFactory_starts_with: InputMaybe<Scalars['String']>;
  fundingRoundFactory_starts_with_nocase: InputMaybe<Scalars['String']>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  lastUpdatedAt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_lt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_lte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  maxRecipients: InputMaybe<Scalars['BigInt']>;
  maxRecipients_gt: InputMaybe<Scalars['BigInt']>;
  maxRecipients_gte: InputMaybe<Scalars['BigInt']>;
  maxRecipients_in: InputMaybe<Array<Scalars['BigInt']>>;
  maxRecipients_lt: InputMaybe<Scalars['BigInt']>;
  maxRecipients_lte: InputMaybe<Scalars['BigInt']>;
  maxRecipients_not: InputMaybe<Scalars['BigInt']>;
  maxRecipients_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  or: InputMaybe<Array<InputMaybe<RecipientRegistry_Filter>>>;
  owner: InputMaybe<Scalars['Bytes']>;
  owner_contains: InputMaybe<Scalars['Bytes']>;
  owner_gt: InputMaybe<Scalars['Bytes']>;
  owner_gte: InputMaybe<Scalars['Bytes']>;
  owner_in: InputMaybe<Array<Scalars['Bytes']>>;
  owner_lt: InputMaybe<Scalars['Bytes']>;
  owner_lte: InputMaybe<Scalars['Bytes']>;
  owner_not: InputMaybe<Scalars['Bytes']>;
  owner_not_contains: InputMaybe<Scalars['Bytes']>;
  owner_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  recipients_: InputMaybe<Recipient_Filter>;
};

export enum RecipientRegistry_OrderBy {
  BaseDeposit = 'baseDeposit',
  ChallengePeriodDuration = 'challengePeriodDuration',
  Controller = 'controller',
  CreatedAt = 'createdAt',
  FundingRoundFactory = 'fundingRoundFactory',
  FundingRoundFactoryBatchUstVerifier = 'fundingRoundFactory__batchUstVerifier',
  FundingRoundFactoryContributorRegistryAddress = 'fundingRoundFactory__contributorRegistryAddress',
  FundingRoundFactoryCoordinator = 'fundingRoundFactory__coordinator',
  FundingRoundFactoryCoordinatorPubKey = 'fundingRoundFactory__coordinatorPubKey',
  FundingRoundFactoryCreatedAt = 'fundingRoundFactory__createdAt',
  FundingRoundFactoryId = 'fundingRoundFactory__id',
  FundingRoundFactoryLastUpdatedAt = 'fundingRoundFactory__lastUpdatedAt',
  FundingRoundFactoryMaciFactory = 'fundingRoundFactory__maciFactory',
  FundingRoundFactoryMaxMessages = 'fundingRoundFactory__maxMessages',
  FundingRoundFactoryMaxUsers = 'fundingRoundFactory__maxUsers',
  FundingRoundFactoryMaxVoteOptions = 'fundingRoundFactory__maxVoteOptions',
  FundingRoundFactoryMessageBatchSize = 'fundingRoundFactory__messageBatchSize',
  FundingRoundFactoryMessageTreeDepth = 'fundingRoundFactory__messageTreeDepth',
  FundingRoundFactoryNativeToken = 'fundingRoundFactory__nativeToken',
  FundingRoundFactoryOwner = 'fundingRoundFactory__owner',
  FundingRoundFactoryQvtVerifier = 'fundingRoundFactory__qvtVerifier',
  FundingRoundFactoryRecipientRegistryAddress = 'fundingRoundFactory__recipientRegistryAddress',
  FundingRoundFactorySignUpDuration = 'fundingRoundFactory__signUpDuration',
  FundingRoundFactoryStateTreeDepth = 'fundingRoundFactory__stateTreeDepth',
  FundingRoundFactoryTallyBatchSize = 'fundingRoundFactory__tallyBatchSize',
  FundingRoundFactoryVoteOptionTreeDepth = 'fundingRoundFactory__voteOptionTreeDepth',
  FundingRoundFactoryVotingDuration = 'fundingRoundFactory__votingDuration',
  Id = 'id',
  LastUpdatedAt = 'lastUpdatedAt',
  MaxRecipients = 'maxRecipients',
  Owner = 'owner',
  Recipients = 'recipients'
}

export type Recipient_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  and: InputMaybe<Array<InputMaybe<Recipient_Filter>>>;
  createdAt: InputMaybe<Scalars['String']>;
  createdAt_contains: InputMaybe<Scalars['String']>;
  createdAt_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_ends_with: InputMaybe<Scalars['String']>;
  createdAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_gt: InputMaybe<Scalars['String']>;
  createdAt_gte: InputMaybe<Scalars['String']>;
  createdAt_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_lt: InputMaybe<Scalars['String']>;
  createdAt_lte: InputMaybe<Scalars['String']>;
  createdAt_not: InputMaybe<Scalars['String']>;
  createdAt_not_contains: InputMaybe<Scalars['String']>;
  createdAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_not_starts_with: InputMaybe<Scalars['String']>;
  createdAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_starts_with: InputMaybe<Scalars['String']>;
  createdAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  deposit: InputMaybe<Scalars['BigInt']>;
  deposit_gt: InputMaybe<Scalars['BigInt']>;
  deposit_gte: InputMaybe<Scalars['BigInt']>;
  deposit_in: InputMaybe<Array<Scalars['BigInt']>>;
  deposit_lt: InputMaybe<Scalars['BigInt']>;
  deposit_lte: InputMaybe<Scalars['BigInt']>;
  deposit_not: InputMaybe<Scalars['BigInt']>;
  deposit_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  fundingRounds: InputMaybe<Array<Scalars['String']>>;
  fundingRounds_: InputMaybe<FundingRound_Filter>;
  fundingRounds_contains: InputMaybe<Array<Scalars['String']>>;
  fundingRounds_contains_nocase: InputMaybe<Array<Scalars['String']>>;
  fundingRounds_not: InputMaybe<Array<Scalars['String']>>;
  fundingRounds_not_contains: InputMaybe<Array<Scalars['String']>>;
  fundingRounds_not_contains_nocase: InputMaybe<Array<Scalars['String']>>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  lastUpdatedAt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_lt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_lte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  or: InputMaybe<Array<InputMaybe<Recipient_Filter>>>;
  recipientAddress: InputMaybe<Scalars['Bytes']>;
  recipientAddress_contains: InputMaybe<Scalars['Bytes']>;
  recipientAddress_gt: InputMaybe<Scalars['Bytes']>;
  recipientAddress_gte: InputMaybe<Scalars['Bytes']>;
  recipientAddress_in: InputMaybe<Array<Scalars['Bytes']>>;
  recipientAddress_lt: InputMaybe<Scalars['Bytes']>;
  recipientAddress_lte: InputMaybe<Scalars['Bytes']>;
  recipientAddress_not: InputMaybe<Scalars['Bytes']>;
  recipientAddress_not_contains: InputMaybe<Scalars['Bytes']>;
  recipientAddress_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  recipientIndex: InputMaybe<Scalars['BigInt']>;
  recipientIndex_gt: InputMaybe<Scalars['BigInt']>;
  recipientIndex_gte: InputMaybe<Scalars['BigInt']>;
  recipientIndex_in: InputMaybe<Array<Scalars['BigInt']>>;
  recipientIndex_lt: InputMaybe<Scalars['BigInt']>;
  recipientIndex_lte: InputMaybe<Scalars['BigInt']>;
  recipientIndex_not: InputMaybe<Scalars['BigInt']>;
  recipientIndex_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  recipientMetadata: InputMaybe<Scalars['String']>;
  recipientMetadata_contains: InputMaybe<Scalars['String']>;
  recipientMetadata_contains_nocase: InputMaybe<Scalars['String']>;
  recipientMetadata_ends_with: InputMaybe<Scalars['String']>;
  recipientMetadata_ends_with_nocase: InputMaybe<Scalars['String']>;
  recipientMetadata_gt: InputMaybe<Scalars['String']>;
  recipientMetadata_gte: InputMaybe<Scalars['String']>;
  recipientMetadata_in: InputMaybe<Array<Scalars['String']>>;
  recipientMetadata_lt: InputMaybe<Scalars['String']>;
  recipientMetadata_lte: InputMaybe<Scalars['String']>;
  recipientMetadata_not: InputMaybe<Scalars['String']>;
  recipientMetadata_not_contains: InputMaybe<Scalars['String']>;
  recipientMetadata_not_contains_nocase: InputMaybe<Scalars['String']>;
  recipientMetadata_not_ends_with: InputMaybe<Scalars['String']>;
  recipientMetadata_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  recipientMetadata_not_in: InputMaybe<Array<Scalars['String']>>;
  recipientMetadata_not_starts_with: InputMaybe<Scalars['String']>;
  recipientMetadata_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  recipientMetadata_starts_with: InputMaybe<Scalars['String']>;
  recipientMetadata_starts_with_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry: InputMaybe<Scalars['String']>;
  recipientRegistry_: InputMaybe<RecipientRegistry_Filter>;
  recipientRegistry_contains: InputMaybe<Scalars['String']>;
  recipientRegistry_contains_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_ends_with: InputMaybe<Scalars['String']>;
  recipientRegistry_ends_with_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_gt: InputMaybe<Scalars['String']>;
  recipientRegistry_gte: InputMaybe<Scalars['String']>;
  recipientRegistry_in: InputMaybe<Array<Scalars['String']>>;
  recipientRegistry_lt: InputMaybe<Scalars['String']>;
  recipientRegistry_lte: InputMaybe<Scalars['String']>;
  recipientRegistry_not: InputMaybe<Scalars['String']>;
  recipientRegistry_not_contains: InputMaybe<Scalars['String']>;
  recipientRegistry_not_contains_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_not_ends_with: InputMaybe<Scalars['String']>;
  recipientRegistry_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_not_in: InputMaybe<Array<Scalars['String']>>;
  recipientRegistry_not_starts_with: InputMaybe<Scalars['String']>;
  recipientRegistry_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  recipientRegistry_starts_with: InputMaybe<Scalars['String']>;
  recipientRegistry_starts_with_nocase: InputMaybe<Scalars['String']>;
  rejected: InputMaybe<Scalars['Boolean']>;
  rejected_in: InputMaybe<Array<Scalars['Boolean']>>;
  rejected_not: InputMaybe<Scalars['Boolean']>;
  rejected_not_in: InputMaybe<Array<Scalars['Boolean']>>;
  requestResolvedHash: InputMaybe<Scalars['Bytes']>;
  requestResolvedHash_contains: InputMaybe<Scalars['Bytes']>;
  requestResolvedHash_gt: InputMaybe<Scalars['Bytes']>;
  requestResolvedHash_gte: InputMaybe<Scalars['Bytes']>;
  requestResolvedHash_in: InputMaybe<Array<Scalars['Bytes']>>;
  requestResolvedHash_lt: InputMaybe<Scalars['Bytes']>;
  requestResolvedHash_lte: InputMaybe<Scalars['Bytes']>;
  requestResolvedHash_not: InputMaybe<Scalars['Bytes']>;
  requestResolvedHash_not_contains: InputMaybe<Scalars['Bytes']>;
  requestResolvedHash_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  requestSubmittedHash: InputMaybe<Scalars['Bytes']>;
  requestSubmittedHash_contains: InputMaybe<Scalars['Bytes']>;
  requestSubmittedHash_gt: InputMaybe<Scalars['Bytes']>;
  requestSubmittedHash_gte: InputMaybe<Scalars['Bytes']>;
  requestSubmittedHash_in: InputMaybe<Array<Scalars['Bytes']>>;
  requestSubmittedHash_lt: InputMaybe<Scalars['Bytes']>;
  requestSubmittedHash_lte: InputMaybe<Scalars['Bytes']>;
  requestSubmittedHash_not: InputMaybe<Scalars['Bytes']>;
  requestSubmittedHash_not_contains: InputMaybe<Scalars['Bytes']>;
  requestSubmittedHash_not_in: InputMaybe<Array<Scalars['Bytes']>>;
  requestType: InputMaybe<Scalars['String']>;
  requestType_contains: InputMaybe<Scalars['String']>;
  requestType_contains_nocase: InputMaybe<Scalars['String']>;
  requestType_ends_with: InputMaybe<Scalars['String']>;
  requestType_ends_with_nocase: InputMaybe<Scalars['String']>;
  requestType_gt: InputMaybe<Scalars['String']>;
  requestType_gte: InputMaybe<Scalars['String']>;
  requestType_in: InputMaybe<Array<Scalars['String']>>;
  requestType_lt: InputMaybe<Scalars['String']>;
  requestType_lte: InputMaybe<Scalars['String']>;
  requestType_not: InputMaybe<Scalars['String']>;
  requestType_not_contains: InputMaybe<Scalars['String']>;
  requestType_not_contains_nocase: InputMaybe<Scalars['String']>;
  requestType_not_ends_with: InputMaybe<Scalars['String']>;
  requestType_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  requestType_not_in: InputMaybe<Array<Scalars['String']>>;
  requestType_not_starts_with: InputMaybe<Scalars['String']>;
  requestType_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  requestType_starts_with: InputMaybe<Scalars['String']>;
  requestType_starts_with_nocase: InputMaybe<Scalars['String']>;
  requester: InputMaybe<Scalars['String']>;
  requester_contains: InputMaybe<Scalars['String']>;
  requester_contains_nocase: InputMaybe<Scalars['String']>;
  requester_ends_with: InputMaybe<Scalars['String']>;
  requester_ends_with_nocase: InputMaybe<Scalars['String']>;
  requester_gt: InputMaybe<Scalars['String']>;
  requester_gte: InputMaybe<Scalars['String']>;
  requester_in: InputMaybe<Array<Scalars['String']>>;
  requester_lt: InputMaybe<Scalars['String']>;
  requester_lte: InputMaybe<Scalars['String']>;
  requester_not: InputMaybe<Scalars['String']>;
  requester_not_contains: InputMaybe<Scalars['String']>;
  requester_not_contains_nocase: InputMaybe<Scalars['String']>;
  requester_not_ends_with: InputMaybe<Scalars['String']>;
  requester_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  requester_not_in: InputMaybe<Array<Scalars['String']>>;
  requester_not_starts_with: InputMaybe<Scalars['String']>;
  requester_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  requester_starts_with: InputMaybe<Scalars['String']>;
  requester_starts_with_nocase: InputMaybe<Scalars['String']>;
  submissionTime: InputMaybe<Scalars['String']>;
  submissionTime_contains: InputMaybe<Scalars['String']>;
  submissionTime_contains_nocase: InputMaybe<Scalars['String']>;
  submissionTime_ends_with: InputMaybe<Scalars['String']>;
  submissionTime_ends_with_nocase: InputMaybe<Scalars['String']>;
  submissionTime_gt: InputMaybe<Scalars['String']>;
  submissionTime_gte: InputMaybe<Scalars['String']>;
  submissionTime_in: InputMaybe<Array<Scalars['String']>>;
  submissionTime_lt: InputMaybe<Scalars['String']>;
  submissionTime_lte: InputMaybe<Scalars['String']>;
  submissionTime_not: InputMaybe<Scalars['String']>;
  submissionTime_not_contains: InputMaybe<Scalars['String']>;
  submissionTime_not_contains_nocase: InputMaybe<Scalars['String']>;
  submissionTime_not_ends_with: InputMaybe<Scalars['String']>;
  submissionTime_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  submissionTime_not_in: InputMaybe<Array<Scalars['String']>>;
  submissionTime_not_starts_with: InputMaybe<Scalars['String']>;
  submissionTime_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  submissionTime_starts_with: InputMaybe<Scalars['String']>;
  submissionTime_starts_with_nocase: InputMaybe<Scalars['String']>;
  verified: InputMaybe<Scalars['Boolean']>;
  verified_in: InputMaybe<Array<Scalars['Boolean']>>;
  verified_not: InputMaybe<Scalars['Boolean']>;
  verified_not_in: InputMaybe<Array<Scalars['Boolean']>>;
  voteOptionIndex: InputMaybe<Scalars['BigInt']>;
  voteOptionIndex_gt: InputMaybe<Scalars['BigInt']>;
  voteOptionIndex_gte: InputMaybe<Scalars['BigInt']>;
  voteOptionIndex_in: InputMaybe<Array<Scalars['BigInt']>>;
  voteOptionIndex_lt: InputMaybe<Scalars['BigInt']>;
  voteOptionIndex_lte: InputMaybe<Scalars['BigInt']>;
  voteOptionIndex_not: InputMaybe<Scalars['BigInt']>;
  voteOptionIndex_not_in: InputMaybe<Array<Scalars['BigInt']>>;
};

export enum Recipient_OrderBy {
  CreatedAt = 'createdAt',
  Deposit = 'deposit',
  FundingRounds = 'fundingRounds',
  Id = 'id',
  LastUpdatedAt = 'lastUpdatedAt',
  RecipientAddress = 'recipientAddress',
  RecipientIndex = 'recipientIndex',
  RecipientMetadata = 'recipientMetadata',
  RecipientRegistry = 'recipientRegistry',
  RecipientRegistryBaseDeposit = 'recipientRegistry__baseDeposit',
  RecipientRegistryChallengePeriodDuration = 'recipientRegistry__challengePeriodDuration',
  RecipientRegistryController = 'recipientRegistry__controller',
  RecipientRegistryCreatedAt = 'recipientRegistry__createdAt',
  RecipientRegistryId = 'recipientRegistry__id',
  RecipientRegistryLastUpdatedAt = 'recipientRegistry__lastUpdatedAt',
  RecipientRegistryMaxRecipients = 'recipientRegistry__maxRecipients',
  RecipientRegistryOwner = 'recipientRegistry__owner',
  Rejected = 'rejected',
  RequestResolvedHash = 'requestResolvedHash',
  RequestSubmittedHash = 'requestSubmittedHash',
  RequestType = 'requestType',
  Requester = 'requester',
  SubmissionTime = 'submissionTime',
  Verified = 'verified',
  VoteOptionIndex = 'voteOptionIndex'
}

export type Subscription = {
  __typename?: 'Subscription';
  /** Access to subgraph metadata */
  _meta: Maybe<_Meta_>;
  contribution: Maybe<Contribution>;
  contributions: Array<Contribution>;
  contributor: Maybe<Contributor>;
  contributorRegistries: Array<ContributorRegistry>;
  contributorRegistry: Maybe<ContributorRegistry>;
  contributors: Array<Contributor>;
  coordinator: Maybe<Coordinator>;
  coordinators: Array<Coordinator>;
  donation: Maybe<Donation>;
  donations: Array<Donation>;
  fundingRound: Maybe<FundingRound>;
  fundingRoundFactories: Array<FundingRoundFactory>;
  fundingRoundFactory: Maybe<FundingRoundFactory>;
  fundingRounds: Array<FundingRound>;
  message: Maybe<Message>;
  messages: Array<Message>;
  publicKey: Maybe<PublicKey>;
  publicKeys: Array<PublicKey>;
  recipient: Maybe<Recipient>;
  recipientRegistries: Array<RecipientRegistry>;
  recipientRegistry: Maybe<RecipientRegistry>;
  recipients: Array<Recipient>;
  token: Maybe<Token>;
  tokens: Array<Token>;
  vote: Maybe<Vote>;
  votes: Array<Vote>;
};


export type Subscription_MetaArgs = {
  block: InputMaybe<Block_Height>;
};


export type SubscriptionContributionArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionContributionsArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Contribution_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Contribution_Filter>;
};


export type SubscriptionContributorArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionContributorRegistriesArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<ContributorRegistry_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<ContributorRegistry_Filter>;
};


export type SubscriptionContributorRegistryArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionContributorsArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Contributor_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Contributor_Filter>;
};


export type SubscriptionCoordinatorArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionCoordinatorsArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Coordinator_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Coordinator_Filter>;
};


export type SubscriptionDonationArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionDonationsArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Donation_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Donation_Filter>;
};


export type SubscriptionFundingRoundArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionFundingRoundFactoriesArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<FundingRoundFactory_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<FundingRoundFactory_Filter>;
};


export type SubscriptionFundingRoundFactoryArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionFundingRoundsArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<FundingRound_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<FundingRound_Filter>;
};


export type SubscriptionMessageArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionMessagesArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Message_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Message_Filter>;
};


export type SubscriptionPublicKeyArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionPublicKeysArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<PublicKey_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<PublicKey_Filter>;
};


export type SubscriptionRecipientArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionRecipientRegistriesArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<RecipientRegistry_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<RecipientRegistry_Filter>;
};


export type SubscriptionRecipientRegistryArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionRecipientsArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Recipient_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Recipient_Filter>;
};


export type SubscriptionTokenArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionTokensArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Token_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Token_Filter>;
};


export type SubscriptionVoteArgs = {
  block: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionVotesArgs = {
  block: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy: InputMaybe<Vote_OrderBy>;
  orderDirection: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where: InputMaybe<Vote_Filter>;
};

export type Token = {
  __typename?: 'Token';
  createdAt: Maybe<Scalars['String']>;
  decimals: Maybe<Scalars['BigInt']>;
  id: Scalars['ID'];
  lastUpdatedAt: Maybe<Scalars['String']>;
  symbol: Maybe<Scalars['String']>;
  tokenAddress: Maybe<Scalars['Bytes']>;
};

export type Token_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  and: InputMaybe<Array<InputMaybe<Token_Filter>>>;
  createdAt: InputMaybe<Scalars['String']>;
  createdAt_contains: InputMaybe<Scalars['String']>;
  createdAt_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_ends_with: InputMaybe<Scalars['String']>;
  createdAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_gt: InputMaybe<Scalars['String']>;
  createdAt_gte: InputMaybe<Scalars['String']>;
  createdAt_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_lt: InputMaybe<Scalars['String']>;
  createdAt_lte: InputMaybe<Scalars['String']>;
  createdAt_not: InputMaybe<Scalars['String']>;
  createdAt_not_contains: InputMaybe<Scalars['String']>;
  createdAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with: InputMaybe<Scalars['String']>;
  createdAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_not_in: InputMaybe<Array<Scalars['String']>>;
  createdAt_not_starts_with: InputMaybe<Scalars['String']>;
  createdAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  createdAt_starts_with: InputMaybe<Scalars['String']>;
  createdAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  decimals: InputMaybe<Scalars['BigInt']>;
  decimals_gt: InputMaybe<Scalars['BigInt']>;
  decimals_gte: InputMaybe<Scalars['BigInt']>;
  decimals_in: InputMaybe<Array<Scalars['BigInt']>>;
  decimals_lt: InputMaybe<Scalars['BigInt']>;
  decimals_lte: InputMaybe<Scalars['BigInt']>;
  decimals_not: InputMaybe<Scalars['BigInt']>;
  decimals_not_in: InputMaybe<Array<Scalars['BigInt']>>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  lastUpdatedAt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_gte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_lt: InputMaybe<Scalars['String']>;
  lastUpdatedAt_lte: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_contains_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_in: InputMaybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with: InputMaybe<Scalars['String']>;
  lastUpdatedAt_starts_with_nocase: InputMaybe<Scalars['String']>;
  or: InputMaybe<Array<InputMaybe<Token_Filter>>>;
  symbol: InputMaybe<Scalars['String']>;
  symbol_contains: InputMaybe<Scalars['String']>;
  symbol_contains_nocase: InputMaybe<Scalars['String']>;
  symbol_ends_with: InputMaybe<Scalars['String']>;
  symbol_ends_with_nocase: InputMaybe<Scalars['String']>;
  symbol_gt: InputMaybe<Scalars['String']>;
  symbol_gte: InputMaybe<Scalars['String']>;
  symbol_in: InputMaybe<Array<Scalars['String']>>;
  symbol_lt: InputMaybe<Scalars['String']>;
  symbol_lte: InputMaybe<Scalars['String']>;
  symbol_not: InputMaybe<Scalars['String']>;
  symbol_not_contains: InputMaybe<Scalars['String']>;
  symbol_not_contains_nocase: InputMaybe<Scalars['String']>;
  symbol_not_ends_with: InputMaybe<Scalars['String']>;
  symbol_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  symbol_not_in: InputMaybe<Array<Scalars['String']>>;
  symbol_not_starts_with: InputMaybe<Scalars['String']>;
  symbol_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  symbol_starts_with: InputMaybe<Scalars['String']>;
  symbol_starts_with_nocase: InputMaybe<Scalars['String']>;
  tokenAddress: InputMaybe<Scalars['Bytes']>;
  tokenAddress_contains: InputMaybe<Scalars['Bytes']>;
  tokenAddress_gt: InputMaybe<Scalars['Bytes']>;
  tokenAddress_gte: InputMaybe<Scalars['Bytes']>;
  tokenAddress_in: InputMaybe<Array<Scalars['Bytes']>>;
  tokenAddress_lt: InputMaybe<Scalars['Bytes']>;
  tokenAddress_lte: InputMaybe<Scalars['Bytes']>;
  tokenAddress_not: InputMaybe<Scalars['Bytes']>;
  tokenAddress_not_contains: InputMaybe<Scalars['Bytes']>;
  tokenAddress_not_in: InputMaybe<Array<Scalars['Bytes']>>;
};

export enum Token_OrderBy {
  CreatedAt = 'createdAt',
  Decimals = 'decimals',
  Id = 'id',
  LastUpdatedAt = 'lastUpdatedAt',
  Symbol = 'symbol',
  TokenAddress = 'tokenAddress'
}

export type Vote = {
  __typename?: 'Vote';
  contributor: Maybe<Contributor>;
  fundingRound: Maybe<FundingRound>;
  id: Scalars['ID'];
  secret: Maybe<Scalars['Boolean']>;
  voterAddress: Maybe<Scalars['Bytes']>;
};

export type Vote_Filter = {
  /** Filter for the block changed event. */
  _change_block: InputMaybe<BlockChangedFilter>;
  and: InputMaybe<Array<InputMaybe<Vote_Filter>>>;
  contributor: InputMaybe<Scalars['String']>;
  contributor_: InputMaybe<Contributor_Filter>;
  contributor_contains: InputMaybe<Scalars['String']>;
  contributor_contains_nocase: InputMaybe<Scalars['String']>;
  contributor_ends_with: InputMaybe<Scalars['String']>;
  contributor_ends_with_nocase: InputMaybe<Scalars['String']>;
  contributor_gt: InputMaybe<Scalars['String']>;
  contributor_gte: InputMaybe<Scalars['String']>;
  contributor_in: InputMaybe<Array<Scalars['String']>>;
  contributor_lt: InputMaybe<Scalars['String']>;
  contributor_lte: InputMaybe<Scalars['String']>;
  contributor_not: InputMaybe<Scalars['String']>;
  contributor_not_contains: InputMaybe<Scalars['String']>;
  contributor_not_contains_nocase: InputMaybe<Scalars['String']>;
  contributor_not_ends_with: InputMaybe<Scalars['String']>;
  contributor_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  contributor_not_in: InputMaybe<Array<Scalars['String']>>;
  contributor_not_starts_with: InputMaybe<Scalars['String']>;
  contributor_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  contributor_starts_with: InputMaybe<Scalars['String']>;
  contributor_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound: InputMaybe<Scalars['String']>;
  fundingRound_: InputMaybe<FundingRound_Filter>;
  fundingRound_contains: InputMaybe<Scalars['String']>;
  fundingRound_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRound_ends_with: InputMaybe<Scalars['String']>;
  fundingRound_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_gt: InputMaybe<Scalars['String']>;
  fundingRound_gte: InputMaybe<Scalars['String']>;
  fundingRound_in: InputMaybe<Array<Scalars['String']>>;
  fundingRound_lt: InputMaybe<Scalars['String']>;
  fundingRound_lte: InputMaybe<Scalars['String']>;
  fundingRound_not: InputMaybe<Scalars['String']>;
  fundingRound_not_contains: InputMaybe<Scalars['String']>;
  fundingRound_not_contains_nocase: InputMaybe<Scalars['String']>;
  fundingRound_not_ends_with: InputMaybe<Scalars['String']>;
  fundingRound_not_ends_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_not_in: InputMaybe<Array<Scalars['String']>>;
  fundingRound_not_starts_with: InputMaybe<Scalars['String']>;
  fundingRound_not_starts_with_nocase: InputMaybe<Scalars['String']>;
  fundingRound_starts_with: InputMaybe<Scalars['String']>;
  fundingRound_starts_with_nocase: InputMaybe<Scalars['String']>;
  id: InputMaybe<Scalars['ID']>;
  id_gt: InputMaybe<Scalars['ID']>;
  id_gte: InputMaybe<Scalars['ID']>;
  id_in: InputMaybe<Array<Scalars['ID']>>;
  id_lt: InputMaybe<Scalars['ID']>;
  id_lte: InputMaybe<Scalars['ID']>;
  id_not: InputMaybe<Scalars['ID']>;
  id_not_in: InputMaybe<Array<Scalars['ID']>>;
  or: InputMaybe<Array<InputMaybe<Vote_Filter>>>;
  secret: InputMaybe<Scalars['Boolean']>;
  secret_in: InputMaybe<Array<Scalars['Boolean']>>;
  secret_not: InputMaybe<Scalars['Boolean']>;
  secret_not_in: InputMaybe<Array<Scalars['Boolean']>>;
  voterAddress: InputMaybe<Scalars['Bytes']>;
  voterAddress_contains: InputMaybe<Scalars['Bytes']>;
  voterAddress_gt: InputMaybe<Scalars['Bytes']>;
  voterAddress_gte: InputMaybe<Scalars['Bytes']>;
  voterAddress_in: InputMaybe<Array<Scalars['Bytes']>>;
  voterAddress_lt: InputMaybe<Scalars['Bytes']>;
  voterAddress_lte: InputMaybe<Scalars['Bytes']>;
  voterAddress_not: InputMaybe<Scalars['Bytes']>;
  voterAddress_not_contains: InputMaybe<Scalars['Bytes']>;
  voterAddress_not_in: InputMaybe<Array<Scalars['Bytes']>>;
};

export enum Vote_OrderBy {
  Contributor = 'contributor',
  ContributorContributorAddress = 'contributor__contributorAddress',
  ContributorCreatedAt = 'contributor__createdAt',
  ContributorId = 'contributor__id',
  ContributorLastUpdatedAt = 'contributor__lastUpdatedAt',
  ContributorVerifiedTimeStamp = 'contributor__verifiedTimeStamp',
  FundingRound = 'fundingRound',
  FundingRoundContributorCount = 'fundingRound__contributorCount',
  FundingRoundContributorRegistryAddress = 'fundingRound__contributorRegistryAddress',
  FundingRoundCoordinator = 'fundingRound__coordinator',
  FundingRoundCreatedAt = 'fundingRound__createdAt',
  FundingRoundId = 'fundingRound__id',
  FundingRoundIsCancelled = 'fundingRound__isCancelled',
  FundingRoundIsFinalized = 'fundingRound__isFinalized',
  FundingRoundLastUpdatedAt = 'fundingRound__lastUpdatedAt',
  FundingRoundMaci = 'fundingRound__maci',
  FundingRoundMatchingPoolSize = 'fundingRound__matchingPoolSize',
  FundingRoundNativeToken = 'fundingRound__nativeToken',
  FundingRoundRecipientCount = 'fundingRound__recipientCount',
  FundingRoundRecipientRegistryAddress = 'fundingRound__recipientRegistryAddress',
  FundingRoundSignUpDeadline = 'fundingRound__signUpDeadline',
  FundingRoundStartTime = 'fundingRound__startTime',
  FundingRoundTallyHash = 'fundingRound__tallyHash',
  FundingRoundTotalSpent = 'fundingRound__totalSpent',
  FundingRoundTotalVotes = 'fundingRound__totalVotes',
  FundingRoundVoiceCreditFactor = 'fundingRound__voiceCreditFactor',
  FundingRoundVotingDeadline = 'fundingRound__votingDeadline',
  Id = 'id',
  Secret = 'secret',
  VoterAddress = 'voterAddress'
}

export type _Block_ = {
  __typename?: '_Block_';
  /** The hash of the block */
  hash: Maybe<Scalars['Bytes']>;
  /** The block number */
  number: Scalars['Int'];
  /** Integer representation of the timestamp stored in blocks for the chain */
  timestamp: Maybe<Scalars['Int']>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  __typename?: '_Meta_';
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars['String'];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean'];
};

export enum _SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  Allow = 'allow',
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  Deny = 'deny'
}

export type GetContributionsAmountQueryVariables = Exact<{
  fundingRoundAddress: Scalars['ID'];
  contributorAddress: Scalars['ID'];
}>;


export type GetContributionsAmountQuery = { __typename?: 'Query', contributions: Array<{ __typename?: 'Contribution', amount: any | null }> };

export type GetContributorIndexQueryVariables = Exact<{
  fundingRoundAddress: Scalars['ID'];
  publicKeyId: Scalars['ID'];
}>;


export type GetContributorIndexQuery = { __typename?: 'Query', publicKey: { __typename?: 'PublicKey', id: string, stateIndex: any | null } | null };

export type GetContributorMessagesQueryVariables = Exact<{
  fundingRoundAddress: Scalars['String'];
  pubKey: Scalars['String'];
  contributorAddress: Scalars['Bytes'];
}>;


export type GetContributorMessagesQuery = { __typename?: 'Query', messages: Array<{ __typename?: 'Message', id: string, data: Array<any> | null, iv: any, timestamp: string | null, blockNumber: any, transactionIndex: any }> };

export type GetContributorVotesQueryVariables = Exact<{
  fundingRoundAddress: Scalars['ID'];
  contributorAddress: Scalars['ID'];
}>;


export type GetContributorVotesQuery = { __typename?: 'Query', fundingRound: { __typename?: 'FundingRound', id: string, contributors: Array<{ __typename?: 'Contributor', votes: Array<{ __typename?: 'Vote', id: string }> | null }> | null } | null };

export type GetContributorVotesForAllRoundsQueryVariables = Exact<{
  contributorAddress: Scalars['ID'];
}>;


export type GetContributorVotesForAllRoundsQuery = { __typename?: 'Query', contributors: Array<{ __typename?: 'Contributor', votes: Array<{ __typename?: 'Vote', id: string }> | null }> };

export type GetCurrentRoundQueryVariables = Exact<{
  fundingRoundFactoryAddress: Scalars['ID'];
}>;


export type GetCurrentRoundQuery = { __typename?: 'Query', fundingRoundFactory: { __typename?: 'FundingRoundFactory', currentRound: { __typename?: 'FundingRound', id: string } | null } | null };

export type GetFactoryInfoQueryVariables = Exact<{
  factoryAddress: Scalars['ID'];
}>;


export type GetFactoryInfoQuery = { __typename?: 'Query', fundingRoundFactory: { __typename?: 'FundingRoundFactory', contributorRegistryAddress: any | null, nativeTokenInfo: { __typename?: 'Token', tokenAddress: any | null, symbol: string | null, decimals: any | null } | null } | null };

export type GetLatestBlockNumberQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLatestBlockNumberQuery = { __typename?: 'Query', _meta: { __typename?: '_Meta_', block: { __typename?: '_Block_', number: number } } | null };

export type GetProjectQueryVariables = Exact<{
  recipientId: Scalars['ID'];
}>;


export type GetProjectQuery = { __typename?: 'Query', recipients: Array<{ __typename?: 'Recipient', id: string, requestType: string | null, recipientAddress: any | null, recipientMetadata: string | null, recipientIndex: any | null, submissionTime: string | null, rejected: boolean | null, verified: boolean | null }> };

export type GetPublicKeyQueryVariables = Exact<{
  pubKey: Scalars['ID'];
}>;


export type GetPublicKeyQuery = { __typename?: 'Query', publicKey: { __typename?: 'PublicKey', id: string } | null };

export type GetRecipientQueryVariables = Exact<{
  registryAddress: Scalars['ID'];
  recipientId: Scalars['ID'];
}>;


export type GetRecipientQuery = { __typename?: 'Query', recipientRegistry: { __typename?: 'RecipientRegistry', recipients: Array<{ __typename?: 'Recipient', id: string, requestType: string | null, recipientAddress: any | null, recipientMetadata: string | null, submissionTime: string | null, rejected: boolean | null, verified: boolean | null }> | null } | null };

export type GetRecipientByIndexQueryVariables = Exact<{
  registryAddress: Scalars['String'];
  recipientIndex: Scalars['BigInt'];
}>;


export type GetRecipientByIndexQuery = { __typename?: 'Query', recipients: Array<{ __typename?: 'Recipient', id: string, recipientIndex: any | null, recipientAddress: any | null, recipientMetadata: string | null }> };

export type GetRecipientBySubmitHashQueryVariables = Exact<{
  transactionHash: Scalars['Bytes'];
}>;


export type GetRecipientBySubmitHashQuery = { __typename?: 'Query', recipients: Array<{ __typename?: 'Recipient', id: string, recipientMetadata: string | null, recipientAddress: any | null, requester: string | null, submissionTime: string | null }> };

export type GetRecipientDonationsQueryVariables = Exact<{
  fundingRoundAddress: Scalars['String'];
  recipientAddress: Scalars['Bytes'];
  recipientIndex: Scalars['BigInt'];
}>;


export type GetRecipientDonationsQuery = { __typename?: 'Query', donations: Array<{ __typename?: 'Donation', id: string }> };

export type GetRecipientRegistryInfoQueryVariables = Exact<{
  factoryAddress: Scalars['ID'];
}>;


export type GetRecipientRegistryInfoQuery = { __typename?: 'Query', fundingRoundFactory: { __typename?: 'FundingRoundFactory', recipientRegistry: { __typename?: 'RecipientRegistry', id: string, owner: any | null, baseDeposit: any | null, challengePeriodDuration: any | null } | null, currentRound: { __typename?: 'FundingRound', id: string, recipientRegistry: { __typename?: 'RecipientRegistry', id: string, owner: any | null, baseDeposit: any | null, challengePeriodDuration: any | null } | null } | null } | null };

export type GetRecipientsQueryVariables = Exact<{
  registryAddress: Scalars['String'];
}>;


export type GetRecipientsQuery = { __typename?: 'Query', recipients: Array<{ __typename?: 'Recipient', id: string, recipientIndex: any | null, requestType: string | null, requester: string | null, recipientAddress: any | null, recipientMetadata: string | null, requestSubmittedHash: any | null, requestResolvedHash: any | null, submissionTime: string | null, rejected: boolean | null, verified: boolean | null }> };

export type GetRoundInfoQueryVariables = Exact<{
  fundingRoundAddress: Scalars['ID'];
}>;


export type GetRoundInfoQuery = { __typename?: 'Query', fundingRound: { __typename?: 'FundingRound', id: string, maci: any | null, recipientRegistryAddress: any | null, contributorRegistryAddress: any | null, voiceCreditFactor: any | null, isFinalized: boolean | null, isCancelled: boolean | null, contributorCount: any, totalSpent: any | null, matchingPoolSize: any | null, nativeTokenInfo: { __typename?: 'Token', tokenAddress: any | null, symbol: string | null, decimals: any | null } | null } | null };

export type GetRoundsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRoundsQuery = { __typename?: 'Query', fundingRounds: Array<{ __typename?: 'FundingRound', id: string, isFinalized: boolean | null, isCancelled: boolean | null, startTime: any | null }> };

export type GetTokenInfoQueryVariables = Exact<{
  fundingRoundAddress: Scalars['ID'];
}>;


export type GetTokenInfoQuery = { __typename?: 'Query', fundingRound: { __typename?: 'FundingRound', nativeTokenInfo: { __typename?: 'Token', tokenAddress: any | null, symbol: string | null, decimals: any | null } | null } | null };


export const GetContributionsAmountDocument = gql`
    query GetContributionsAmount($fundingRoundAddress: ID!, $contributorAddress: ID!) {
  contributions(
    where: {contributor_: {id: $contributorAddress}, fundingRound_: {id: $fundingRoundAddress}}
  ) {
    amount
  }
}
    `;
export const GetContributorIndexDocument = gql`
    query GetContributorIndex($fundingRoundAddress: ID!, $publicKeyId: ID!) {
  publicKey(id: $publicKeyId) {
    id
    stateIndex
  }
}
    `;
export const GetContributorMessagesDocument = gql`
    query GetContributorMessages($fundingRoundAddress: String!, $pubKey: String!, $contributorAddress: Bytes!) {
  messages(
    where: {fundingRound: $fundingRoundAddress, publicKey: $pubKey, submittedBy: $contributorAddress}
    first: 1000
    orderBy: blockNumber
    orderDirection: desc
  ) {
    id
    data
    iv
    timestamp
    blockNumber
    transactionIndex
  }
}
    `;
export const GetContributorVotesDocument = gql`
    query GetContributorVotes($fundingRoundAddress: ID!, $contributorAddress: ID!) {
  fundingRound(id: $fundingRoundAddress) {
    id
    contributors(where: {id: $contributorAddress}) {
      votes {
        id
      }
    }
  }
}
    `;
export const GetContributorVotesForAllRoundsDocument = gql`
    query GetContributorVotesForAllRounds($contributorAddress: ID!) {
  contributors(where: {id: $contributorAddress}) {
    votes {
      id
    }
  }
}
    `;
export const GetCurrentRoundDocument = gql`
    query GetCurrentRound($fundingRoundFactoryAddress: ID!) {
  fundingRoundFactory(id: $fundingRoundFactoryAddress) {
    currentRound {
      id
    }
  }
}
    `;
export const GetFactoryInfoDocument = gql`
    query GetFactoryInfo($factoryAddress: ID!) {
  fundingRoundFactory(id: $factoryAddress) {
    nativeTokenInfo {
      tokenAddress
      symbol
      decimals
    }
    contributorRegistryAddress
  }
}
    `;
export const GetLatestBlockNumberDocument = gql`
    query GetLatestBlockNumber {
  _meta {
    block {
      number
    }
  }
}
    `;
export const GetProjectDocument = gql`
    query GetProject($recipientId: ID!) {
  recipients(where: {id: $recipientId}) {
    id
    requestType
    recipientAddress
    recipientMetadata
    recipientIndex
    submissionTime
    rejected
    verified
  }
}
    `;
export const GetPublicKeyDocument = gql`
    query GetPublicKey($pubKey: ID!) {
  publicKey(id: $pubKey) {
    id
  }
}
    `;
export const GetRecipientDocument = gql`
    query GetRecipient($registryAddress: ID!, $recipientId: ID!) {
  recipientRegistry(id: $registryAddress) {
    recipients(where: {id: $recipientId}) {
      id
      requestType
      recipientAddress
      recipientMetadata
      submissionTime
      rejected
      verified
    }
  }
}
    `;
export const GetRecipientByIndexDocument = gql`
    query GetRecipientByIndex($registryAddress: String!, $recipientIndex: BigInt!) {
  recipients(
    where: {recipientRegistry: $registryAddress, recipientIndex: $recipientIndex}
  ) {
    id
    recipientIndex
    recipientAddress
    recipientMetadata
  }
}
    `;
export const GetRecipientBySubmitHashDocument = gql`
    query GetRecipientBySubmitHash($transactionHash: Bytes!) {
  recipients(where: {requestSubmittedHash: $transactionHash}) {
    id
    recipientMetadata
    recipientAddress
    requester
    submissionTime
  }
}
    `;
export const GetRecipientDonationsDocument = gql`
    query GetRecipientDonations($fundingRoundAddress: String!, $recipientAddress: Bytes!, $recipientIndex: BigInt!) {
  donations(
    where: {fundingRound: $fundingRoundAddress, recipient: $recipientAddress, voteOptionIndex: $recipientIndex}
  ) {
    id
  }
}
    `;
export const GetRecipientRegistryInfoDocument = gql`
    query GetRecipientRegistryInfo($factoryAddress: ID!) {
  fundingRoundFactory(id: $factoryAddress) {
    recipientRegistry {
      id
      owner
      baseDeposit
      challengePeriodDuration
    }
    currentRound {
      id
      recipientRegistry {
        id
        owner
        baseDeposit
        challengePeriodDuration
      }
    }
  }
}
    `;
export const GetRecipientsDocument = gql`
    query GetRecipients($registryAddress: String!) {
  recipients(where: {recipientRegistry: $registryAddress}) {
    id
    recipientIndex
    requestType
    requester
    recipientAddress
    recipientMetadata
    requestSubmittedHash
    requestResolvedHash
    submissionTime
    rejected
    verified
  }
}
    `;
export const GetRoundInfoDocument = gql`
    query GetRoundInfo($fundingRoundAddress: ID!) {
  fundingRound(id: $fundingRoundAddress) {
    id
    maci
    nativeTokenInfo {
      tokenAddress
      symbol
      decimals
    }
    recipientRegistryAddress
    contributorRegistryAddress
    voiceCreditFactor
    isFinalized
    isCancelled
    contributorCount
    totalSpent
    matchingPoolSize
  }
}
    `;
export const GetRoundsDocument = gql`
    query GetRounds {
  fundingRounds(orderBy: startTime, orderDirection: asc) {
    id
    isFinalized
    isCancelled
    startTime
  }
}
    `;
export const GetTokenInfoDocument = gql`
    query GetTokenInfo($fundingRoundAddress: ID!) {
  fundingRound(id: $fundingRoundAddress) {
    nativeTokenInfo {
      tokenAddress
      symbol
      decimals
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    GetContributionsAmount(variables: GetContributionsAmountQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetContributionsAmountQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetContributionsAmountQuery>(GetContributionsAmountDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetContributionsAmount', 'query');
    },
    GetContributorIndex(variables: GetContributorIndexQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetContributorIndexQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetContributorIndexQuery>(GetContributorIndexDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetContributorIndex', 'query');
    },
    GetContributorMessages(variables: GetContributorMessagesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetContributorMessagesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetContributorMessagesQuery>(GetContributorMessagesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetContributorMessages', 'query');
    },
    GetContributorVotes(variables: GetContributorVotesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetContributorVotesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetContributorVotesQuery>(GetContributorVotesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetContributorVotes', 'query');
    },
    GetContributorVotesForAllRounds(variables: GetContributorVotesForAllRoundsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetContributorVotesForAllRoundsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetContributorVotesForAllRoundsQuery>(GetContributorVotesForAllRoundsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetContributorVotesForAllRounds', 'query');
    },
    GetCurrentRound(variables: GetCurrentRoundQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetCurrentRoundQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCurrentRoundQuery>(GetCurrentRoundDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetCurrentRound', 'query');
    },
    GetFactoryInfo(variables: GetFactoryInfoQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetFactoryInfoQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetFactoryInfoQuery>(GetFactoryInfoDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetFactoryInfo', 'query');
    },
    GetLatestBlockNumber(variables?: GetLatestBlockNumberQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetLatestBlockNumberQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetLatestBlockNumberQuery>(GetLatestBlockNumberDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetLatestBlockNumber', 'query');
    },
    GetProject(variables: GetProjectQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetProjectQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetProjectQuery>(GetProjectDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetProject', 'query');
    },
    GetPublicKey(variables: GetPublicKeyQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetPublicKeyQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPublicKeyQuery>(GetPublicKeyDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetPublicKey', 'query');
    },
    GetRecipient(variables: GetRecipientQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRecipientQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRecipientQuery>(GetRecipientDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRecipient', 'query');
    },
    GetRecipientByIndex(variables: GetRecipientByIndexQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRecipientByIndexQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRecipientByIndexQuery>(GetRecipientByIndexDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRecipientByIndex', 'query');
    },
    GetRecipientBySubmitHash(variables: GetRecipientBySubmitHashQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRecipientBySubmitHashQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRecipientBySubmitHashQuery>(GetRecipientBySubmitHashDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRecipientBySubmitHash', 'query');
    },
    GetRecipientDonations(variables: GetRecipientDonationsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRecipientDonationsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRecipientDonationsQuery>(GetRecipientDonationsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRecipientDonations', 'query');
    },
    GetRecipientRegistryInfo(variables: GetRecipientRegistryInfoQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRecipientRegistryInfoQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRecipientRegistryInfoQuery>(GetRecipientRegistryInfoDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRecipientRegistryInfo', 'query');
    },
    GetRecipients(variables: GetRecipientsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRecipientsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRecipientsQuery>(GetRecipientsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRecipients', 'query');
    },
    GetRoundInfo(variables: GetRoundInfoQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRoundInfoQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRoundInfoQuery>(GetRoundInfoDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRoundInfo', 'query');
    },
    GetRounds(variables?: GetRoundsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRoundsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRoundsQuery>(GetRoundsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRounds', 'query');
    },
    GetTokenInfo(variables: GetTokenInfoQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetTokenInfoQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetTokenInfoQuery>(GetTokenInfoDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetTokenInfo', 'query');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;