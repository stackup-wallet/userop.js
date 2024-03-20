import {
  Abi,
  ExtractAbiFunctionNames,
  ExtractAbiFunction,
  AbiParametersToPrimitiveTypes,
} from "abitype";
import { Hex, Address, RpcStateOverride } from "viem";
import * as Protocol from "../../protocol";

export type SetFactoryDataFunc<F extends Abi> = (
  salt: bigint,
  encoder: <M extends ExtractAbiFunctionNames<F>>(
    method: M,
    inputs: AbiParametersToPrimitiveTypes<ExtractAbiFunction<F, M>["inputs"]>,
  ) => Hex,
) => Hex;

export type RequestSignatureFunc = (
  type: "dummy" | "final",
  message: Hex,
) => Promise<Hex>;

export type RequestGasPriceFunc = () => Promise<
  Pick<Protocol.UserOperation, "maxFeePerGas" | "maxPriorityFeePerGas">
>;

export type RequestGasValuesFunc = (
  userop: Protocol.UserOperation,
  entryPoint: Address,
  stateOverrideSet?: RpcStateOverride,
) => Promise<
  Pick<
    Protocol.UserOperation,
    "preVerificationGas" | "verificationGasLimit" | "callGasLimit"
  >
>;

export type RequestPaymasterFunc = (
  userop: Protocol.UserOperation,
  entryPoint: Address,
) => Promise<
  Pick<Protocol.UserOperation, "paymasterAndData"> &
    Partial<Protocol.UserOperation>
>;

export type OnBuildFunc = (userop: Protocol.UserOperation) => void;
