import { zeroAddress } from "viem";
import { UserOperation } from "./types";
import { EntryPoint } from "./abi";

export const CONTRACT_ABI = EntryPoint;
export const DEFAULT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
export const DEFAULT_USEROP: UserOperation = {
  sender: zeroAddress,
  nonce: 0n,
  initCode: "0x",
  callData: "0x",
  callGasLimit: 0n,
  verificationGasLimit: 0n,
  preVerificationGas: 0n,
  maxFeePerGas: 0n,
  maxPriorityFeePerGas: 0n,
  paymasterAndData: "0x",
  signature: "0x",
};
