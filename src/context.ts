import { BigNumberish, ethers } from "ethers";
import { IUserOperationMiddlewareCtx, IUserOperation } from "./types";

export class UserOperationMiddlewareCtx implements IUserOperationMiddlewareCtx {
  public op: IUserOperation;
  readonly entryPoint: string;
  readonly chainId: BigNumberish;

  constructor(op: IUserOperation, entryPoint: string, chainId: BigNumberish) {
    this.op = { ...op };
    this.entryPoint = ethers.utils.getAddress(entryPoint);
    this.chainId = ethers.BigNumber.from(chainId);
  }

  async getUserOpHash() {
    let packed = ethers.utils.defaultAbiCoder.encode(
      [
        {
          components: [
            {
              type: "address",
              name: "sender",
            },
            {
              type: "uint256",
              name: "nonce",
            },
            {
              type: "bytes",
              name: "initCode",
            },
            {
              type: "bytes",
              name: "callData",
            },
            {
              type: "uint256",
              name: "callGasLimit",
            },
            {
              type: "uint256",
              name: "verificationGasLimit",
            },
            {
              type: "uint256",
              name: "preVerificationGas",
            },
            {
              type: "uint256",
              name: "maxFeePerGas",
            },
            {
              type: "uint256",
              name: "maxPriorityFeePerGas",
            },
            {
              type: "bytes",
              name: "paymasterAndData",
            },
            {
              type: "bytes",
              name: "signature",
            },
          ],
          name: "userOp",
          type: "tuple",
        } as any,
      ],
      [
        {
          ...this.op,
          signature: "0x",
        },
      ]
    );
    packed = "0x" + packed.slice(66, packed.length - 64);
    const enc = ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "address", "uint256"],
      [ethers.utils.keccak256(packed), this.entryPoint, this.chainId]
    );

    return ethers.utils.keccak256(enc);
  }
}
