import { GraphQLClient } from 'graphql-request';
import * as Dom from 'graphql-request/dist/types.dom';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
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






export type Block_Height = {
  hash: Maybe<Scalars['Bytes']>;
  number: Maybe<Scalars['Int']>;
};


export type Contribution = {
  __typename?: 'Contribution';
  id: Scalars['ID'];
  contributor: Maybe<Contributor>;
  fundingRound: Maybe<FundingRound>;
  amount: Maybe<Scalars['BigInt']>;
  voiceCredits: Maybe<Scalars['BigInt']>;
  createdAt: Maybe<Scalars['String']>;
};

export type Contribution_Filter = {
  id: Maybe<Scalars['ID']>;
  id_not: Maybe<Scalars['ID']>;
  id_gt: Maybe<Scalars['ID']>;
  id_lt: Maybe<Scalars['ID']>;
  id_gte: Maybe<Scalars['ID']>;
  id_lte: Maybe<Scalars['ID']>;
  id_in: Maybe<Array<Scalars['ID']>>;
  id_not_in: Maybe<Array<Scalars['ID']>>;
  contributor: Maybe<Scalars['String']>;
  contributor_not: Maybe<Scalars['String']>;
  contributor_gt: Maybe<Scalars['String']>;
  contributor_lt: Maybe<Scalars['String']>;
  contributor_gte: Maybe<Scalars['String']>;
  contributor_lte: Maybe<Scalars['String']>;
  contributor_in: Maybe<Array<Scalars['String']>>;
  contributor_not_in: Maybe<Array<Scalars['String']>>;
  contributor_contains: Maybe<Scalars['String']>;
  contributor_not_contains: Maybe<Scalars['String']>;
  contributor_starts_with: Maybe<Scalars['String']>;
  contributor_not_starts_with: Maybe<Scalars['String']>;
  contributor_ends_with: Maybe<Scalars['String']>;
  contributor_not_ends_with: Maybe<Scalars['String']>;
  fundingRound: Maybe<Scalars['String']>;
  fundingRound_not: Maybe<Scalars['String']>;
  fundingRound_gt: Maybe<Scalars['String']>;
  fundingRound_lt: Maybe<Scalars['String']>;
  fundingRound_gte: Maybe<Scalars['String']>;
  fundingRound_lte: Maybe<Scalars['String']>;
  fundingRound_in: Maybe<Array<Scalars['String']>>;
  fundingRound_not_in: Maybe<Array<Scalars['String']>>;
  fundingRound_contains: Maybe<Scalars['String']>;
  fundingRound_not_contains: Maybe<Scalars['String']>;
  fundingRound_starts_with: Maybe<Scalars['String']>;
  fundingRound_not_starts_with: Maybe<Scalars['String']>;
  fundingRound_ends_with: Maybe<Scalars['String']>;
  fundingRound_not_ends_with: Maybe<Scalars['String']>;
  amount: Maybe<Scalars['BigInt']>;
  amount_not: Maybe<Scalars['BigInt']>;
  amount_gt: Maybe<Scalars['BigInt']>;
  amount_lt: Maybe<Scalars['BigInt']>;
  amount_gte: Maybe<Scalars['BigInt']>;
  amount_lte: Maybe<Scalars['BigInt']>;
  amount_in: Maybe<Array<Scalars['BigInt']>>;
  amount_not_in: Maybe<Array<Scalars['BigInt']>>;
  voiceCredits: Maybe<Scalars['BigInt']>;
  voiceCredits_not: Maybe<Scalars['BigInt']>;
  voiceCredits_gt: Maybe<Scalars['BigInt']>;
  voiceCredits_lt: Maybe<Scalars['BigInt']>;
  voiceCredits_gte: Maybe<Scalars['BigInt']>;
  voiceCredits_lte: Maybe<Scalars['BigInt']>;
  voiceCredits_in: Maybe<Array<Scalars['BigInt']>>;
  voiceCredits_not_in: Maybe<Array<Scalars['BigInt']>>;
  createdAt: Maybe<Scalars['String']>;
  createdAt_not: Maybe<Scalars['String']>;
  createdAt_gt: Maybe<Scalars['String']>;
  createdAt_lt: Maybe<Scalars['String']>;
  createdAt_gte: Maybe<Scalars['String']>;
  createdAt_lte: Maybe<Scalars['String']>;
  createdAt_in: Maybe<Array<Scalars['String']>>;
  createdAt_not_in: Maybe<Array<Scalars['String']>>;
  createdAt_contains: Maybe<Scalars['String']>;
  createdAt_not_contains: Maybe<Scalars['String']>;
  createdAt_starts_with: Maybe<Scalars['String']>;
  createdAt_not_starts_with: Maybe<Scalars['String']>;
  createdAt_ends_with: Maybe<Scalars['String']>;
  createdAt_not_ends_with: Maybe<Scalars['String']>;
};

export enum Contribution_OrderBy {
  Id = 'id',
  Contributor = 'contributor',
  FundingRound = 'fundingRound',
  Amount = 'amount',
  VoiceCredits = 'voiceCredits',
  CreatedAt = 'createdAt'
}

export type Contributor = {
  __typename?: 'Contributor';
  id: Scalars['ID'];
  contributorRegistry: ContributorRegistry;
  votes: Maybe<Array<Vote>>;
  verified: Maybe<Scalars['Boolean']>;
  verifiedTimeStamp: Maybe<Scalars['String']>;
  contributorAddress: Maybe<Scalars['Bytes']>;
  fundingRounds: Maybe<Array<FundingRound>>;
  contributions: Maybe<Array<Contribution>>;
  createdAt: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
};


export type ContributorVotesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Vote_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Vote_Filter>;
};


export type ContributorFundingRoundsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<FundingRound_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<FundingRound_Filter>;
};


export type ContributorContributionsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Contribution_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Contribution_Filter>;
};

export type ContributorRegistry = {
  __typename?: 'ContributorRegistry';
  id: Scalars['ID'];
  fundingRoundFactory: FundingRoundFactory;
  context: Maybe<Scalars['String']>;
  owner: Maybe<Scalars['Bytes']>;
  contributors: Maybe<Array<Contributor>>;
  createdAt: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
};


export type ContributorRegistryContributorsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Contributor_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Contributor_Filter>;
};

export type ContributorRegistry_Filter = {
  id: Maybe<Scalars['ID']>;
  id_not: Maybe<Scalars['ID']>;
  id_gt: Maybe<Scalars['ID']>;
  id_lt: Maybe<Scalars['ID']>;
  id_gte: Maybe<Scalars['ID']>;
  id_lte: Maybe<Scalars['ID']>;
  id_in: Maybe<Array<Scalars['ID']>>;
  id_not_in: Maybe<Array<Scalars['ID']>>;
  fundingRoundFactory: Maybe<Scalars['String']>;
  fundingRoundFactory_not: Maybe<Scalars['String']>;
  fundingRoundFactory_gt: Maybe<Scalars['String']>;
  fundingRoundFactory_lt: Maybe<Scalars['String']>;
  fundingRoundFactory_gte: Maybe<Scalars['String']>;
  fundingRoundFactory_lte: Maybe<Scalars['String']>;
  fundingRoundFactory_in: Maybe<Array<Scalars['String']>>;
  fundingRoundFactory_not_in: Maybe<Array<Scalars['String']>>;
  fundingRoundFactory_contains: Maybe<Scalars['String']>;
  fundingRoundFactory_not_contains: Maybe<Scalars['String']>;
  fundingRoundFactory_starts_with: Maybe<Scalars['String']>;
  fundingRoundFactory_not_starts_with: Maybe<Scalars['String']>;
  fundingRoundFactory_ends_with: Maybe<Scalars['String']>;
  fundingRoundFactory_not_ends_with: Maybe<Scalars['String']>;
  context: Maybe<Scalars['String']>;
  context_not: Maybe<Scalars['String']>;
  context_gt: Maybe<Scalars['String']>;
  context_lt: Maybe<Scalars['String']>;
  context_gte: Maybe<Scalars['String']>;
  context_lte: Maybe<Scalars['String']>;
  context_in: Maybe<Array<Scalars['String']>>;
  context_not_in: Maybe<Array<Scalars['String']>>;
  context_contains: Maybe<Scalars['String']>;
  context_not_contains: Maybe<Scalars['String']>;
  context_starts_with: Maybe<Scalars['String']>;
  context_not_starts_with: Maybe<Scalars['String']>;
  context_ends_with: Maybe<Scalars['String']>;
  context_not_ends_with: Maybe<Scalars['String']>;
  owner: Maybe<Scalars['Bytes']>;
  owner_not: Maybe<Scalars['Bytes']>;
  owner_in: Maybe<Array<Scalars['Bytes']>>;
  owner_not_in: Maybe<Array<Scalars['Bytes']>>;
  owner_contains: Maybe<Scalars['Bytes']>;
  owner_not_contains: Maybe<Scalars['Bytes']>;
  createdAt: Maybe<Scalars['String']>;
  createdAt_not: Maybe<Scalars['String']>;
  createdAt_gt: Maybe<Scalars['String']>;
  createdAt_lt: Maybe<Scalars['String']>;
  createdAt_gte: Maybe<Scalars['String']>;
  createdAt_lte: Maybe<Scalars['String']>;
  createdAt_in: Maybe<Array<Scalars['String']>>;
  createdAt_not_in: Maybe<Array<Scalars['String']>>;
  createdAt_contains: Maybe<Scalars['String']>;
  createdAt_not_contains: Maybe<Scalars['String']>;
  createdAt_starts_with: Maybe<Scalars['String']>;
  createdAt_not_starts_with: Maybe<Scalars['String']>;
  createdAt_ends_with: Maybe<Scalars['String']>;
  createdAt_not_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
  lastUpdatedAt_not: Maybe<Scalars['String']>;
  lastUpdatedAt_gt: Maybe<Scalars['String']>;
  lastUpdatedAt_lt: Maybe<Scalars['String']>;
  lastUpdatedAt_gte: Maybe<Scalars['String']>;
  lastUpdatedAt_lte: Maybe<Scalars['String']>;
  lastUpdatedAt_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_not_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: Maybe<Scalars['String']>;
};

export enum ContributorRegistry_OrderBy {
  Id = 'id',
  FundingRoundFactory = 'fundingRoundFactory',
  Context = 'context',
  Owner = 'owner',
  Contributors = 'contributors',
  CreatedAt = 'createdAt',
  LastUpdatedAt = 'lastUpdatedAt'
}

