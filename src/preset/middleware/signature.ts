import { ethers } from "ethers";
import { ISigner, UserOperationMiddlewareFn } from "../../types";

export const signUserOpHash =
  (signer: ISigner): UserOperationMiddlewareFn =>
  async (ctx) => {
    ctx.op.signature = await signer.signMessage(
      ethers.utils.arrayify(ctx.getUserOpHash())
    );
  };
