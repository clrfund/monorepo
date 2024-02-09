// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class MaciDeployed extends ethereum.Event {
  get params(): MaciDeployed__Params {
    return new MaciDeployed__Params(this);
  }
}

export class MaciDeployed__Params {
  _event: MaciDeployed;

  constructor(event: MaciDeployed) {
    this._event = event;
  }

  get _maci(): Address {
    return this._event.parameters[0].value.toAddress();
  }
}

export class MaciParametersChanged extends ethereum.Event {
  get params(): MaciParametersChanged__Params {
    return new MaciParametersChanged__Params(this);
  }
}

export class MaciParametersChanged__Params {
  _event: MaciParametersChanged;

  constructor(event: MaciParametersChanged) {
    this._event = event;
  }
}

export class OwnershipTransferred extends ethereum.Event {
  get params(): OwnershipTransferred__Params {
    return new OwnershipTransferred__Params(this);
  }
}

export class OwnershipTransferred__Params {
  _event: OwnershipTransferred;

  constructor(event: OwnershipTransferred) {
    this._event = event;
  }

  get previousOwner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get newOwner(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class MACIFactory__deployMaciResult_pollContractsStruct extends ethereum.Tuple {
  get poll(): Address {
    return this[0].toAddress();
  }

  get messageProcessor(): Address {
    return this[1].toAddress();
  }

  get tally(): Address {
    return this[2].toAddress();
  }

  get subsidy(): Address {
    return this[3].toAddress();
  }
}

export class MACIFactory__deployMaciResult {
  value0: Address;
  value1: MACIFactory__deployMaciResult_pollContractsStruct;

  constructor(
    value0: Address,
    value1: MACIFactory__deployMaciResult_pollContractsStruct
  ) {
    this.value0 = value0;
    this.value1 = value1;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromAddress(this.value0));
    map.set("value1", ethereum.Value.fromTuple(this.value1));
    return map;
  }

  get_maci(): Address {
    return this.value0;
  }

  get_pollContracts(): MACIFactory__deployMaciResult_pollContractsStruct {
    return this.value1;
  }
}

export class MACIFactory__deployMaciInputCoordinatorPubKeyStruct extends ethereum.Tuple {
  get x(): BigInt {
    return this[0].toBigInt();
  }

  get y(): BigInt {
    return this[1].toBigInt();
  }
}

export class MACIFactory__factoriesResult {
  value0: Address;
  value1: Address;
  value2: Address;
  value3: Address;

  constructor(
    value0: Address,
    value1: Address,
    value2: Address,
    value3: Address
  ) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromAddress(this.value0));
    map.set("value1", ethereum.Value.fromAddress(this.value1));
    map.set("value2", ethereum.Value.fromAddress(this.value2));
    map.set("value3", ethereum.Value.fromAddress(this.value3));
    return map;
  }

  getPollFactory(): Address {
    return this.value0;
  }

  getTallyFactory(): Address {
    return this.value1;
  }

  getSubsidyFactory(): Address {
    return this.value2;
  }

  getMessageProcessorFactory(): Address {
    return this.value3;
  }
}

export class MACIFactory__treeDepthsResult {
  value0: i32;
  value1: i32;
  value2: i32;
  value3: i32;

  constructor(value0: i32, value1: i32, value2: i32, value3: i32) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set(
      "value0",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(this.value0))
    );
    map.set(
      "value1",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(this.value1))
    );
    map.set(
      "value2",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(this.value2))
    );
    map.set(
      "value3",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(this.value3))
    );
    return map;
  }

  getIntStateTreeDepth(): i32 {
    return this.value0;
  }

  getMessageTreeSubDepth(): i32 {
    return this.value1;
  }

  getMessageTreeDepth(): i32 {
    return this.value2;
  }

  getVoteOptionTreeDepth(): i32 {
    return this.value3;
  }
}

export class MACIFactory extends ethereum.SmartContract {
  static bind(address: Address): MACIFactory {
    return new MACIFactory("MACIFactory", address);
  }

  MESSAGE_DATA_LENGTH(): i32 {
    let result = super.call(
      "MESSAGE_DATA_LENGTH",
      "MESSAGE_DATA_LENGTH():(uint8)",
      []
    );

    return result[0].toI32();
  }