export type Contributor_Filter = {
  id: Maybe<Scalars['ID']>;
  id_not: Maybe<Scalars['ID']>;
  id_gt: Maybe<Scalars['ID']>;
  id_lt: Maybe<Scalars['ID']>;
  id_gte: Maybe<Scalars['ID']>;
  id_lte: Maybe<Scalars['ID']>;
  id_in: Maybe<Array<Scalars['ID']>>;
  id_not_in: Maybe<Array<Scalars['ID']>>;
  contributorRegistry: Maybe<Scalars['String']>;
  contributorRegistry_not: Maybe<Scalars['String']>;
  contributorRegistry_gt: Maybe<Scalars['String']>;
  contributorRegistry_lt: Maybe<Scalars['String']>;
  contributorRegistry_gte: Maybe<Scalars['String']>;
  contributorRegistry_lte: Maybe<Scalars['String']>;
  contributorRegistry_in: Maybe<Array<Scalars['String']>>;
  contributorRegistry_not_in: Maybe<Array<Scalars['String']>>;
  contributorRegistry_contains: Maybe<Scalars['String']>;
  contributorRegistry_not_contains: Maybe<Scalars['String']>;
  contributorRegistry_starts_with: Maybe<Scalars['String']>;
  contributorRegistry_not_starts_with: Maybe<Scalars['String']>;
  contributorRegistry_ends_with: Maybe<Scalars['String']>;
  contributorRegistry_not_ends_with: Maybe<Scalars['String']>;
  verified: Maybe<Scalars['Boolean']>;
  verified_not: Maybe<Scalars['Boolean']>;
  verified_in: Maybe<Array<Scalars['Boolean']>>;
  verified_not_in: Maybe<Array<Scalars['Boolean']>>;
  verifiedTimeStamp: Maybe<Scalars['String']>;
  verifiedTimeStamp_not: Maybe<Scalars['String']>;
  verifiedTimeStamp_gt: Maybe<Scalars['String']>;
  verifiedTimeStamp_lt: Maybe<Scalars['String']>;
  verifiedTimeStamp_gte: Maybe<Scalars['String']>;
  verifiedTimeStamp_lte: Maybe<Scalars['String']>;
  verifiedTimeStamp_in: Maybe<Array<Scalars['String']>>;
  verifiedTimeStamp_not_in: Maybe<Array<Scalars['String']>>;
  verifiedTimeStamp_contains: Maybe<Scalars['String']>;
  verifiedTimeStamp_not_contains: Maybe<Scalars['String']>;
  verifiedTimeStamp_starts_with: Maybe<Scalars['String']>;
  verifiedTimeStamp_not_starts_with: Maybe<Scalars['String']>;
  verifiedTimeStamp_ends_with: Maybe<Scalars['String']>;
  verifiedTimeStamp_not_ends_with: Maybe<Scalars['String']>;
  contributorAddress: Maybe<Scalars['Bytes']>;
  contributorAddress_not: Maybe<Scalars['Bytes']>;
  contributorAddress_in: Maybe<Array<Scalars['Bytes']>>;
  contributorAddress_not_in: Maybe<Array<Scalars['Bytes']>>;
  contributorAddress_contains: Maybe<Scalars['Bytes']>;
  contributorAddress_not_contains: Maybe<Scalars['Bytes']>;
  fundingRounds: Maybe<Array<Scalars['String']>>;
  fundingRounds_not: Maybe<Array<Scalars['String']>>;
  fundingRounds_contains: Maybe<Array<Scalars['String']>>;
  fundingRounds_not_contains: Maybe<Array<Scalars['String']>>;
  createdAt: Maybe<Scalars['String']>;
  createdAt_not: Maybe<Scalars['String']>;
  createdAt_gt: Maybe<Scalars['String']>;
  createdAt_lt: Maybe<Scalars['String']>;
  createdAt_gte: Maybe<Scalars['String']>;
  createdAt_lte: Maybe<Scalars['String']>;
  createdAt_in: Maybe<Array<Scalars['String']>>;
  createdAt_not_in: Maybe<Array<Scalars['String']>>;
  createdAt_contains: Maybe<Scalars['String']>;
  createdAt_not_contains: Maybe<Scalars['String']>;
  createdAt_starts_with: Maybe<Scalars['String']>;
  createdAt_not_starts_with: Maybe<Scalars['String']>;
  createdAt_ends_with: Maybe<Scalars['String']>;
  createdAt_not_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
  lastUpdatedAt_not: Maybe<Scalars['String']>;
  lastUpdatedAt_gt: Maybe<Scalars['String']>;
  lastUpdatedAt_lt: Maybe<Scalars['String']>;
  lastUpdatedAt_gte: Maybe<Scalars['String']>;
  lastUpdatedAt_lte: Maybe<Scalars['String']>;
  lastUpdatedAt_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_not_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: Maybe<Scalars['String']>;
};

export enum Contributor_OrderBy {
  Id = 'id',
  ContributorRegistry = 'contributorRegistry',
  Votes = 'votes',
  Verified = 'verified',
  VerifiedTimeStamp = 'verifiedTimeStamp',
  ContributorAddress = 'contributorAddress',
  FundingRounds = 'fundingRounds',
  Contributions = 'contributions',
  CreatedAt = 'createdAt',
  LastUpdatedAt = 'lastUpdatedAt'
}

export type Coordinator = {
  __typename?: 'Coordinator';
  id: Scalars['ID'];
  contact: Maybe<Scalars['String']>;
  createdAt: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
};

export type Coordinator_Filter = {
  id: Maybe<Scalars['ID']>;
  id_not: Maybe<Scalars['ID']>;
  id_gt: Maybe<Scalars['ID']>;
  id_lt: Maybe<Scalars['ID']>;
  id_gte: Maybe<Scalars['ID']>;
  id_lte: Maybe<Scalars['ID']>;
  id_in: Maybe<Array<Scalars['ID']>>;
  id_not_in: Maybe<Array<Scalars['ID']>>;
  contact: Maybe<Scalars['String']>;
  contact_not: Maybe<Scalars['String']>;
  contact_gt: Maybe<Scalars['String']>;
  contact_lt: Maybe<Scalars['String']>;
  contact_gte: Maybe<Scalars['String']>;
  contact_lte: Maybe<Scalars['String']>;
  contact_in: Maybe<Array<Scalars['String']>>;
  contact_not_in: Maybe<Array<Scalars['String']>>;
  contact_contains: Maybe<Scalars['String']>;
  contact_not_contains: Maybe<Scalars['String']>;
  contact_starts_with: Maybe<Scalars['String']>;
  contact_not_starts_with: Maybe<Scalars['String']>;
  contact_ends_with: Maybe<Scalars['String']>;
  contact_not_ends_with: Maybe<Scalars['String']>;
  createdAt: Maybe<Scalars['String']>;
  createdAt_not: Maybe<Scalars['String']>;
  createdAt_gt: Maybe<Scalars['String']>;
  createdAt_lt: Maybe<Scalars['String']>;
  createdAt_gte: Maybe<Scalars['String']>;
  createdAt_lte: Maybe<Scalars['String']>;
  createdAt_in: Maybe<Array<Scalars['String']>>;
  createdAt_not_in: Maybe<Array<Scalars['String']>>;
  createdAt_contains: Maybe<Scalars['String']>;
  createdAt_not_contains: Maybe<Scalars['String']>;
  createdAt_starts_with: Maybe<Scalars['String']>;
  createdAt_not_starts_with: Maybe<Scalars['String']>;
  createdAt_ends_with: Maybe<Scalars['String']>;
  createdAt_not_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
  lastUpdatedAt_not: Maybe<Scalars['String']>;
  lastUpdatedAt_gt: Maybe<Scalars['String']>;
  lastUpdatedAt_lt: Maybe<Scalars['String']>;
  lastUpdatedAt_gte: Maybe<Scalars['String']>;
  lastUpdatedAt_lte: Maybe<Scalars['String']>;
  lastUpdatedAt_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_not_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: Maybe<Scalars['String']>;
};

export enum Coordinator_OrderBy {
  Id = 'id',
  Contact = 'contact',
  CreatedAt = 'createdAt',
  LastUpdatedAt = 'lastUpdatedAt'
}

export type Donation = {
  __typename?: 'Donation';
  id: Scalars['ID'];
  recipient: Maybe<Recipient>;
  fundingRound: Maybe<FundingRound>;
  amount: Maybe<Scalars['BigInt']>;
  voteOptionIndex: Maybe<Scalars['BigInt']>;
  createdAt: Maybe<Scalars['String']>;
};

export type Donation_Filter = {
  id: Maybe<Scalars['ID']>;
  id_not: Maybe<Scalars['ID']>;
  id_gt: Maybe<Scalars['ID']>;
  id_lt: Maybe<Scalars['ID']>;
  id_gte: Maybe<Scalars['ID']>;
  id_lte: Maybe<Scalars['ID']>;
  id_in: Maybe<Array<Scalars['ID']>>;
  id_not_in: Maybe<Array<Scalars['ID']>>;
  recipient: Maybe<Scalars['String']>;
  recipient_not: Maybe<Scalars['String']>;
  recipient_gt: Maybe<Scalars['String']>;
  recipient_lt: Maybe<Scalars['String']>;
  recipient_gte: Maybe<Scalars['String']>;
  recipient_lte: Maybe<Scalars['String']>;
  recipient_in: Maybe<Array<Scalars['String']>>;
  recipient_not_in: Maybe<Array<Scalars['String']>>;
  recipient_contains: Maybe<Scalars['String']>;
  recipient_not_contains: Maybe<Scalars['String']>;
  recipient_starts_with: Maybe<Scalars['String']>;
  recipient_not_starts_with: Maybe<Scalars['String']>;
  recipient_ends_with: Maybe<Scalars['String']>;
  recipient_not_ends_with: Maybe<Scalars['String']>;
  fundingRound: Maybe<Scalars['String']>;
  fundingRound_not: Maybe<Scalars['String']>;
  fundingRound_gt: Maybe<Scalars['String']>;
  fundingRound_lt: Maybe<Scalars['String']>;
  fundingRound_gte: Maybe<Scalars['String']>;
  fundingRound_lte: Maybe<Scalars['String']>;
  fundingRound_in: Maybe<Array<Scalars['String']>>;
  fundingRound_not_in: Maybe<Array<Scalars['String']>>;
  fundingRound_contains: Maybe<Scalars['String']>;
  fundingRound_not_contains: Maybe<Scalars['String']>;
  fundingRound_starts_with: Maybe<Scalars['String']>;
  fundingRound_not_starts_with: Maybe<Scalars['String']>;
  fundingRound_ends_with: Maybe<Scalars['String']>;
  fundingRound_not_ends_with: Maybe<Scalars['String']>;
  amount: Maybe<Scalars['BigInt']>;
  amount_not: Maybe<Scalars['BigInt']>;
  amount_gt: Maybe<Scalars['BigInt']>;
  amount_lt: Maybe<Scalars['BigInt']>;
  amount_gte: Maybe<Scalars['BigInt']>;
  amount_lte: Maybe<Scalars['BigInt']>;
  amount_in: Maybe<Array<Scalars['BigInt']>>;
  amount_not_in: Maybe<Array<Scalars['BigInt']>>;
  voteOptionIndex: Maybe<Scalars['BigInt']>;
  voteOptionIndex_not: Maybe<Scalars['BigInt']>;
  voteOptionIndex_gt: Maybe<Scalars['BigInt']>;
  voteOptionIndex_lt: Maybe<Scalars['BigInt']>;
  voteOptionIndex_gte: Maybe<Scalars['BigInt']>;
  voteOptionIndex_lte: Maybe<Scalars['BigInt']>;
  voteOptionIndex_in: Maybe<Array<Scalars['BigInt']>>;
  voteOptionIndex_not_in: Maybe<Array<Scalars['BigInt']>>;
  createdAt: Maybe<Scalars['String']>;
  createdAt_not: Maybe<Scalars['String']>;
  createdAt_gt: Maybe<Scalars['String']>;
  createdAt_lt: Maybe<Scalars['String']>;
  createdAt_gte: Maybe<Scalars['String']>;
  createdAt_lte: Maybe<Scalars['String']>;
  createdAt_in: Maybe<Array<Scalars['String']>>;
  createdAt_not_in: Maybe<Array<Scalars['String']>>;
  createdAt_contains: Maybe<Scalars['String']>;
  createdAt_not_contains: Maybe<Scalars['String']>;
  createdAt_starts_with: Maybe<Scalars['String']>;
  createdAt_not_starts_with: Maybe<Scalars['String']>;
  createdAt_ends_with: Maybe<Scalars['String']>;
  createdAt_not_ends_with: Maybe<Scalars['String']>;
};

export enum Donation_OrderBy {
  Id = 'id',
  Recipient = 'recipient',
  FundingRound = 'fundingRound',
  Amount = 'amount',
  VoteOptionIndex = 'voteOptionIndex',
  CreatedAt = 'createdAt'
}

export type FundingRound = {
  __typename?: 'FundingRound';
  id: Scalars['ID'];
  fundingRoundFactory: Maybe<FundingRoundFactory>;
  recipientRegistry: Maybe<RecipientRegistry>;
  recipientRegistryAddress: Maybe<Scalars['Bytes']>;
  contributorRegistry: Maybe<ContributorRegistry>;
  contributorRegistryAddress: Maybe<Scalars['Bytes']>;
  nativeToken: Maybe<Scalars['Bytes']>;
  startTime: Maybe<Scalars['BigInt']>;
  signUpDeadline: Maybe<Scalars['BigInt']>;
  votingDeadline: Maybe<Scalars['BigInt']>;
  coordinator: Maybe<Scalars['Bytes']>;
  maci: Maybe<Scalars['Bytes']>;
  voiceCreditFactor: Maybe<Scalars['BigInt']>;
  contributorCount: Scalars['BigInt'];
  recipientCount: Scalars['BigInt'];
  matchingPoolSize: Maybe<Scalars['BigInt']>;
  totalSpent: Maybe<Scalars['BigInt']>;
  totalVotes: Maybe<Scalars['BigInt']>;
  isFinalized: Maybe<Scalars['Boolean']>;
  isCancelled: Maybe<Scalars['Boolean']>;
  tallyHash: Maybe<Scalars['String']>;
  recipients: Maybe<Array<Recipient>>;
  contributors: Maybe<Array<Contributor>>;
  contributions: Maybe<Array<Contribution>>;
  votes: Maybe<Array<Vote>>;
  createdAt: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
};


