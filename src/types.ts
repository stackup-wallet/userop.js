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

export type EOASigner = ISigner & Pick<ethers.Signer, "getAddress">;

export interface ICall {
  to: string;
  value: BigNumberish;
  data: BytesLike;
}