  try_MESSAGE_DATA_LENGTH(): ethereum.CallResult<i32> {
    let result = super.tryCall(
      "MESSAGE_DATA_LENGTH",
      "MESSAGE_DATA_LENGTH():(uint8)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toI32());
  }

  TREE_ARITY(): BigInt {
    let result = super.call("TREE_ARITY", "TREE_ARITY():(uint256)", []);

    return result[0].toBigInt();
  }

  try_TREE_ARITY(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("TREE_ARITY", "TREE_ARITY():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  deployMaci(
    signUpGatekeeper: Address,
    initialVoiceCreditProxy: Address,
    topupCredit: Address,
    duration: BigInt,
    coordinator: Address,
    coordinatorPubKey: MACIFactory__deployMaciInputCoordinatorPubKeyStruct,
    maciOwner: Address
  ): MACIFactory__deployMaciResult {
    let result = super.call(
      "deployMaci",
      "deployMaci(address,address,address,uint256,address,(uint256,uint256),address):(address,(address,address,address,address))",
      [
        ethereum.Value.fromAddress(signUpGatekeeper),
        ethereum.Value.fromAddress(initialVoiceCreditProxy),
        ethereum.Value.fromAddress(topupCredit),
        ethereum.Value.fromUnsignedBigInt(duration),
        ethereum.Value.fromAddress(coordinator),
        ethereum.Value.fromTuple(coordinatorPubKey),
        ethereum.Value.fromAddress(maciOwner)
      ]
    );

    return new MACIFactory__deployMaciResult(
      result[0].toAddress(),
      changetype<MACIFactory__deployMaciResult_pollContractsStruct>(
        result[1].toTuple()
      )
    );
  }

  try_deployMaci(
    signUpGatekeeper: Address,
    initialVoiceCreditProxy: Address,
    topupCredit: Address,
    duration: BigInt,
    coordinator: Address,
    coordinatorPubKey: MACIFactory__deployMaciInputCoordinatorPubKeyStruct,
    maciOwner: Address
  ): ethereum.CallResult<MACIFactory__deployMaciResult> {
    let result = super.tryCall(
      "deployMaci",
      "deployMaci(address,address,address,uint256,address,(uint256,uint256),address):(address,(address,address,address,address))",
      [
        ethereum.Value.fromAddress(signUpGatekeeper),
        ethereum.Value.fromAddress(initialVoiceCreditProxy),
        ethereum.Value.fromAddress(topupCredit),
        ethereum.Value.fromUnsignedBigInt(duration),
        ethereum.Value.fromAddress(coordinator),
        ethereum.Value.fromTuple(coordinatorPubKey),
        ethereum.Value.fromAddress(maciOwner)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new MACIFactory__deployMaciResult(
        value[0].toAddress(),
        changetype<MACIFactory__deployMaciResult_pollContractsStruct>(
          value[1].toTuple()
        )
      )
    );
  }

  factories(): MACIFactory__factoriesResult {
    let result = super.call(
      "factories",
      "factories():(address,address,address,address)",
      []
    );

    return new MACIFactory__factoriesResult(
      result[0].toAddress(),
      result[1].toAddress(),
      result[2].toAddress(),
      result[3].toAddress()
    );
  }

  try_factories(): ethereum.CallResult<MACIFactory__factoriesResult> {
    let result = super.tryCall(
      "factories",
      "factories():(address,address,address,address)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new MACIFactory__factoriesResult(
        value[0].toAddress(),
        value[1].toAddress(),
        value[2].toAddress(),
        value[3].toAddress()
      )
    );
  }

  getMessageBatchSize(messageTreeSubDepth: i32): BigInt {
    let result = super.call(
      "getMessageBatchSize",
      "getMessageBatchSize(uint8):(uint256)",
      [ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(messageTreeSubDepth))]
    );

    return result[0].toBigInt();
  }

  try_getMessageBatchSize(
    messageTreeSubDepth: i32
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getMessageBatchSize",
      "getMessageBatchSize(uint8):(uint256)",
      [ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(messageTreeSubDepth))]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  owner(): Address {
    let result = super.call("owner", "owner():(address)", []);

    return result[0].toAddress();
  }

  try_owner(): ethereum.CallResult<Address> {
    let result = super.tryCall("owner", "owner():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  stateTreeDepth(): i32 {
    let result = super.call("stateTreeDepth", "stateTreeDepth():(uint8)", []);

    return result[0].toI32();
  }

  try_stateTreeDepth(): ethereum.CallResult<i32> {
    let result = super.tryCall(
      "stateTreeDepth",
      "stateTreeDepth():(uint8)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toI32());
  }

  treeDepths(): MACIFactory__treeDepthsResult {
    let result = super.call(
      "treeDepths",
      "treeDepths():(uint8,uint8,uint8,uint8)",
      []
    );

    return new MACIFactory__treeDepthsResult(
      result[0].toI32(),
      result[1].toI32(),
      result[2].toI32(),
      result[3].toI32()
    );
  }

  try_treeDepths(): ethereum.CallResult<MACIFactory__treeDepthsResult> {
    let result = super.tryCall(
      "treeDepths",
      "treeDepths():(uint8,uint8,uint8,uint8)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new MACIFactory__treeDepthsResult(
        value[0].toI32(),
        value[1].toI32(),
        value[2].toI32(),
        value[3].toI32()
      )
    );
  }

  verifier(): Address {
    let result = super.call("verifier", "verifier():(address)", []);

    return result[0].toAddress();
  }

  try_verifier(): ethereum.CallResult<Address> {
    let result = super.tryCall("verifier", "verifier():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  vkRegistry(): Address {
    let result = super.call("vkRegistry", "vkRegistry():(address)", []);

    return result[0].toAddress();
  }

  try_vkRegistry(): ethereum.CallResult<Address> {
    let result = super.tryCall("vkRegistry", "vkRegistry():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }

  get _vkRegistry(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _factories(): ConstructorCall_factoriesStruct {
    return changetype<ConstructorCall_factoriesStruct>(
      this._call.inputValues[1].value.toTuple()
    );
  }

  get _verifier(): Address {
    return this._call.inputValues[2].value.toAddress();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class ConstructorCall_factoriesStruct extends ethereum.Tuple {
  get pollFactory(): Address {
    return this[0].toAddress();
  }

  get tallyFactory(): Address {
    return this[1].toAddress();
  }

  get subsidyFactory(): Address {
    return this[2].toAddress();
  }

  get messageProcessorFactory(): Address {
    return this[3].toAddress();
  }
}

export class DeployMaciCall extends ethereum.Call {
  get inputs(): DeployMaciCall__Inputs {
    return new DeployMaciCall__Inputs(this);
  }

  get outputs(): DeployMaciCall__Outputs {
    return new DeployMaciCall__Outputs(this);
  }
}

export class DeployMaciCall__Inputs {
  _call: DeployMaciCall;

  constructor(call: DeployMaciCall) {
    this._call = call;
  }

  get signUpGatekeeper(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get initialVoiceCreditProxy(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get topupCredit(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get duration(): BigInt {
    return this._call.inputValues[3].value.toBigInt();
  }

  get coordinator(): Address {
    return this._call.inputValues[4].value.toAddress();
  }

  get coordinatorPubKey(): DeployMaciCallCoordinatorPubKeyStruct {
    return changetype<DeployMaciCallCoordinatorPubKeyStruct>(
      this._call.inputValues[5].value.toTuple()
    );
  }

  get maciOwner(): Address {
    return this._call.inputValues[6].value.toAddress();
  }
}

export class DeployMaciCall__Outputs {
  _call: DeployMaciCall;

  constructor(call: DeployMaciCall) {
    this._call = call;
  }

  get _maci(): Address {
    return this._call.outputValues[0].value.toAddress();
  }

  get _pollContracts(): DeployMaciCall_pollContractsStruct {
    return changetype<DeployMaciCall_pollContractsStruct>(
      this._call.outputValues[1].value.toTuple()
    );
  }
}

export class DeployMaciCallCoordinatorPubKeyStruct extends ethereum.Tuple {
  get x(): BigInt {
    return this[0].toBigInt();
  }

  get y(): BigInt {
    return this[1].toBigInt();
  }
}

export class DeployMaciCall_pollContractsStruct extends ethereum.Tuple {
  get poll(): Address {
    return this[0].toAddress();
  }

  get messageProcessor(): Address {
    return this[1].toAddress();
  }

  get tally(): Address {
    return this[2].toAddress();
  }

  get subsidy(): Address {
    return this[3].toAddress();
  }
}

export class RenounceOwnershipCall extends ethereum.Call {
  get inputs(): RenounceOwnershipCall__Inputs {
    return new RenounceOwnershipCall__Inputs(this);
  }

  get outputs(): RenounceOwnershipCall__Outputs {
    return new RenounceOwnershipCall__Outputs(this);
  }
}

export class RenounceOwnershipCall__Inputs {
  _call: RenounceOwnershipCall;

  constructor(call: RenounceOwnershipCall) {
    this._call = call;
  }
}

export class RenounceOwnershipCall__Outputs {
  _call: RenounceOwnershipCall;

  constructor(call: RenounceOwnershipCall) {
    this._call = call;
  }
}

export class SetMaciParametersCall extends ethereum.Call {
  get inputs(): SetMaciParametersCall__Inputs {
    return new SetMaciParametersCall__Inputs(this);
  }

  get outputs(): SetMaciParametersCall__Outputs {
    return new SetMaciParametersCall__Outputs(this);
  }
}

export class SetMaciParametersCall__Inputs {
  _call: SetMaciParametersCall;

  constructor(call: SetMaciParametersCall) {
    this._call = call;
  }

  get _stateTreeDepth(): i32 {
    return this._call.inputValues[0].value.toI32();
  }

  get _treeDepths(): SetMaciParametersCall_treeDepthsStruct {
    return changetype<SetMaciParametersCall_treeDepthsStruct>(
      this._call.inputValues[1].value.toTuple()
    );
  }
}

export class SetMaciParametersCall__Outputs {
  _call: SetMaciParametersCall;

  constructor(call: SetMaciParametersCall) {
    this._call = call;
  }
}

export class SetMaciParametersCall_treeDepthsStruct extends ethereum.Tuple {
  get intStateTreeDepth(): i32 {
    return this[0].toI32();
  }

  get messageTreeSubDepth(): i32 {
    return this[1].toI32();
  }

  get messageTreeDepth(): i32 {
    return this[2].toI32();
  }

  get voteOptionTreeDepth(): i32 {
    return this[3].toI32();
  }
}

export class SetMessageProcessorFactoryCall extends ethereum.Call {
  get inputs(): SetMessageProcessorFactoryCall__Inputs {
    return new SetMessageProcessorFactoryCall__Inputs(this);
  }

  get outputs(): SetMessageProcessorFactoryCall__Outputs {
    return new SetMessageProcessorFactoryCall__Outputs(this);
  }
}

export class SetMessageProcessorFactoryCall__Inputs {
  _call: SetMessageProcessorFactoryCall;

  constructor(call: SetMessageProcessorFactoryCall) {
    this._call = call;
  }

  get _messageProcessorFactory(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetMessageProcessorFactoryCall__Outputs {
  _call: SetMessageProcessorFactoryCall;

  constructor(call: SetMessageProcessorFactoryCall) {
    this._call = call;
  }
}

export class SetPollFactoryCall extends ethereum.Call {
  get inputs(): SetPollFactoryCall__Inputs {
    return new SetPollFactoryCall__Inputs(this);
  }

  get outputs(): SetPollFactoryCall__Outputs {
    return new SetPollFactoryCall__Outputs(this);
  }
}

export class SetPollFactoryCall__Inputs {
  _call: SetPollFactoryCall;

  constructor(call: SetPollFactoryCall) {
    this._call = call;
  }

  get _pollFactory(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetPollFactoryCall__Outputs {
  _call: SetPollFactoryCall;

  constructor(call: SetPollFactoryCall) {
    this._call = call;
  }
}

export class SetTallyFactoryCall extends ethereum.Call {
  get inputs(): SetTallyFactoryCall__Inputs {
    return new SetTallyFactoryCall__Inputs(this);
  }

  get outputs(): SetTallyFactoryCall__Outputs {
    return new SetTallyFactoryCall__Outputs(this);
  }
}

export class SetTallyFactoryCall__Inputs {
  _call: SetTallyFactoryCall;

  constructor(call: SetTallyFactoryCall) {
    this._call = call;
  }

  get _tallyFactory(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetTallyFactoryCall__Outputs {
  _call: SetTallyFactoryCall;

  constructor(call: SetTallyFactoryCall) {
    this._call = call;
  }
}

export class SetVerifierCall extends ethereum.Call {
  get inputs(): SetVerifierCall__Inputs {
    return new SetVerifierCall__Inputs(this);
  }

  get outputs(): SetVerifierCall__Outputs {
    return new SetVerifierCall__Outputs(this);
  }
}

export class SetVerifierCall__Inputs {
  _call: SetVerifierCall;

  constructor(call: SetVerifierCall) {
    this._call = call;
  }

  get _verifier(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetVerifierCall__Outputs {
  _call: SetVerifierCall;

  constructor(call: SetVerifierCall) {
    this._call = call;
  }
}

export class SetVkRegistryCall extends ethereum.Call {
  get inputs(): SetVkRegistryCall__Inputs {
    return new SetVkRegistryCall__Inputs(this);
  }

  get outputs(): SetVkRegistryCall__Outputs {
    return new SetVkRegistryCall__Outputs(this);
  }
}

export class SetVkRegistryCall__Inputs {
  _call: SetVkRegistryCall;

  constructor(call: SetVkRegistryCall) {
    this._call = call;
  }

  get _vkRegistry(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetVkRegistryCall__Outputs {
  _call: SetVkRegistryCall;

  constructor(call: SetVkRegistryCall) {
    this._call = call;
  }
}

export class TransferOwnershipCall extends ethereum.Call {
  get inputs(): TransferOwnershipCall__Inputs {
    return new TransferOwnershipCall__Inputs(this);
  }

  get outputs(): TransferOwnershipCall__Outputs {
    return new TransferOwnershipCall__Outputs(this);
  }
}

export class TransferOwnershipCall__Inputs {
  _call: TransferOwnershipCall;

  constructor(call: TransferOwnershipCall) {
    this._call = call;
  }

  get newOwner(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class TransferOwnershipCall__Outputs {
  _call: TransferOwnershipCall;

  constructor(call: TransferOwnershipCall) {
    this._call = call;
  }
}