export type FundingRoundRecipientsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Recipient_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Recipient_Filter>;
};


export type FundingRoundContributorsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Contributor_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Contributor_Filter>;
};


export type FundingRoundContributionsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Contribution_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Contribution_Filter>;
};


export type FundingRoundVotesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Vote_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Vote_Filter>;
};

export type FundingRoundFactory = {
  __typename?: 'FundingRoundFactory';
  id: Scalars['ID'];
  owner: Maybe<Scalars['Bytes']>;
  coordinator: Maybe<Scalars['Bytes']>;
  nativeToken: Maybe<Scalars['Bytes']>;
  contributorRegistry: Maybe<ContributorRegistry>;
  contributorRegistryAddress: Maybe<Scalars['Bytes']>;
  recipientRegistry: Maybe<RecipientRegistry>;
  recipientRegistryAddress: Maybe<Scalars['Bytes']>;
  currentRound: Maybe<FundingRound>;
  maciFactory: Maybe<Scalars['Bytes']>;
  coordinatorPubKey: Maybe<Scalars['String']>;
  stateTreeDepth: Maybe<Scalars['BigInt']>;
  messageTreeDepth: Maybe<Scalars['BigInt']>;
  voteOptionTreeDepth: Maybe<Scalars['BigInt']>;
  tallyBatchSize: Maybe<Scalars['BigInt']>;
  messageBatchSize: Maybe<Scalars['BigInt']>;
  batchUstVerifier: Maybe<Scalars['Bytes']>;
  qvtVerifier: Maybe<Scalars['Bytes']>;
  signUpDuration: Maybe<Scalars['BigInt']>;
  votingDuration: Maybe<Scalars['BigInt']>;
  maxUsers: Maybe<Scalars['BigInt']>;
  maxMessages: Maybe<Scalars['BigInt']>;
  maxVoteOptions: Maybe<Scalars['BigInt']>;
  fundingRounds: Maybe<Array<FundingRound>>;
  createdAt: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
};


export type FundingRoundFactoryFundingRoundsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<FundingRound_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<FundingRound_Filter>;
};

export type FundingRoundFactory_Filter = {
  id: Maybe<Scalars['ID']>;
  id_not: Maybe<Scalars['ID']>;
  id_gt: Maybe<Scalars['ID']>;
  id_lt: Maybe<Scalars['ID']>;
  id_gte: Maybe<Scalars['ID']>;
  id_lte: Maybe<Scalars['ID']>;
  id_in: Maybe<Array<Scalars['ID']>>;
  id_not_in: Maybe<Array<Scalars['ID']>>;
  owner: Maybe<Scalars['Bytes']>;
  owner_not: Maybe<Scalars['Bytes']>;
  owner_in: Maybe<Array<Scalars['Bytes']>>;
  owner_not_in: Maybe<Array<Scalars['Bytes']>>;
  owner_contains: Maybe<Scalars['Bytes']>;
  owner_not_contains: Maybe<Scalars['Bytes']>;
  coordinator: Maybe<Scalars['Bytes']>;
  coordinator_not: Maybe<Scalars['Bytes']>;
  coordinator_in: Maybe<Array<Scalars['Bytes']>>;
  coordinator_not_in: Maybe<Array<Scalars['Bytes']>>;
  coordinator_contains: Maybe<Scalars['Bytes']>;
  coordinator_not_contains: Maybe<Scalars['Bytes']>;
  nativeToken: Maybe<Scalars['Bytes']>;
  nativeToken_not: Maybe<Scalars['Bytes']>;
  nativeToken_in: Maybe<Array<Scalars['Bytes']>>;
  nativeToken_not_in: Maybe<Array<Scalars['Bytes']>>;
  nativeToken_contains: Maybe<Scalars['Bytes']>;
  nativeToken_not_contains: Maybe<Scalars['Bytes']>;
  contributorRegistry: Maybe<Scalars['String']>;
  contributorRegistry_not: Maybe<Scalars['String']>;
  contributorRegistry_gt: Maybe<Scalars['String']>;
  contributorRegistry_lt: Maybe<Scalars['String']>;
  contributorRegistry_gte: Maybe<Scalars['String']>;
  contributorRegistry_lte: Maybe<Scalars['String']>;
  contributorRegistry_in: Maybe<Array<Scalars['String']>>;
  contributorRegistry_not_in: Maybe<Array<Scalars['String']>>;
  contributorRegistry_contains: Maybe<Scalars['String']>;
  contributorRegistry_not_contains: Maybe<Scalars['String']>;
  contributorRegistry_starts_with: Maybe<Scalars['String']>;
  contributorRegistry_not_starts_with: Maybe<Scalars['String']>;
  contributorRegistry_ends_with: Maybe<Scalars['String']>;
  contributorRegistry_not_ends_with: Maybe<Scalars['String']>;
  contributorRegistryAddress: Maybe<Scalars['Bytes']>;
  contributorRegistryAddress_not: Maybe<Scalars['Bytes']>;
  contributorRegistryAddress_in: Maybe<Array<Scalars['Bytes']>>;
  contributorRegistryAddress_not_in: Maybe<Array<Scalars['Bytes']>>;
  contributorRegistryAddress_contains: Maybe<Scalars['Bytes']>;
  contributorRegistryAddress_not_contains: Maybe<Scalars['Bytes']>;
  recipientRegistry: Maybe<Scalars['String']>;
  recipientRegistry_not: Maybe<Scalars['String']>;
  recipientRegistry_gt: Maybe<Scalars['String']>;
  recipientRegistry_lt: Maybe<Scalars['String']>;
  recipientRegistry_gte: Maybe<Scalars['String']>;
  recipientRegistry_lte: Maybe<Scalars['String']>;
  recipientRegistry_in: Maybe<Array<Scalars['String']>>;
  recipientRegistry_not_in: Maybe<Array<Scalars['String']>>;
  recipientRegistry_contains: Maybe<Scalars['String']>;
  recipientRegistry_not_contains: Maybe<Scalars['String']>;
  recipientRegistry_starts_with: Maybe<Scalars['String']>;
  recipientRegistry_not_starts_with: Maybe<Scalars['String']>;
  recipientRegistry_ends_with: Maybe<Scalars['String']>;
  recipientRegistry_not_ends_with: Maybe<Scalars['String']>;
  recipientRegistryAddress: Maybe<Scalars['Bytes']>;
  recipientRegistryAddress_not: Maybe<Scalars['Bytes']>;
  recipientRegistryAddress_in: Maybe<Array<Scalars['Bytes']>>;
  recipientRegistryAddress_not_in: Maybe<Array<Scalars['Bytes']>>;
  recipientRegistryAddress_contains: Maybe<Scalars['Bytes']>;
  recipientRegistryAddress_not_contains: Maybe<Scalars['Bytes']>;
  currentRound: Maybe<Scalars['String']>;
  currentRound_not: Maybe<Scalars['String']>;
  currentRound_gt: Maybe<Scalars['String']>;
  currentRound_lt: Maybe<Scalars['String']>;
  currentRound_gte: Maybe<Scalars['String']>;
  currentRound_lte: Maybe<Scalars['String']>;
  currentRound_in: Maybe<Array<Scalars['String']>>;
  currentRound_not_in: Maybe<Array<Scalars['String']>>;
  currentRound_contains: Maybe<Scalars['String']>;
  currentRound_not_contains: Maybe<Scalars['String']>;
  currentRound_starts_with: Maybe<Scalars['String']>;
  currentRound_not_starts_with: Maybe<Scalars['String']>;
  currentRound_ends_with: Maybe<Scalars['String']>;
  currentRound_not_ends_with: Maybe<Scalars['String']>;
  maciFactory: Maybe<Scalars['Bytes']>;
  maciFactory_not: Maybe<Scalars['Bytes']>;
  maciFactory_in: Maybe<Array<Scalars['Bytes']>>;
  maciFactory_not_in: Maybe<Array<Scalars['Bytes']>>;
  maciFactory_contains: Maybe<Scalars['Bytes']>;
  maciFactory_not_contains: Maybe<Scalars['Bytes']>;
  coordinatorPubKey: Maybe<Scalars['String']>;
  coordinatorPubKey_not: Maybe<Scalars['String']>;
  coordinatorPubKey_gt: Maybe<Scalars['String']>;
  coordinatorPubKey_lt: Maybe<Scalars['String']>;
  coordinatorPubKey_gte: Maybe<Scalars['String']>;
  coordinatorPubKey_lte: Maybe<Scalars['String']>;
  coordinatorPubKey_in: Maybe<Array<Scalars['String']>>;
  coordinatorPubKey_not_in: Maybe<Array<Scalars['String']>>;
  coordinatorPubKey_contains: Maybe<Scalars['String']>;
  coordinatorPubKey_not_contains: Maybe<Scalars['String']>;
  coordinatorPubKey_starts_with: Maybe<Scalars['String']>;
  coordinatorPubKey_not_starts_with: Maybe<Scalars['String']>;
  coordinatorPubKey_ends_with: Maybe<Scalars['String']>;
  coordinatorPubKey_not_ends_with: Maybe<Scalars['String']>;
  stateTreeDepth: Maybe<Scalars['BigInt']>;
  stateTreeDepth_not: Maybe<Scalars['BigInt']>;
  stateTreeDepth_gt: Maybe<Scalars['BigInt']>;
  stateTreeDepth_lt: Maybe<Scalars['BigInt']>;
  stateTreeDepth_gte: Maybe<Scalars['BigInt']>;
  stateTreeDepth_lte: Maybe<Scalars['BigInt']>;
  stateTreeDepth_in: Maybe<Array<Scalars['BigInt']>>;
  stateTreeDepth_not_in: Maybe<Array<Scalars['BigInt']>>;
  messageTreeDepth: Maybe<Scalars['BigInt']>;
  messageTreeDepth_not: Maybe<Scalars['BigInt']>;
  messageTreeDepth_gt: Maybe<Scalars['BigInt']>;
  messageTreeDepth_lt: Maybe<Scalars['BigInt']>;
  messageTreeDepth_gte: Maybe<Scalars['BigInt']>;
  messageTreeDepth_lte: Maybe<Scalars['BigInt']>;
  messageTreeDepth_in: Maybe<Array<Scalars['BigInt']>>;
  messageTreeDepth_not_in: Maybe<Array<Scalars['BigInt']>>;
  voteOptionTreeDepth: Maybe<Scalars['BigInt']>;
  voteOptionTreeDepth_not: Maybe<Scalars['BigInt']>;
  voteOptionTreeDepth_gt: Maybe<Scalars['BigInt']>;
  voteOptionTreeDepth_lt: Maybe<Scalars['BigInt']>;
  voteOptionTreeDepth_gte: Maybe<Scalars['BigInt']>;
  voteOptionTreeDepth_lte: Maybe<Scalars['BigInt']>;
  voteOptionTreeDepth_in: Maybe<Array<Scalars['BigInt']>>;
  voteOptionTreeDepth_not_in: Maybe<Array<Scalars['BigInt']>>;
  tallyBatchSize: Maybe<Scalars['BigInt']>;
  tallyBatchSize_not: Maybe<Scalars['BigInt']>;
  tallyBatchSize_gt: Maybe<Scalars['BigInt']>;
  tallyBatchSize_lt: Maybe<Scalars['BigInt']>;
  tallyBatchSize_gte: Maybe<Scalars['BigInt']>;
  tallyBatchSize_lte: Maybe<Scalars['BigInt']>;
  tallyBatchSize_in: Maybe<Array<Scalars['BigInt']>>;
  tallyBatchSize_not_in: Maybe<Array<Scalars['BigInt']>>;
  messageBatchSize: Maybe<Scalars['BigInt']>;
  messageBatchSize_not: Maybe<Scalars['BigInt']>;
  messageBatchSize_gt: Maybe<Scalars['BigInt']>;
  messageBatchSize_lt: Maybe<Scalars['BigInt']>;
  messageBatchSize_gte: Maybe<Scalars['BigInt']>;
  messageBatchSize_lte: Maybe<Scalars['BigInt']>;
  messageBatchSize_in: Maybe<Array<Scalars['BigInt']>>;
  messageBatchSize_not_in: Maybe<Array<Scalars['BigInt']>>;
  batchUstVerifier: Maybe<Scalars['Bytes']>;
  batchUstVerifier_not: Maybe<Scalars['Bytes']>;
  batchUstVerifier_in: Maybe<Array<Scalars['Bytes']>>;
  batchUstVerifier_not_in: Maybe<Array<Scalars['Bytes']>>;
  batchUstVerifier_contains: Maybe<Scalars['Bytes']>;
  batchUstVerifier_not_contains: Maybe<Scalars['Bytes']>;
  qvtVerifier: Maybe<Scalars['Bytes']>;
  qvtVerifier_not: Maybe<Scalars['Bytes']>;
  qvtVerifier_in: Maybe<Array<Scalars['Bytes']>>;
  qvtVerifier_not_in: Maybe<Array<Scalars['Bytes']>>;
  qvtVerifier_contains: Maybe<Scalars['Bytes']>;
  qvtVerifier_not_contains: Maybe<Scalars['Bytes']>;
  signUpDuration: Maybe<Scalars['BigInt']>;
  signUpDuration_not: Maybe<Scalars['BigInt']>;
  signUpDuration_gt: Maybe<Scalars['BigInt']>;
  signUpDuration_lt: Maybe<Scalars['BigInt']>;
  signUpDuration_gte: Maybe<Scalars['BigInt']>;
  signUpDuration_lte: Maybe<Scalars['BigInt']>;
  signUpDuration_in: Maybe<Array<Scalars['BigInt']>>;
  signUpDuration_not_in: Maybe<Array<Scalars['BigInt']>>;
  votingDuration: Maybe<Scalars['BigInt']>;
  votingDuration_not: Maybe<Scalars['BigInt']>;
  votingDuration_gt: Maybe<Scalars['BigInt']>;
  votingDuration_lt: Maybe<Scalars['BigInt']>;
  votingDuration_gte: Maybe<Scalars['BigInt']>;
  votingDuration_lte: Maybe<Scalars['BigInt']>;
  votingDuration_in: Maybe<Array<Scalars['BigInt']>>;
  votingDuration_not_in: Maybe<Array<Scalars['BigInt']>>;
  maxUsers: Maybe<Scalars['BigInt']>;
  maxUsers_not: Maybe<Scalars['BigInt']>;
  maxUsers_gt: Maybe<Scalars['BigInt']>;
  maxUsers_lt: Maybe<Scalars['BigInt']>;
  maxUsers_gte: Maybe<Scalars['BigInt']>;
  maxUsers_lte: Maybe<Scalars['BigInt']>;
  maxUsers_in: Maybe<Array<Scalars['BigInt']>>;
  maxUsers_not_in: Maybe<Array<Scalars['BigInt']>>;
  maxMessages: Maybe<Scalars['BigInt']>;
  maxMessages_not: Maybe<Scalars['BigInt']>;
  maxMessages_gt: Maybe<Scalars['BigInt']>;
  maxMessages_lt: Maybe<Scalars['BigInt']>;
  maxMessages_gte: Maybe<Scalars['BigInt']>;
  maxMessages_lte: Maybe<Scalars['BigInt']>;
  maxMessages_in: Maybe<Array<Scalars['BigInt']>>;
  maxMessages_not_in: Maybe<Array<Scalars['BigInt']>>;
  maxVoteOptions: Maybe<Scalars['BigInt']>;
  maxVoteOptions_not: Maybe<Scalars['BigInt']>;
  maxVoteOptions_gt: Maybe<Scalars['BigInt']>;
  maxVoteOptions_lt: Maybe<Scalars['BigInt']>;
  maxVoteOptions_gte: Maybe<Scalars['BigInt']>;
  maxVoteOptions_lte: Maybe<Scalars['BigInt']>;
  maxVoteOptions_in: Maybe<Array<Scalars['BigInt']>>;
  maxVoteOptions_not_in: Maybe<Array<Scalars['BigInt']>>;
  createdAt: Maybe<Scalars['String']>;
  createdAt_not: Maybe<Scalars['String']>;
  createdAt_gt: Maybe<Scalars['String']>;
  createdAt_lt: Maybe<Scalars['String']>;
  createdAt_gte: Maybe<Scalars['String']>;
  createdAt_lte: Maybe<Scalars['String']>;
  createdAt_in: Maybe<Array<Scalars['String']>>;
  createdAt_not_in: Maybe<Array<Scalars['String']>>;
  createdAt_contains: Maybe<Scalars['String']>;
  createdAt_not_contains: Maybe<Scalars['String']>;
  createdAt_starts_with: Maybe<Scalars['String']>;
  createdAt_not_starts_with: Maybe<Scalars['String']>;
  createdAt_ends_with: Maybe<Scalars['String']>;
  createdAt_not_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
  lastUpdatedAt_not: Maybe<Scalars['String']>;
  lastUpdatedAt_gt: Maybe<Scalars['String']>;
  lastUpdatedAt_lt: Maybe<Scalars['String']>;
  lastUpdatedAt_gte: Maybe<Scalars['String']>;
  lastUpdatedAt_lte: Maybe<Scalars['String']>;
  lastUpdatedAt_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_not_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: Maybe<Scalars['String']>;
};

