import { ethers } from "ethers";
import { UserOperationMiddlewareFn } from "../../types";
import { OpToJSON } from "../../utils";

interface VerifyingPaymasterResult {
  paymasterAndData: string;
  preVerificationGas: string;
  verificationGasLimit: string;
}

// Assumes the paymaster interface in https://hackmd.io/@stackup/H1oIvV-qi
export const verifyingPaymaster =
  (paymasterRpc: string, context: any): UserOperationMiddlewareFn =>
  async (ctx) => {
    const provider = new ethers.providers.JsonRpcProvider(paymasterRpc);
    const pm = (await provider.send("pm_sponsorUserOperation", [
      OpToJSON(ctx.op),
      ctx.entryPoint,
      ethers.utils.hexlify(ctx.chainId),
      context,
    ])) as VerifyingPaymasterResult;

    ctx.op.paymasterAndData = pm.paymasterAndData;
    ctx.op.preVerificationGas = pm.preVerificationGas;
    ctx.op.verificationGasLimit = pm.verificationGasLimit;
  };
