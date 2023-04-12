import { BigNumberish, ethers } from "ethers";
import { OpToJSON } from "../../utils";
import { UserOperationMiddlewareFn } from "../../types";

interface GasEstimate {
  preVerificationGas: BigNumberish;
  verificationGas: BigNumberish;
  callGasLimit: BigNumberish;
}

export const estimateUserOperationGas =
  (provider: ethers.providers.JsonRpcProvider): UserOperationMiddlewareFn =>
  async (ctx) => {
    const est = (await provider.send("eth_estimateUserOperationGas", [
      OpToJSON(ctx.op),
      ctx.entryPoint,
    ])) as GasEstimate;

    ctx.op.preVerificationGas = est.preVerificationGas;
    ctx.op.verificationGasLimit = est.verificationGas;
    ctx.op.callGasLimit = est.callGasLimit;
  };