export enum FundingRoundFactory_OrderBy {
  Id = 'id',
  Owner = 'owner',
  Coordinator = 'coordinator',
  NativeToken = 'nativeToken',
  ContributorRegistry = 'contributorRegistry',
  ContributorRegistryAddress = 'contributorRegistryAddress',
  RecipientRegistry = 'recipientRegistry',
  RecipientRegistryAddress = 'recipientRegistryAddress',
  CurrentRound = 'currentRound',
  MaciFactory = 'maciFactory',
  CoordinatorPubKey = 'coordinatorPubKey',
  StateTreeDepth = 'stateTreeDepth',
  MessageTreeDepth = 'messageTreeDepth',
  VoteOptionTreeDepth = 'voteOptionTreeDepth',
  TallyBatchSize = 'tallyBatchSize',
  MessageBatchSize = 'messageBatchSize',
  BatchUstVerifier = 'batchUstVerifier',
  QvtVerifier = 'qvtVerifier',
  SignUpDuration = 'signUpDuration',
  VotingDuration = 'votingDuration',
  MaxUsers = 'maxUsers',
  MaxMessages = 'maxMessages',
  MaxVoteOptions = 'maxVoteOptions',
  FundingRounds = 'fundingRounds',
  CreatedAt = 'createdAt',
  LastUpdatedAt = 'lastUpdatedAt'
}

