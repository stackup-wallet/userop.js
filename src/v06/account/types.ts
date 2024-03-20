import { Abi } from "abitype";
import { Hex, Address } from "viem";
import * as Hooks from "./hooks";
import * as Protocol from "../protocol";
import * as Bundler from "../bundler";

export interface BuildUserOperationResponse {
  userOperation: Protocol.UserOperation;
  userOpHash: Hex;
}

export interface SendUserOperationResponse {
  userOpHash: Hex;
  wait: () => Promise<Bundler.UserOperationReceipt | null>;
}

export interface AccountOpts<A extends Abi, F extends Abi> {
  // Required global values
  accountABI: A;
  factoryABI: F;
  factoryAddress: Address;
  rpcUrl: string;

  // Optional global values
  salt?: bigint;
  entryPointAddress?: Address;

  // Required hook methods
  setFactoryData: Hooks.SetFactoryDataFunc<F>;
  requestSignature: Hooks.RequestSignatureFunc;

  // Optional hook methods
  requestGasPrice?: Hooks.RequestGasPriceFunc;
  requestGasValues?: Hooks.RequestGasValuesFunc;
  requestPaymaster?: Hooks.RequestPaymasterFunc;
  onBuild?: Hooks.OnBuildFunc;
}
