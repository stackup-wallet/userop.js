import { pad } from "viem";
import { UserOperation } from "./types";
import { EntryPoint, SimpleAccount, SimpleAccountFactory } from "./abi";

export const DEFAULT_USEROP: UserOperation = {
  sender: pad("0x", { size: 20 }),
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

export const Constants = {
  Entities: {
    EntryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    SimpleAccountFactory: "0x9406Cc6185a346906296840746125a0E44976454",
  },
  Abi: {
    EntryPoint,
    SimpleAccount,
    SimpleAccountFactory,
  },
} as const;