export type FundingRound_Filter = {
  id: Maybe<Scalars['ID']>;
  id_not: Maybe<Scalars['ID']>;
  id_gt: Maybe<Scalars['ID']>;
  id_lt: Maybe<Scalars['ID']>;
  id_gte: Maybe<Scalars['ID']>;
  id_lte: Maybe<Scalars['ID']>;
  id_in: Maybe<Array<Scalars['ID']>>;
  id_not_in: Maybe<Array<Scalars['ID']>>;
  fundingRoundFactory: Maybe<Scalars['String']>;
  fundingRoundFactory_not: Maybe<Scalars['String']>;
  fundingRoundFactory_gt: Maybe<Scalars['String']>;
  fundingRoundFactory_lt: Maybe<Scalars['String']>;
  fundingRoundFactory_gte: Maybe<Scalars['String']>;
  fundingRoundFactory_lte: Maybe<Scalars['String']>;
  fundingRoundFactory_in: Maybe<Array<Scalars['String']>>;
  fundingRoundFactory_not_in: Maybe<Array<Scalars['String']>>;
  fundingRoundFactory_contains: Maybe<Scalars['String']>;
  fundingRoundFactory_not_contains: Maybe<Scalars['String']>;
  fundingRoundFactory_starts_with: Maybe<Scalars['String']>;
  fundingRoundFactory_not_starts_with: Maybe<Scalars['String']>;
  fundingRoundFactory_ends_with: Maybe<Scalars['String']>;
  fundingRoundFactory_not_ends_with: Maybe<Scalars['String']>;
  recipientRegistry: Maybe<Scalars['String']>;
  recipientRegistry_not: Maybe<Scalars['String']>;
  recipientRegistry_gt: Maybe<Scalars['String']>;
  recipientRegistry_lt: Maybe<Scalars['String']>;
  recipientRegistry_gte: Maybe<Scalars['String']>;
  recipientRegistry_lte: Maybe<Scalars['String']>;
  recipientRegistry_in: Maybe<Array<Scalars['String']>>;
  recipientRegistry_not_in: Maybe<Array<Scalars['String']>>;
  recipientRegistry_contains: Maybe<Scalars['String']>;
  recipientRegistry_not_contains: Maybe<Scalars['String']>;
  recipientRegistry_starts_with: Maybe<Scalars['String']>;
  recipientRegistry_not_starts_with: Maybe<Scalars['String']>;
  recipientRegistry_ends_with: Maybe<Scalars['String']>;
  recipientRegistry_not_ends_with: Maybe<Scalars['String']>;
  recipientRegistryAddress: Maybe<Scalars['Bytes']>;
  recipientRegistryAddress_not: Maybe<Scalars['Bytes']>;
  recipientRegistryAddress_in: Maybe<Array<Scalars['Bytes']>>;
  recipientRegistryAddress_not_in: Maybe<Array<Scalars['Bytes']>>;
  recipientRegistryAddress_contains: Maybe<Scalars['Bytes']>;
  recipientRegistryAddress_not_contains: Maybe<Scalars['Bytes']>;
  contributorRegistry: Maybe<Scalars['String']>;
  contributorRegistry_not: Maybe<Scalars['String']>;
  contributorRegistry_gt: Maybe<Scalars['String']>;
  contributorRegistry_lt: Maybe<Scalars['String']>;
  contributorRegistry_gte: Maybe<Scalars['String']>;
  contributorRegistry_lte: Maybe<Scalars['String']>;
  contributorRegistry_in: Maybe<Array<Scalars['String']>>;
  contributorRegistry_not_in: Maybe<Array<Scalars['String']>>;
  contributorRegistry_contains: Maybe<Scalars['String']>;
  contributorRegistry_not_contains: Maybe<Scalars['String']>;
  contributorRegistry_starts_with: Maybe<Scalars['String']>;
  contributorRegistry_not_starts_with: Maybe<Scalars['String']>;
  contributorRegistry_ends_with: Maybe<Scalars['String']>;
  contributorRegistry_not_ends_with: Maybe<Scalars['String']>;
  contributorRegistryAddress: Maybe<Scalars['Bytes']>;
  contributorRegistryAddress_not: Maybe<Scalars['Bytes']>;
  contributorRegistryAddress_in: Maybe<Array<Scalars['Bytes']>>;
  contributorRegistryAddress_not_in: Maybe<Array<Scalars['Bytes']>>;
  contributorRegistryAddress_contains: Maybe<Scalars['Bytes']>;
  contributorRegistryAddress_not_contains: Maybe<Scalars['Bytes']>;
  nativeToken: Maybe<Scalars['Bytes']>;
  nativeToken_not: Maybe<Scalars['Bytes']>;
  nativeToken_in: Maybe<Array<Scalars['Bytes']>>;
  nativeToken_not_in: Maybe<Array<Scalars['Bytes']>>;
  nativeToken_contains: Maybe<Scalars['Bytes']>;
  nativeToken_not_contains: Maybe<Scalars['Bytes']>;
  startTime: Maybe<Scalars['BigInt']>;
  startTime_not: Maybe<Scalars['BigInt']>;
  startTime_gt: Maybe<Scalars['BigInt']>;
  startTime_lt: Maybe<Scalars['BigInt']>;
  startTime_gte: Maybe<Scalars['BigInt']>;
  startTime_lte: Maybe<Scalars['BigInt']>;
  startTime_in: Maybe<Array<Scalars['BigInt']>>;
  startTime_not_in: Maybe<Array<Scalars['BigInt']>>;
  signUpDeadline: Maybe<Scalars['BigInt']>;
  signUpDeadline_not: Maybe<Scalars['BigInt']>;
  signUpDeadline_gt: Maybe<Scalars['BigInt']>;
  signUpDeadline_lt: Maybe<Scalars['BigInt']>;
  signUpDeadline_gte: Maybe<Scalars['BigInt']>;
  signUpDeadline_lte: Maybe<Scalars['BigInt']>;
  signUpDeadline_in: Maybe<Array<Scalars['BigInt']>>;
  signUpDeadline_not_in: Maybe<Array<Scalars['BigInt']>>;
  votingDeadline: Maybe<Scalars['BigInt']>;
  votingDeadline_not: Maybe<Scalars['BigInt']>;
  votingDeadline_gt: Maybe<Scalars['BigInt']>;
  votingDeadline_lt: Maybe<Scalars['BigInt']>;
  votingDeadline_gte: Maybe<Scalars['BigInt']>;
  votingDeadline_lte: Maybe<Scalars['BigInt']>;
  votingDeadline_in: Maybe<Array<Scalars['BigInt']>>;
  votingDeadline_not_in: Maybe<Array<Scalars['BigInt']>>;
  coordinator: Maybe<Scalars['Bytes']>;
  coordinator_not: Maybe<Scalars['Bytes']>;
  coordinator_in: Maybe<Array<Scalars['Bytes']>>;
  coordinator_not_in: Maybe<Array<Scalars['Bytes']>>;
  coordinator_contains: Maybe<Scalars['Bytes']>;
  coordinator_not_contains: Maybe<Scalars['Bytes']>;
  maci: Maybe<Scalars['Bytes']>;
  maci_not: Maybe<Scalars['Bytes']>;
  maci_in: Maybe<Array<Scalars['Bytes']>>;
  maci_not_in: Maybe<Array<Scalars['Bytes']>>;
  maci_contains: Maybe<Scalars['Bytes']>;
  maci_not_contains: Maybe<Scalars['Bytes']>;
  voiceCreditFactor: Maybe<Scalars['BigInt']>;
  voiceCreditFactor_not: Maybe<Scalars['BigInt']>;
  voiceCreditFactor_gt: Maybe<Scalars['BigInt']>;
  voiceCreditFactor_lt: Maybe<Scalars['BigInt']>;
  voiceCreditFactor_gte: Maybe<Scalars['BigInt']>;
  voiceCreditFactor_lte: Maybe<Scalars['BigInt']>;
  voiceCreditFactor_in: Maybe<Array<Scalars['BigInt']>>;
  voiceCreditFactor_not_in: Maybe<Array<Scalars['BigInt']>>;
  contributorCount: Maybe<Scalars['BigInt']>;
  contributorCount_not: Maybe<Scalars['BigInt']>;
  contributorCount_gt: Maybe<Scalars['BigInt']>;
  contributorCount_lt: Maybe<Scalars['BigInt']>;
  contributorCount_gte: Maybe<Scalars['BigInt']>;
  contributorCount_lte: Maybe<Scalars['BigInt']>;
  contributorCount_in: Maybe<Array<Scalars['BigInt']>>;
  contributorCount_not_in: Maybe<Array<Scalars['BigInt']>>;
  recipientCount: Maybe<Scalars['BigInt']>;
  recipientCount_not: Maybe<Scalars['BigInt']>;
  recipientCount_gt: Maybe<Scalars['BigInt']>;
  recipientCount_lt: Maybe<Scalars['BigInt']>;
  recipientCount_gte: Maybe<Scalars['BigInt']>;
  recipientCount_lte: Maybe<Scalars['BigInt']>;
  recipientCount_in: Maybe<Array<Scalars['BigInt']>>;
  recipientCount_not_in: Maybe<Array<Scalars['BigInt']>>;
  matchingPoolSize: Maybe<Scalars['BigInt']>;
  matchingPoolSize_not: Maybe<Scalars['BigInt']>;
  matchingPoolSize_gt: Maybe<Scalars['BigInt']>;
  matchingPoolSize_lt: Maybe<Scalars['BigInt']>;
  matchingPoolSize_gte: Maybe<Scalars['BigInt']>;
  matchingPoolSize_lte: Maybe<Scalars['BigInt']>;
  matchingPoolSize_in: Maybe<Array<Scalars['BigInt']>>;
  matchingPoolSize_not_in: Maybe<Array<Scalars['BigInt']>>;
  totalSpent: Maybe<Scalars['BigInt']>;
  totalSpent_not: Maybe<Scalars['BigInt']>;
  totalSpent_gt: Maybe<Scalars['BigInt']>;
  totalSpent_lt: Maybe<Scalars['BigInt']>;
  totalSpent_gte: Maybe<Scalars['BigInt']>;
  totalSpent_lte: Maybe<Scalars['BigInt']>;
  totalSpent_in: Maybe<Array<Scalars['BigInt']>>;
  totalSpent_not_in: Maybe<Array<Scalars['BigInt']>>;
  totalVotes: Maybe<Scalars['BigInt']>;
  totalVotes_not: Maybe<Scalars['BigInt']>;
  totalVotes_gt: Maybe<Scalars['BigInt']>;
  totalVotes_lt: Maybe<Scalars['BigInt']>;
  totalVotes_gte: Maybe<Scalars['BigInt']>;
  totalVotes_lte: Maybe<Scalars['BigInt']>;
  totalVotes_in: Maybe<Array<Scalars['BigInt']>>;
  totalVotes_not_in: Maybe<Array<Scalars['BigInt']>>;
  isFinalized: Maybe<Scalars['Boolean']>;
  isFinalized_not: Maybe<Scalars['Boolean']>;
  isFinalized_in: Maybe<Array<Scalars['Boolean']>>;
  isFinalized_not_in: Maybe<Array<Scalars['Boolean']>>;
  isCancelled: Maybe<Scalars['Boolean']>;
  isCancelled_not: Maybe<Scalars['Boolean']>;
  isCancelled_in: Maybe<Array<Scalars['Boolean']>>;
  isCancelled_not_in: Maybe<Array<Scalars['Boolean']>>;
  tallyHash: Maybe<Scalars['String']>;
  tallyHash_not: Maybe<Scalars['String']>;
  tallyHash_gt: Maybe<Scalars['String']>;
  tallyHash_lt: Maybe<Scalars['String']>;
  tallyHash_gte: Maybe<Scalars['String']>;
  tallyHash_lte: Maybe<Scalars['String']>;
  tallyHash_in: Maybe<Array<Scalars['String']>>;
  tallyHash_not_in: Maybe<Array<Scalars['String']>>;
  tallyHash_contains: Maybe<Scalars['String']>;
  tallyHash_not_contains: Maybe<Scalars['String']>;
  tallyHash_starts_with: Maybe<Scalars['String']>;
  tallyHash_not_starts_with: Maybe<Scalars['String']>;
  tallyHash_ends_with: Maybe<Scalars['String']>;
  tallyHash_not_ends_with: Maybe<Scalars['String']>;
  createdAt: Maybe<Scalars['String']>;
  createdAt_not: Maybe<Scalars['String']>;
  createdAt_gt: Maybe<Scalars['String']>;
  createdAt_lt: Maybe<Scalars['String']>;
  createdAt_gte: Maybe<Scalars['String']>;
  createdAt_lte: Maybe<Scalars['String']>;
  createdAt_in: Maybe<Array<Scalars['String']>>;
  createdAt_not_in: Maybe<Array<Scalars['String']>>;
  createdAt_contains: Maybe<Scalars['String']>;
  createdAt_not_contains: Maybe<Scalars['String']>;
  createdAt_starts_with: Maybe<Scalars['String']>;
  createdAt_not_starts_with: Maybe<Scalars['String']>;
  createdAt_ends_with: Maybe<Scalars['String']>;
  createdAt_not_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
  lastUpdatedAt_not: Maybe<Scalars['String']>;
  lastUpdatedAt_gt: Maybe<Scalars['String']>;
  lastUpdatedAt_lt: Maybe<Scalars['String']>;
  lastUpdatedAt_gte: Maybe<Scalars['String']>;
  lastUpdatedAt_lte: Maybe<Scalars['String']>;
  lastUpdatedAt_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_not_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: Maybe<Scalars['String']>;
};

export enum FundingRound_OrderBy {
  Id = 'id',
  FundingRoundFactory = 'fundingRoundFactory',
  RecipientRegistry = 'recipientRegistry',
  RecipientRegistryAddress = 'recipientRegistryAddress',
  ContributorRegistry = 'contributorRegistry',
  ContributorRegistryAddress = 'contributorRegistryAddress',
  NativeToken = 'nativeToken',
  StartTime = 'startTime',
  SignUpDeadline = 'signUpDeadline',
  VotingDeadline = 'votingDeadline',
  Coordinator = 'coordinator',
  Maci = 'maci',
  VoiceCreditFactor = 'voiceCreditFactor',
  ContributorCount = 'contributorCount',
  RecipientCount = 'recipientCount',
  MatchingPoolSize = 'matchingPoolSize',
  TotalSpent = 'totalSpent',
  TotalVotes = 'totalVotes',
  IsFinalized = 'isFinalized',
  IsCancelled = 'isCancelled',
  TallyHash = 'tallyHash',
  Recipients = 'recipients',
  Contributors = 'contributors',
  Contributions = 'contributions',
  Votes = 'votes',
  CreatedAt = 'createdAt',
  LastUpdatedAt = 'lastUpdatedAt'
}

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type Query = {
  __typename?: 'Query';
  fundingRoundFactory: Maybe<FundingRoundFactory>;
  fundingRoundFactories: Array<FundingRoundFactory>;
  fundingRound: Maybe<FundingRound>;
  fundingRounds: Array<FundingRound>;
  recipientRegistry: Maybe<RecipientRegistry>;
  recipientRegistries: Array<RecipientRegistry>;
  recipient: Maybe<Recipient>;
  recipients: Array<Recipient>;
  contributorRegistry: Maybe<ContributorRegistry>;
  contributorRegistries: Array<ContributorRegistry>;
  contributor: Maybe<Contributor>;
  contributors: Array<Contributor>;
  coordinator: Maybe<Coordinator>;
  coordinators: Array<Coordinator>;
  contribution: Maybe<Contribution>;
  contributions: Array<Contribution>;
  vote: Maybe<Vote>;
  votes: Array<Vote>;
  donation: Maybe<Donation>;
  donations: Array<Donation>;
  token: Maybe<Token>;
  tokens: Array<Token>;
  /** Access to subgraph metadata */
  _meta: Maybe<_Meta_>;
};


export type QueryFundingRoundFactoryArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type QueryFundingRoundFactoriesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<FundingRoundFactory_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<FundingRoundFactory_Filter>;
  block: Maybe<Block_Height>;
};


export type QueryFundingRoundArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type QueryFundingRoundsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<FundingRound_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<FundingRound_Filter>;
  block: Maybe<Block_Height>;
};


export type QueryRecipientRegistryArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type QueryRecipientRegistriesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<RecipientRegistry_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<RecipientRegistry_Filter>;
  block: Maybe<Block_Height>;
};


export type QueryRecipientArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type QueryRecipientsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Recipient_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Recipient_Filter>;
  block: Maybe<Block_Height>;
};


export type QueryContributorRegistryArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type QueryContributorRegistriesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<ContributorRegistry_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<ContributorRegistry_Filter>;
  block: Maybe<Block_Height>;
};


export type QueryContributorArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type QueryContributorsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Contributor_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Contributor_Filter>;
  block: Maybe<Block_Height>;
};


export type QueryCoordinatorArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type QueryCoordinatorsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Coordinator_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Coordinator_Filter>;
  block: Maybe<Block_Height>;
};


export type QueryContributionArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type QueryContributionsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Contribution_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Contribution_Filter>;
  block: Maybe<Block_Height>;
};


