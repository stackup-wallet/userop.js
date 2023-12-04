import { BigNumberish, BytesLike, ethers } from "ethers";
import { UserOperationEventEvent } from "./typechain/EntryPoint";

export interface ISateOverrideAccount {
  nonce: BigNumberish;
  code: BytesLike;
  balance: BigNumberish;
  state: Record<string, BytesLike>;
  stateDiff: Record<string, BytesLike>;
}

export type StateOverrideSet = Record<string, Partial<ISateOverrideAccount>>;

export interface IUserOperation {
  sender: string;
  nonce: BigNumberish;
  initCode: BytesLike;
  callData: BytesLike;
  callGasLimit: BigNumberish;
  verificationGasLimit: BigNumberish;
  preVerificationGas: BigNumberish;
  maxFeePerGas: BigNumberish;
  maxPriorityFeePerGas: BigNumberish;
  paymasterAndData: BytesLike;
  signature: BytesLike;
}

export interface IUserOperationBuilder {
  // get methods.
  getSender: () => string;
  getNonce: () => BigNumberish;
  getInitCode: () => BytesLike;
  getCallData: () => BytesLike;
  getCallGasLimit: () => BigNumberish;
  getVerificationGasLimit: () => BigNumberish;
  getPreVerificationGas: () => BigNumberish;
  getMaxFeePerGas: () => BigNumberish;
  getMaxPriorityFeePerGas: () => BigNumberish;
  getPaymasterAndData: () => BytesLike;
  getSignature: () => BytesLike;
  getOp: () => IUserOperation;

  // set methods.
  setSender: (address: string) => IUserOperationBuilder;
  setNonce: (nonce: BigNumberish) => IUserOperationBuilder;
  setInitCode: (code: BytesLike) => IUserOperationBuilder;
  setCallData: (data: BytesLike) => IUserOperationBuilder;
  setCallGasLimit: (gas: BigNumberish) => IUserOperationBuilder;
  setVerificationGasLimit: (gas: BigNumberish) => IUserOperationBuilder;
  setPreVerificationGas: (gas: BigNumberish) => IUserOperationBuilder;
  setMaxFeePerGas: (fee: BigNumberish) => IUserOperationBuilder;
  setMaxPriorityFeePerGas: (fee: BigNumberish) => IUserOperationBuilder;
  setPaymasterAndData: (data: BytesLike) => IUserOperationBuilder;
  setSignature: (bytes: BytesLike) => IUserOperationBuilder;
  setPartial: (partialOp: Partial<IUserOperation>) => IUserOperationBuilder;

  // Sets the default values that won't be wiped on reset.
  useDefaults: (partialOp: Partial<IUserOperation>) => IUserOperationBuilder;
  resetDefaults: () => IUserOperationBuilder;

  // Some fields may require arbitrary logic to build an op.
  // Middleware functions allow you to set custom logic for building op fragments.
  useMiddleware: (fn: UserOperationMiddlewareFn) => IUserOperationBuilder;
  resetMiddleware: () => IUserOperationBuilder;

  // This will construct a UserOperation that can be sent to a client.
  // It will run through your entire middleware stack in the process.
  buildOp: (
    entryPoint: string,
    chainId: BigNumberish,
    stateOverrides?: StateOverrideSet
  ) => Promise<IUserOperation>;

  // Will reset all fields back to default value.
  resetOp: () => IUserOperationBuilder;
}

export type UserOperationMiddlewareFn = (
  context: IUserOperationMiddlewareCtx
) => Promise<void>;

export interface IUserOperationMiddlewareCtx {
  op: IUserOperation;
  entryPoint: string;
  chainId: BigNumberish;
  stateOverrides?: StateOverrideSet;

  // A userOpHash is a unique hash of op + entryPoint + chainId.
  getUserOpHash: () => string;
}

export interface IClientOpts {
  entryPoint?: string;
  overrideBundlerRpc?: string;
}

export interface ISendUserOperationOpts {
  dryRun?: boolean;
  onBuild?: (op: IUserOperation) => Promise<any> | any;
  stateOverrides?: StateOverrideSet;
}

export interface ISendUserOperationResponse {
  userOpHash: string;
  wait: () => Promise<UserOperationEventEvent | null>;
}

export interface IPresetBuilderOpts {
  entryPoint?: string;
  factory?: string;
  salt?: BigNumberish;
  nonceKey?: number;
  paymasterMiddleware?: UserOperationMiddlewareFn;
  overrideBundlerRpc?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISigner extends Pick<ethers.Signer, "signMessage"> {}

export interface ICall {
  to: string;
  value: BigNumberish;
  data: BytesLike;
}
