import { ethers } from "ethers";
import { ConnectionInfo } from "ethers/lib/utils";
import { UserOperationMiddlewareFn } from "../../types";
import { OpToJSON } from "../../utils";

interface VerifyingPaymasterResult {
  paymasterAndData: string;
  preVerificationGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
}

// Assumes the paymaster interface in https://hackmd.io/@stackup/H1oIvV-qi
export const verifyingPaymaster =
  (
    paymasterRpc: string | ConnectionInfo,
    context: any
  ): UserOperationMiddlewareFn =>
  async (ctx) => {
    ctx.op.verificationGasLimit = ethers.BigNumber.from(
      ctx.op.verificationGasLimit
    ).mul(3);

    const provider = new ethers.providers.JsonRpcProvider(paymasterRpc);
    const pm = (await provider.send("pm_sponsorUserOperation", [
      OpToJSON(ctx.op),
      ctx.entryPoint,
      context,
    ])) as VerifyingPaymasterResult;

    ctx.op.paymasterAndData = pm.paymasterAndData;
    ctx.op.preVerificationGas = pm.preVerificationGas;
    ctx.op.verificationGasLimit = pm.verificationGasLimit;
    ctx.op.callGasLimit = pm.callGasLimit;
  };