export type QueryVoteArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type QueryVotesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Vote_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Vote_Filter>;
  block: Maybe<Block_Height>;
};


export type QueryDonationArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type QueryDonationsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Donation_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Donation_Filter>;
  block: Maybe<Block_Height>;
};


export type QueryTokenArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type QueryTokensArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Token_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Token_Filter>;
  block: Maybe<Block_Height>;
};


export type Query_MetaArgs = {
  block: Maybe<Block_Height>;
};

export type Recipient = {
  __typename?: 'Recipient';
  id: Scalars['ID'];
  recipientRegistry: Maybe<RecipientRegistry>;
  recipientIndex: Maybe<Scalars['BigInt']>;
  requestType: Maybe<Scalars['String']>;
  requester: Maybe<Scalars['String']>;
  submissionTime: Maybe<Scalars['String']>;
  deposit: Maybe<Scalars['BigInt']>;
  recipientAddress: Maybe<Scalars['Bytes']>;
  recipientMetadata: Maybe<Scalars['String']>;
  rejected: Maybe<Scalars['Boolean']>;
  verified: Maybe<Scalars['Boolean']>;
  voteOptionIndex: Maybe<Scalars['BigInt']>;
  requestResolvedHash: Maybe<Scalars['Bytes']>;
  requestSubmittedHash: Maybe<Scalars['Bytes']>;
  fundingRounds: Maybe<Array<FundingRound>>;
  donations: Maybe<Array<Donation>>;
  createdAt: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
};


export type RecipientFundingRoundsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<FundingRound_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<FundingRound_Filter>;
};


export type RecipientDonationsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Donation_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Donation_Filter>;
};

export type RecipientRegistry = {
  __typename?: 'RecipientRegistry';
  id: Scalars['ID'];
  fundingRoundFactory: Maybe<FundingRoundFactory>;
  baseDeposit: Maybe<Scalars['BigInt']>;
  challengePeriodDuration: Maybe<Scalars['BigInt']>;
  controller: Maybe<Scalars['Bytes']>;
  maxRecipients: Maybe<Scalars['BigInt']>;
  owner: Maybe<Scalars['Bytes']>;
  recipients: Maybe<Array<Recipient>>;
  createdAt: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
};


export type RecipientRegistryRecipientsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Recipient_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Recipient_Filter>;
};

export type RecipientRegistry_Filter = {
  id: Maybe<Scalars['ID']>;
  id_not: Maybe<Scalars['ID']>;
  id_gt: Maybe<Scalars['ID']>;
  id_lt: Maybe<Scalars['ID']>;
  id_gte: Maybe<Scalars['ID']>;
  id_lte: Maybe<Scalars['ID']>;
  id_in: Maybe<Array<Scalars['ID']>>;
  id_not_in: Maybe<Array<Scalars['ID']>>;
  fundingRoundFactory: Maybe<Scalars['String']>;
  fundingRoundFactory_not: Maybe<Scalars['String']>;
  fundingRoundFactory_gt: Maybe<Scalars['String']>;
  fundingRoundFactory_lt: Maybe<Scalars['String']>;
  fundingRoundFactory_gte: Maybe<Scalars['String']>;
  fundingRoundFactory_lte: Maybe<Scalars['String']>;
  fundingRoundFactory_in: Maybe<Array<Scalars['String']>>;
  fundingRoundFactory_not_in: Maybe<Array<Scalars['String']>>;
  fundingRoundFactory_contains: Maybe<Scalars['String']>;
  fundingRoundFactory_not_contains: Maybe<Scalars['String']>;
  fundingRoundFactory_starts_with: Maybe<Scalars['String']>;
  fundingRoundFactory_not_starts_with: Maybe<Scalars['String']>;
  fundingRoundFactory_ends_with: Maybe<Scalars['String']>;
  fundingRoundFactory_not_ends_with: Maybe<Scalars['String']>;
  baseDeposit: Maybe<Scalars['BigInt']>;
  baseDeposit_not: Maybe<Scalars['BigInt']>;
  baseDeposit_gt: Maybe<Scalars['BigInt']>;
  baseDeposit_lt: Maybe<Scalars['BigInt']>;
  baseDeposit_gte: Maybe<Scalars['BigInt']>;
  baseDeposit_lte: Maybe<Scalars['BigInt']>;
  baseDeposit_in: Maybe<Array<Scalars['BigInt']>>;
  baseDeposit_not_in: Maybe<Array<Scalars['BigInt']>>;
  challengePeriodDuration: Maybe<Scalars['BigInt']>;
  challengePeriodDuration_not: Maybe<Scalars['BigInt']>;
  challengePeriodDuration_gt: Maybe<Scalars['BigInt']>;
  challengePeriodDuration_lt: Maybe<Scalars['BigInt']>;
  challengePeriodDuration_gte: Maybe<Scalars['BigInt']>;
  challengePeriodDuration_lte: Maybe<Scalars['BigInt']>;
  challengePeriodDuration_in: Maybe<Array<Scalars['BigInt']>>;
  challengePeriodDuration_not_in: Maybe<Array<Scalars['BigInt']>>;
  controller: Maybe<Scalars['Bytes']>;
  controller_not: Maybe<Scalars['Bytes']>;
  controller_in: Maybe<Array<Scalars['Bytes']>>;
  controller_not_in: Maybe<Array<Scalars['Bytes']>>;
  controller_contains: Maybe<Scalars['Bytes']>;
  controller_not_contains: Maybe<Scalars['Bytes']>;
  maxRecipients: Maybe<Scalars['BigInt']>;
  maxRecipients_not: Maybe<Scalars['BigInt']>;
  maxRecipients_gt: Maybe<Scalars['BigInt']>;
  maxRecipients_lt: Maybe<Scalars['BigInt']>;
  maxRecipients_gte: Maybe<Scalars['BigInt']>;
  maxRecipients_lte: Maybe<Scalars['BigInt']>;
  maxRecipients_in: Maybe<Array<Scalars['BigInt']>>;
  maxRecipients_not_in: Maybe<Array<Scalars['BigInt']>>;
  owner: Maybe<Scalars['Bytes']>;
  owner_not: Maybe<Scalars['Bytes']>;
  owner_in: Maybe<Array<Scalars['Bytes']>>;
  owner_not_in: Maybe<Array<Scalars['Bytes']>>;
  owner_contains: Maybe<Scalars['Bytes']>;
  owner_not_contains: Maybe<Scalars['Bytes']>;
  createdAt: Maybe<Scalars['String']>;
  createdAt_not: Maybe<Scalars['String']>;
  createdAt_gt: Maybe<Scalars['String']>;
  createdAt_lt: Maybe<Scalars['String']>;
  createdAt_gte: Maybe<Scalars['String']>;
  createdAt_lte: Maybe<Scalars['String']>;
  createdAt_in: Maybe<Array<Scalars['String']>>;
  createdAt_not_in: Maybe<Array<Scalars['String']>>;
  createdAt_contains: Maybe<Scalars['String']>;
  createdAt_not_contains: Maybe<Scalars['String']>;
  createdAt_starts_with: Maybe<Scalars['String']>;
  createdAt_not_starts_with: Maybe<Scalars['String']>;
  createdAt_ends_with: Maybe<Scalars['String']>;
  createdAt_not_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
  lastUpdatedAt_not: Maybe<Scalars['String']>;
  lastUpdatedAt_gt: Maybe<Scalars['String']>;
  lastUpdatedAt_lt: Maybe<Scalars['String']>;
  lastUpdatedAt_gte: Maybe<Scalars['String']>;
  lastUpdatedAt_lte: Maybe<Scalars['String']>;
  lastUpdatedAt_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_not_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: Maybe<Scalars['String']>;
};

export enum RecipientRegistry_OrderBy {
  Id = 'id',
  FundingRoundFactory = 'fundingRoundFactory',
  BaseDeposit = 'baseDeposit',
  ChallengePeriodDuration = 'challengePeriodDuration',
  Controller = 'controller',
  MaxRecipients = 'maxRecipients',
  Owner = 'owner',
  Recipients = 'recipients',
  CreatedAt = 'createdAt',
  LastUpdatedAt = 'lastUpdatedAt'
}

