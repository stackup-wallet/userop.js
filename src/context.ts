import { BigNumberish, ethers } from "ethers";
import {
  IUserOperationMiddlewareCtx,
  IUserOperation,
  StateOverrideSet,
} from "./types";

export class UserOperationMiddlewareCtx implements IUserOperationMiddlewareCtx {
  public op: IUserOperation;
  readonly entryPoint: string;
  readonly chainId: BigNumberish;
  readonly stateOverrides?: StateOverrideSet | undefined;

  constructor(
    op: IUserOperation,
    entryPoint: string,
    chainId: BigNumberish,
    stateOverrides?: StateOverrideSet
  ) {
    this.op = { ...op };
    this.entryPoint = ethers.utils.getAddress(entryPoint);
    this.chainId = ethers.BigNumber.from(chainId);
    this.stateOverrides = stateOverrides;
  }

  getUserOpHash() {
    const packed = ethers.utils.defaultAbiCoder.encode(
      [
        "address",
        "uint256",
        "bytes32",
        "bytes32",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "bytes32",
      ],
      [
        this.op.sender,
        this.op.nonce,
        ethers.utils.keccak256(this.op.initCode),
        ethers.utils.keccak256(this.op.callData),
        this.op.callGasLimit,
        this.op.verificationGasLimit,
        this.op.preVerificationGas,
        this.op.maxFeePerGas,
        this.op.maxPriorityFeePerGas,
        ethers.utils.keccak256(this.op.paymasterAndData),
      ]
    );

    const enc = ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "address", "uint256"],
      [ethers.utils.keccak256(packed), this.entryPoint, this.chainId]
    );

    return ethers.utils.keccak256(enc);
  }
}
