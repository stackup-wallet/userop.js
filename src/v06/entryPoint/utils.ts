import {
  Address,
  numberToHex,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
} from "viem";
import { RawUserOperation, UserOperation } from "./types";

export const calculateUserOpHash = (
  userop: UserOperation,
  entryPoint: Address,
  chainId: number,
) => {
  const packed = encodeAbiParameters(
    parseAbiParameters(
      "address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32",
    ),
    [
      userop.sender,
      userop.nonce,
      keccak256(userop.initCode),
      keccak256(userop.callData),
      userop.callGasLimit,
      userop.verificationGasLimit,
      userop.preVerificationGas,
      userop.maxFeePerGas,
      userop.maxPriorityFeePerGas,
      keccak256(userop.paymasterAndData),
    ],
  );

  const enc = encodeAbiParameters(
    parseAbiParameters("bytes32, address, uint256"),
    [keccak256(packed), entryPoint, BigInt(chainId)],
  );

  return keccak256(enc);
};

export const toRawUserOperation = (userop: UserOperation): RawUserOperation => {
  return {
    sender: userop.sender,
    nonce: numberToHex(userop.nonce),
    initCode: userop.initCode,
    callData: userop.callData,
    callGasLimit: numberToHex(userop.callGasLimit),
    verificationGasLimit: numberToHex(userop.verificationGasLimit),
    preVerificationGas: numberToHex(userop.preVerificationGas),
    maxFeePerGas: numberToHex(userop.maxFeePerGas),
    maxPriorityFeePerGas: numberToHex(userop.maxPriorityFeePerGas),
    paymasterAndData: userop.paymasterAndData,
    signature: userop.signature,
  };
};