export type Recipient_Filter = {
  id: Maybe<Scalars['ID']>;
  id_not: Maybe<Scalars['ID']>;
  id_gt: Maybe<Scalars['ID']>;
  id_lt: Maybe<Scalars['ID']>;
  id_gte: Maybe<Scalars['ID']>;
  id_lte: Maybe<Scalars['ID']>;
  id_in: Maybe<Array<Scalars['ID']>>;
  id_not_in: Maybe<Array<Scalars['ID']>>;
  recipientRegistry: Maybe<Scalars['String']>;
  recipientRegistry_not: Maybe<Scalars['String']>;
  recipientRegistry_gt: Maybe<Scalars['String']>;
  recipientRegistry_lt: Maybe<Scalars['String']>;
  recipientRegistry_gte: Maybe<Scalars['String']>;
  recipientRegistry_lte: Maybe<Scalars['String']>;
  recipientRegistry_in: Maybe<Array<Scalars['String']>>;
  recipientRegistry_not_in: Maybe<Array<Scalars['String']>>;
  recipientRegistry_contains: Maybe<Scalars['String']>;
  recipientRegistry_not_contains: Maybe<Scalars['String']>;
  recipientRegistry_starts_with: Maybe<Scalars['String']>;
  recipientRegistry_not_starts_with: Maybe<Scalars['String']>;
  recipientRegistry_ends_with: Maybe<Scalars['String']>;
  recipientRegistry_not_ends_with: Maybe<Scalars['String']>;
  recipientIndex: Maybe<Scalars['BigInt']>;
  recipientIndex_not: Maybe<Scalars['BigInt']>;
  recipientIndex_gt: Maybe<Scalars['BigInt']>;
  recipientIndex_lt: Maybe<Scalars['BigInt']>;
  recipientIndex_gte: Maybe<Scalars['BigInt']>;
  recipientIndex_lte: Maybe<Scalars['BigInt']>;
  recipientIndex_in: Maybe<Array<Scalars['BigInt']>>;
  recipientIndex_not_in: Maybe<Array<Scalars['BigInt']>>;
  requestType: Maybe<Scalars['String']>;
  requestType_not: Maybe<Scalars['String']>;
  requestType_gt: Maybe<Scalars['String']>;
  requestType_lt: Maybe<Scalars['String']>;
  requestType_gte: Maybe<Scalars['String']>;
  requestType_lte: Maybe<Scalars['String']>;
  requestType_in: Maybe<Array<Scalars['String']>>;
  requestType_not_in: Maybe<Array<Scalars['String']>>;
  requestType_contains: Maybe<Scalars['String']>;
  requestType_not_contains: Maybe<Scalars['String']>;
  requestType_starts_with: Maybe<Scalars['String']>;
  requestType_not_starts_with: Maybe<Scalars['String']>;
  requestType_ends_with: Maybe<Scalars['String']>;
  requestType_not_ends_with: Maybe<Scalars['String']>;
  requester: Maybe<Scalars['String']>;
  requester_not: Maybe<Scalars['String']>;
  requester_gt: Maybe<Scalars['String']>;
  requester_lt: Maybe<Scalars['String']>;
  requester_gte: Maybe<Scalars['String']>;
  requester_lte: Maybe<Scalars['String']>;
  requester_in: Maybe<Array<Scalars['String']>>;
  requester_not_in: Maybe<Array<Scalars['String']>>;
  requester_contains: Maybe<Scalars['String']>;
  requester_not_contains: Maybe<Scalars['String']>;
  requester_starts_with: Maybe<Scalars['String']>;
  requester_not_starts_with: Maybe<Scalars['String']>;
  requester_ends_with: Maybe<Scalars['String']>;
  requester_not_ends_with: Maybe<Scalars['String']>;
  submissionTime: Maybe<Scalars['String']>;
  submissionTime_not: Maybe<Scalars['String']>;
  submissionTime_gt: Maybe<Scalars['String']>;
  submissionTime_lt: Maybe<Scalars['String']>;
  submissionTime_gte: Maybe<Scalars['String']>;
  submissionTime_lte: Maybe<Scalars['String']>;
  submissionTime_in: Maybe<Array<Scalars['String']>>;
  submissionTime_not_in: Maybe<Array<Scalars['String']>>;
  submissionTime_contains: Maybe<Scalars['String']>;
  submissionTime_not_contains: Maybe<Scalars['String']>;
  submissionTime_starts_with: Maybe<Scalars['String']>;
  submissionTime_not_starts_with: Maybe<Scalars['String']>;
  submissionTime_ends_with: Maybe<Scalars['String']>;
  submissionTime_not_ends_with: Maybe<Scalars['String']>;
  deposit: Maybe<Scalars['BigInt']>;
  deposit_not: Maybe<Scalars['BigInt']>;
  deposit_gt: Maybe<Scalars['BigInt']>;
  deposit_lt: Maybe<Scalars['BigInt']>;
  deposit_gte: Maybe<Scalars['BigInt']>;
  deposit_lte: Maybe<Scalars['BigInt']>;
  deposit_in: Maybe<Array<Scalars['BigInt']>>;
  deposit_not_in: Maybe<Array<Scalars['BigInt']>>;
  recipientAddress: Maybe<Scalars['Bytes']>;
  recipientAddress_not: Maybe<Scalars['Bytes']>;
  recipientAddress_in: Maybe<Array<Scalars['Bytes']>>;
  recipientAddress_not_in: Maybe<Array<Scalars['Bytes']>>;
  recipientAddress_contains: Maybe<Scalars['Bytes']>;
  recipientAddress_not_contains: Maybe<Scalars['Bytes']>;
  recipientMetadata: Maybe<Scalars['String']>;
  recipientMetadata_not: Maybe<Scalars['String']>;
  recipientMetadata_gt: Maybe<Scalars['String']>;
  recipientMetadata_lt: Maybe<Scalars['String']>;
  recipientMetadata_gte: Maybe<Scalars['String']>;
  recipientMetadata_lte: Maybe<Scalars['String']>;
  recipientMetadata_in: Maybe<Array<Scalars['String']>>;
  recipientMetadata_not_in: Maybe<Array<Scalars['String']>>;
  recipientMetadata_contains: Maybe<Scalars['String']>;
  recipientMetadata_not_contains: Maybe<Scalars['String']>;
  recipientMetadata_starts_with: Maybe<Scalars['String']>;
  recipientMetadata_not_starts_with: Maybe<Scalars['String']>;
  recipientMetadata_ends_with: Maybe<Scalars['String']>;
  recipientMetadata_not_ends_with: Maybe<Scalars['String']>;
  rejected: Maybe<Scalars['Boolean']>;
  rejected_not: Maybe<Scalars['Boolean']>;
  rejected_in: Maybe<Array<Scalars['Boolean']>>;
  rejected_not_in: Maybe<Array<Scalars['Boolean']>>;
  verified: Maybe<Scalars['Boolean']>;
  verified_not: Maybe<Scalars['Boolean']>;
  verified_in: Maybe<Array<Scalars['Boolean']>>;
  verified_not_in: Maybe<Array<Scalars['Boolean']>>;
  voteOptionIndex: Maybe<Scalars['BigInt']>;
  voteOptionIndex_not: Maybe<Scalars['BigInt']>;
  voteOptionIndex_gt: Maybe<Scalars['BigInt']>;
  voteOptionIndex_lt: Maybe<Scalars['BigInt']>;
  voteOptionIndex_gte: Maybe<Scalars['BigInt']>;
  voteOptionIndex_lte: Maybe<Scalars['BigInt']>;
  voteOptionIndex_in: Maybe<Array<Scalars['BigInt']>>;
  voteOptionIndex_not_in: Maybe<Array<Scalars['BigInt']>>;
  requestResolvedHash: Maybe<Scalars['Bytes']>;
  requestResolvedHash_not: Maybe<Scalars['Bytes']>;
  requestResolvedHash_in: Maybe<Array<Scalars['Bytes']>>;
  requestResolvedHash_not_in: Maybe<Array<Scalars['Bytes']>>;
  requestResolvedHash_contains: Maybe<Scalars['Bytes']>;
  requestResolvedHash_not_contains: Maybe<Scalars['Bytes']>;
  requestSubmittedHash: Maybe<Scalars['Bytes']>;
  requestSubmittedHash_not: Maybe<Scalars['Bytes']>;
  requestSubmittedHash_in: Maybe<Array<Scalars['Bytes']>>;
  requestSubmittedHash_not_in: Maybe<Array<Scalars['Bytes']>>;
  requestSubmittedHash_contains: Maybe<Scalars['Bytes']>;
  requestSubmittedHash_not_contains: Maybe<Scalars['Bytes']>;
  fundingRounds: Maybe<Array<Scalars['String']>>;
  fundingRounds_not: Maybe<Array<Scalars['String']>>;
  fundingRounds_contains: Maybe<Array<Scalars['String']>>;
  fundingRounds_not_contains: Maybe<Array<Scalars['String']>>;
  createdAt: Maybe<Scalars['String']>;
  createdAt_not: Maybe<Scalars['String']>;
  createdAt_gt: Maybe<Scalars['String']>;
  createdAt_lt: Maybe<Scalars['String']>;
  createdAt_gte: Maybe<Scalars['String']>;
  createdAt_lte: Maybe<Scalars['String']>;
  createdAt_in: Maybe<Array<Scalars['String']>>;
  createdAt_not_in: Maybe<Array<Scalars['String']>>;
  createdAt_contains: Maybe<Scalars['String']>;
  createdAt_not_contains: Maybe<Scalars['String']>;
  createdAt_starts_with: Maybe<Scalars['String']>;
  createdAt_not_starts_with: Maybe<Scalars['String']>;
  createdAt_ends_with: Maybe<Scalars['String']>;
  createdAt_not_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
  lastUpdatedAt_not: Maybe<Scalars['String']>;
  lastUpdatedAt_gt: Maybe<Scalars['String']>;
  lastUpdatedAt_lt: Maybe<Scalars['String']>;
  lastUpdatedAt_gte: Maybe<Scalars['String']>;
  lastUpdatedAt_lte: Maybe<Scalars['String']>;
  lastUpdatedAt_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_not_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: Maybe<Scalars['String']>;
};

export enum Recipient_OrderBy {
  Id = 'id',
  RecipientRegistry = 'recipientRegistry',
  RecipientIndex = 'recipientIndex',
  RequestType = 'requestType',
  Requester = 'requester',
  SubmissionTime = 'submissionTime',
  Deposit = 'deposit',
  RecipientAddress = 'recipientAddress',
  RecipientMetadata = 'recipientMetadata',
  Rejected = 'rejected',
  Verified = 'verified',
  VoteOptionIndex = 'voteOptionIndex',
  RequestResolvedHash = 'requestResolvedHash',
  RequestSubmittedHash = 'requestSubmittedHash',
  FundingRounds = 'fundingRounds',
  Donations = 'donations',
  CreatedAt = 'createdAt',
  LastUpdatedAt = 'lastUpdatedAt'
}

export type Subscription = {
  __typename?: 'Subscription';
  fundingRoundFactory: Maybe<FundingRoundFactory>;
  fundingRoundFactories: Array<FundingRoundFactory>;
  fundingRound: Maybe<FundingRound>;
  fundingRounds: Array<FundingRound>;
  recipientRegistry: Maybe<RecipientRegistry>;
  recipientRegistries: Array<RecipientRegistry>;
  recipient: Maybe<Recipient>;
  recipients: Array<Recipient>;
  contributorRegistry: Maybe<ContributorRegistry>;
  contributorRegistries: Array<ContributorRegistry>;
  contributor: Maybe<Contributor>;
  contributors: Array<Contributor>;
  coordinator: Maybe<Coordinator>;
  coordinators: Array<Coordinator>;
  contribution: Maybe<Contribution>;
  contributions: Array<Contribution>;
  vote: Maybe<Vote>;
  votes: Array<Vote>;
  donation: Maybe<Donation>;
  donations: Array<Donation>;
  token: Maybe<Token>;
  tokens: Array<Token>;
  /** Access to subgraph metadata */
  _meta: Maybe<_Meta_>;
};


export type SubscriptionFundingRoundFactoryArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type SubscriptionFundingRoundFactoriesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<FundingRoundFactory_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<FundingRoundFactory_Filter>;
  block: Maybe<Block_Height>;
};


export type SubscriptionFundingRoundArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type SubscriptionFundingRoundsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<FundingRound_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<FundingRound_Filter>;
  block: Maybe<Block_Height>;
};


export type SubscriptionRecipientRegistryArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type SubscriptionRecipientRegistriesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<RecipientRegistry_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<RecipientRegistry_Filter>;
  block: Maybe<Block_Height>;
};


export type SubscriptionRecipientArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type SubscriptionRecipientsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Recipient_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Recipient_Filter>;
  block: Maybe<Block_Height>;
};


export type SubscriptionContributorRegistryArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type SubscriptionContributorRegistriesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<ContributorRegistry_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<ContributorRegistry_Filter>;
  block: Maybe<Block_Height>;
};


export type SubscriptionContributorArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type SubscriptionContributorsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Contributor_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Contributor_Filter>;
  block: Maybe<Block_Height>;
};


export type SubscriptionCoordinatorArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type SubscriptionCoordinatorsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Coordinator_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Coordinator_Filter>;
  block: Maybe<Block_Height>;
};


export type SubscriptionContributionArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type SubscriptionContributionsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Contribution_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Contribution_Filter>;
  block: Maybe<Block_Height>;
};


export type SubscriptionVoteArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type SubscriptionVotesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Vote_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Vote_Filter>;
  block: Maybe<Block_Height>;
};


export type SubscriptionDonationArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type SubscriptionDonationsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Donation_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Donation_Filter>;
  block: Maybe<Block_Height>;
};


export type SubscriptionTokenArgs = {
  id: Scalars['ID'];
  block: Maybe<Block_Height>;
};


export type SubscriptionTokensArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy: Maybe<Token_OrderBy>;
  orderDirection: Maybe<OrderDirection>;
  where: Maybe<Token_Filter>;
  block: Maybe<Block_Height>;
};


export type Subscription_MetaArgs = {
  block: Maybe<Block_Height>;
};

export type Token = {
  __typename?: 'Token';
  id: Scalars['ID'];
  tokenAddress: Maybe<Scalars['Bytes']>;
  symbol: Maybe<Scalars['String']>;
  decimals: Maybe<Scalars['BigInt']>;
  createdAt: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
};

