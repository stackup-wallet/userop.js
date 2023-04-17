import { ethers } from "ethers";
import { UserOperationMiddlewareFn } from "../../types";

export const EOASignature =
  (signer: ethers.Wallet): UserOperationMiddlewareFn =>
  async (ctx) => {
    ctx.op.signature = await signer.signMessage(
      ethers.utils.arrayify(ctx.getUserOpHash())
    );
  };
