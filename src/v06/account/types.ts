import { Abi } from "abitype";
import { Hex, Address } from "viem";
import * as Hooks from "./hooks";
import * as Bundler from "../bundler";
import * as EntryPoint from "../entryPoint";

export interface BuildUserOperationResponse {
  userOperation: EntryPoint.UserOperation;
  userOpHash: Hex;
}

export interface SendUserOperationResponse {
  userOpHash: Hex;
  wait: () => Promise<Bundler.UserOperationReceipt | null>;
}

export interface AccountOpts<A extends Abi, F extends Abi> {
  // Required global values
  accountAbi: A;
  factoryAbi: F;
  factoryAddress: Address;
  rpcUrl: string;

  // Optional global values
  entryPointAddress?: Address;
  salt?: bigint;
  waitTimeoutMs?: number;
  waitIntervalMs?: number;

  // Required hook methods
  setFactoryData: Hooks.SetFactoryDataFunc<F>;
  requestSignature: Hooks.RequestSignatureFunc;

  // Optional hook methods
  requestGasPrice?: Hooks.RequestGasPriceFunc;
  requestGasValues?: Hooks.RequestGasValuesFunc;
  requestPaymaster?: Hooks.RequestPaymasterFunc;
  onBuild?: Hooks.OnBuildFunc;
}

export type RequiredAccountOpts<A extends Abi, F extends Abi> = Pick<
  AccountOpts<A, F>,
  | "accountAbi"
  | "factoryAbi"
  | "factoryAddress"
  | "rpcUrl"
  | "setFactoryData"
  | "requestSignature"
>;
