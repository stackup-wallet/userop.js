import { Address, Hex } from "viem";

export type StackupV1Types = "payg" | "erc20token";

export interface StackupV1BaseContext {
  rpcUrl: string;
}

export interface StackupV1PaygContext {
  type: "payg";
}

export interface StackupV1Erc20TokenContext {
  type: "erc20token";
  token: Address;
}

export interface StackupV1Response {
  paymasterAndData: Hex;
  preVerificationGas: Hex | number;
  verificationGasLimit: Hex | number;
  callGasLimit: Hex | number;
}

export interface PaymasterVariantParams {
  stackupV1: StackupV1BaseContext &
    (StackupV1PaygContext | StackupV1Erc20TokenContext);
}

export interface PaymasterOpts {
  variant: keyof PaymasterVariantParams;
  parameters: PaymasterVariantParams[PaymasterOpts["variant"]];
}