export type Token_Filter = {
  id: Maybe<Scalars['ID']>;
  id_not: Maybe<Scalars['ID']>;
  id_gt: Maybe<Scalars['ID']>;
  id_lt: Maybe<Scalars['ID']>;
  id_gte: Maybe<Scalars['ID']>;
  id_lte: Maybe<Scalars['ID']>;
  id_in: Maybe<Array<Scalars['ID']>>;
  id_not_in: Maybe<Array<Scalars['ID']>>;
  tokenAddress: Maybe<Scalars['Bytes']>;
  tokenAddress_not: Maybe<Scalars['Bytes']>;
  tokenAddress_in: Maybe<Array<Scalars['Bytes']>>;
  tokenAddress_not_in: Maybe<Array<Scalars['Bytes']>>;
  tokenAddress_contains: Maybe<Scalars['Bytes']>;
  tokenAddress_not_contains: Maybe<Scalars['Bytes']>;
  symbol: Maybe<Scalars['String']>;
  symbol_not: Maybe<Scalars['String']>;
  symbol_gt: Maybe<Scalars['String']>;
  symbol_lt: Maybe<Scalars['String']>;
  symbol_gte: Maybe<Scalars['String']>;
  symbol_lte: Maybe<Scalars['String']>;
  symbol_in: Maybe<Array<Scalars['String']>>;
  symbol_not_in: Maybe<Array<Scalars['String']>>;
  symbol_contains: Maybe<Scalars['String']>;
  symbol_not_contains: Maybe<Scalars['String']>;
  symbol_starts_with: Maybe<Scalars['String']>;
  symbol_not_starts_with: Maybe<Scalars['String']>;
  symbol_ends_with: Maybe<Scalars['String']>;
  symbol_not_ends_with: Maybe<Scalars['String']>;
  decimals: Maybe<Scalars['BigInt']>;
  decimals_not: Maybe<Scalars['BigInt']>;
  decimals_gt: Maybe<Scalars['BigInt']>;
  decimals_lt: Maybe<Scalars['BigInt']>;
  decimals_gte: Maybe<Scalars['BigInt']>;
  decimals_lte: Maybe<Scalars['BigInt']>;
  decimals_in: Maybe<Array<Scalars['BigInt']>>;
  decimals_not_in: Maybe<Array<Scalars['BigInt']>>;
  createdAt: Maybe<Scalars['String']>;
  createdAt_not: Maybe<Scalars['String']>;
  createdAt_gt: Maybe<Scalars['String']>;
  createdAt_lt: Maybe<Scalars['String']>;
  createdAt_gte: Maybe<Scalars['String']>;
  createdAt_lte: Maybe<Scalars['String']>;
  createdAt_in: Maybe<Array<Scalars['String']>>;
  createdAt_not_in: Maybe<Array<Scalars['String']>>;
  createdAt_contains: Maybe<Scalars['String']>;
  createdAt_not_contains: Maybe<Scalars['String']>;
  createdAt_starts_with: Maybe<Scalars['String']>;
  createdAt_not_starts_with: Maybe<Scalars['String']>;
  createdAt_ends_with: Maybe<Scalars['String']>;
  createdAt_not_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt: Maybe<Scalars['String']>;
  lastUpdatedAt_not: Maybe<Scalars['String']>;
  lastUpdatedAt_gt: Maybe<Scalars['String']>;
  lastUpdatedAt_lt: Maybe<Scalars['String']>;
  lastUpdatedAt_gte: Maybe<Scalars['String']>;
  lastUpdatedAt_lte: Maybe<Scalars['String']>;
  lastUpdatedAt_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_not_in: Maybe<Array<Scalars['String']>>;
  lastUpdatedAt_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_not_contains: Maybe<Scalars['String']>;
  lastUpdatedAt_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_starts_with: Maybe<Scalars['String']>;
  lastUpdatedAt_ends_with: Maybe<Scalars['String']>;
  lastUpdatedAt_not_ends_with: Maybe<Scalars['String']>;
};

export enum Token_OrderBy {
  Id = 'id',
  TokenAddress = 'tokenAddress',
  Symbol = 'symbol',
  Decimals = 'decimals',
  CreatedAt = 'createdAt',
  LastUpdatedAt = 'lastUpdatedAt'
}

export type Vote = {
  __typename?: 'Vote';
  id: Scalars['ID'];
  contributor: Maybe<Contributor>;
  fundingRound: Maybe<FundingRound>;
  voterAddress: Maybe<Scalars['Bytes']>;
  secret: Maybe<Scalars['Boolean']>;
};

export type Vote_Filter = {
  id: Maybe<Scalars['ID']>;
  id_not: Maybe<Scalars['ID']>;
  id_gt: Maybe<Scalars['ID']>;
  id_lt: Maybe<Scalars['ID']>;
  id_gte: Maybe<Scalars['ID']>;
  id_lte: Maybe<Scalars['ID']>;
  id_in: Maybe<Array<Scalars['ID']>>;
  id_not_in: Maybe<Array<Scalars['ID']>>;
  contributor: Maybe<Scalars['String']>;
  contributor_not: Maybe<Scalars['String']>;
  contributor_gt: Maybe<Scalars['String']>;
  contributor_lt: Maybe<Scalars['String']>;
  contributor_gte: Maybe<Scalars['String']>;
  contributor_lte: Maybe<Scalars['String']>;
  contributor_in: Maybe<Array<Scalars['String']>>;
  contributor_not_in: Maybe<Array<Scalars['String']>>;
  contributor_contains: Maybe<Scalars['String']>;
  contributor_not_contains: Maybe<Scalars['String']>;
  contributor_starts_with: Maybe<Scalars['String']>;
  contributor_not_starts_with: Maybe<Scalars['String']>;
  contributor_ends_with: Maybe<Scalars['String']>;
  contributor_not_ends_with: Maybe<Scalars['String']>;
  fundingRound: Maybe<Scalars['String']>;
  fundingRound_not: Maybe<Scalars['String']>;
  fundingRound_gt: Maybe<Scalars['String']>;
  fundingRound_lt: Maybe<Scalars['String']>;
  fundingRound_gte: Maybe<Scalars['String']>;
  fundingRound_lte: Maybe<Scalars['String']>;
  fundingRound_in: Maybe<Array<Scalars['String']>>;
  fundingRound_not_in: Maybe<Array<Scalars['String']>>;
  fundingRound_contains: Maybe<Scalars['String']>;
  fundingRound_not_contains: Maybe<Scalars['String']>;
  fundingRound_starts_with: Maybe<Scalars['String']>;
  fundingRound_not_starts_with: Maybe<Scalars['String']>;
  fundingRound_ends_with: Maybe<Scalars['String']>;
  fundingRound_not_ends_with: Maybe<Scalars['String']>;
  voterAddress: Maybe<Scalars['Bytes']>;
  voterAddress_not: Maybe<Scalars['Bytes']>;
  voterAddress_in: Maybe<Array<Scalars['Bytes']>>;
  voterAddress_not_in: Maybe<Array<Scalars['Bytes']>>;
  voterAddress_contains: Maybe<Scalars['Bytes']>;
  voterAddress_not_contains: Maybe<Scalars['Bytes']>;
  secret: Maybe<Scalars['Boolean']>;
  secret_not: Maybe<Scalars['Boolean']>;
  secret_in: Maybe<Array<Scalars['Boolean']>>;
  secret_not_in: Maybe<Array<Scalars['Boolean']>>;
};

export enum Vote_OrderBy {
  Id = 'id',
  Contributor = 'contributor',
  FundingRound = 'fundingRound',
  VoterAddress = 'voterAddress',
  Secret = 'secret'
}

export type _Block_ = {
  __typename?: '_Block_';
  /** The hash of the block */
  hash: Maybe<Scalars['Bytes']>;
  /** The block number */
  number: Scalars['Int'];
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


export type GetContributionsAmountQuery = { __typename?: 'Query', fundingRound: Maybe<{ __typename?: 'FundingRound', contributors: Maybe<Array<{ __typename?: 'Contributor', contributions: Maybe<Array<{ __typename?: 'Contribution', amount: Maybe<any> }>> }>> }> };

export type GetContributorVotesQueryVariables = Exact<{
  fundingRoundAddress: Scalars['ID'];
  contributorAddress: Scalars['ID'];
}>;


export type GetContributorVotesQuery = { __typename?: 'Query', fundingRound: Maybe<{ __typename?: 'FundingRound', id: string, contributors: Maybe<Array<{ __typename?: 'Contributor', votes: Maybe<Array<{ __typename?: 'Vote', id: string }>> }>> }> };

export type GetProjectQueryVariables = Exact<{
  registryAddress: Scalars['ID'];
  recipientId: Scalars['ID'];
}>;


export type GetProjectQuery = { __typename?: 'Query', recipientRegistry: Maybe<{ __typename?: 'RecipientRegistry', recipients: Maybe<Array<{ __typename?: 'Recipient', id: string, requestType: Maybe<string>, recipientAddress: Maybe<any>, recipientMetadata: Maybe<string>, recipientIndex: Maybe<any>, submissionTime: Maybe<string>, rejected: Maybe<boolean>, verified: Maybe<boolean> }>> }> };

export type GetRecipientQueryVariables = Exact<{
  registryAddress: Scalars['ID'];
  recipientId: Scalars['ID'];
}>;


export type GetRecipientQuery = { __typename?: 'Query', recipientRegistry: Maybe<{ __typename?: 'RecipientRegistry', recipients: Maybe<Array<{ __typename?: 'Recipient', id: string, requestType: Maybe<string>, recipientAddress: Maybe<any>, recipientMetadata: Maybe<string>, submissionTime: Maybe<string>, rejected: Maybe<boolean>, verified: Maybe<boolean> }>> }> };

export type GetRecipientDonationsQueryVariables = Exact<{
  fundingRoundAddress: Scalars['ID'];
  recipientAddress: Scalars['ID'];
}>;


export type GetRecipientDonationsQuery = { __typename?: 'Query', fundingRound: Maybe<{ __typename?: 'FundingRound', recipientRegistry: Maybe<{ __typename?: 'RecipientRegistry', recipients: Maybe<Array<{ __typename?: 'Recipient', donations: Maybe<Array<{ __typename?: 'Donation', id: string }>> }>> }> }> };

export type GetRecipientsQueryVariables = Exact<{
  registryAddress: Scalars['ID'];
}>;


export type GetRecipientsQuery = { __typename?: 'Query', recipientRegistry: Maybe<{ __typename?: 'RecipientRegistry', recipients: Maybe<Array<{ __typename?: 'Recipient', id: string, requestType: Maybe<string>, requester: Maybe<string>, recipientAddress: Maybe<any>, recipientMetadata: Maybe<string>, requestSubmittedHash: Maybe<any>, requestResolvedHash: Maybe<any>, submissionTime: Maybe<string>, rejected: Maybe<boolean>, verified: Maybe<boolean> }>> }> };

export type GetRoundsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRoundsQuery = { __typename?: 'Query', fundingRounds: Array<{ __typename?: 'FundingRound', id: string }> };

export type GetTotalContributedQueryVariables = Exact<{
  fundingRoundAddress: Scalars['ID'];
}>;


export type GetTotalContributedQuery = { __typename?: 'Query', fundingRound: Maybe<{ __typename?: 'FundingRound', contributorCount: any, contributors: Maybe<Array<{ __typename?: 'Contributor', contributions: Maybe<Array<{ __typename?: 'Contribution', amount: Maybe<any> }>> }>> }> };


export const GetContributionsAmountDocument = gql`
    query GetContributionsAmount($fundingRoundAddress: ID!, $contributorAddress: ID!) {
  fundingRound(id: $fundingRoundAddress) {
    contributors(where: {id: $contributorAddress}) {
      contributions {
        amount
      }
    }
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
export const GetProjectDocument = gql`
    query GetProject($registryAddress: ID!, $recipientId: ID!) {
  recipientRegistry(id: $registryAddress) {
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
export const GetRecipientDonationsDocument = gql`
    query GetRecipientDonations($fundingRoundAddress: ID!, $recipientAddress: ID!) {
  fundingRound(id: $fundingRoundAddress) {
    recipientRegistry {
      recipients(where: {id: $recipientAddress}) {
        donations {
          id
        }
      }
    }
  }
}
    `;
export const GetRecipientsDocument = gql`
    query GetRecipients($registryAddress: ID!) {
  recipientRegistry(id: $registryAddress) {
    recipients {
      id
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
}
    `;
export const GetRoundsDocument = gql`
    query GetRounds {
  fundingRounds {
    id
  }
}
    `;
export const GetTotalContributedDocument = gql`
    query GetTotalContributed($fundingRoundAddress: ID!) {
  fundingRound(id: $fundingRoundAddress) {
    contributorCount
    contributors {
      contributions {
        amount
      }
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    GetContributionsAmount(variables: GetContributionsAmountQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetContributionsAmountQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetContributionsAmountQuery>(GetContributionsAmountDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetContributionsAmount');
    },
    GetContributorVotes(variables: GetContributorVotesQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetContributorVotesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetContributorVotesQuery>(GetContributorVotesDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetContributorVotes');
    },
    GetProject(variables: GetProjectQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetProjectQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetProjectQuery>(GetProjectDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetProject');
    },
    GetRecipient(variables: GetRecipientQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRecipientQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRecipientQuery>(GetRecipientDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRecipient');
    },
    GetRecipientDonations(variables: GetRecipientDonationsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRecipientDonationsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRecipientDonationsQuery>(GetRecipientDonationsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRecipientDonations');
    },
    GetRecipients(variables: GetRecipientsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRecipientsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRecipientsQuery>(GetRecipientsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRecipients');
    },
    GetRounds(variables?: GetRoundsQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetRoundsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRoundsQuery>(GetRoundsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRounds');
    },
    GetTotalContributed(variables: GetTotalContributedQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GetTotalContributedQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetTotalContributedQuery>(GetTotalContributedDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetTotalContributed');
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;