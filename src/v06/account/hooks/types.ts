import {
  Abi,
  ExtractAbiFunctionNames,
  ExtractAbiFunction,
  AbiParametersToPrimitiveTypes,
} from "abitype";
import { Hex, Address, RpcStateOverride } from "viem";
import * as EntryPoint from "../../entryPoint";

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
  Pick<EntryPoint.UserOperation, "maxFeePerGas" | "maxPriorityFeePerGas">
>;

export type RequestGasValuesFunc = (
  userop: EntryPoint.UserOperation,
  entryPoint: Address,
  stateOverrideSet?: RpcStateOverride,
) => Promise<
  Pick<
    EntryPoint.UserOperation,
    "preVerificationGas" | "verificationGasLimit" | "callGasLimit"
  >
>;

export type RequestPaymasterFunc = (
  userop: EntryPoint.UserOperation,
  entryPoint: Address,
) => Promise<
  Pick<EntryPoint.UserOperation, "paymasterAndData"> &
    Partial<EntryPoint.UserOperation>
>;

export type OnBuildFunc = (userop: EntryPoint.UserOperation) => void;
