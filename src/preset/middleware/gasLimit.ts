import { BigNumberish, ethers } from "ethers";
import { OpToJSON } from "../../utils";
import { UserOperationMiddlewareFn } from "../../types";

interface GasEstimate {
  preVerificationGas: BigNumberish;
  verificationGasLimit: BigNumberish;
  callGasLimit: BigNumberish;

  // TODO: remove this with EntryPoint v0.7
  verificationGas: BigNumberish;
}

const estimateCreationGas = async (
  provider: ethers.providers.JsonRpcProvider,
  initCodeHex: string
): Promise<ethers.BigNumber> => {
  const factory = initCodeHex.substring(0, 42);
  const callData = "0x" + initCodeHex.substring(42);
  return await provider.estimateGas({
    to: factory,
    data: callData,
  });
};

export const estimateUserOperationGas =
  (provider: ethers.providers.JsonRpcProvider): UserOperationMiddlewareFn =>
  async (ctx) => {
    const initCodeHex = ethers.utils.hexlify(ctx.op.initCode);
    if (initCodeHex.length > 2) {
      ctx.op.verificationGasLimit = ethers.BigNumber.from(
        ctx.op.verificationGasLimit
      ).add(await estimateCreationGas(provider, initCodeHex));
    }

    const est = (await provider.send("eth_estimateUserOperationGas", [
      OpToJSON(ctx.op),
      ctx.entryPoint,
    ])) as GasEstimate;

    ctx.op.preVerificationGas = est.preVerificationGas;
    ctx.op.verificationGasLimit =
      est.verificationGasLimit ?? est.verificationGas;
    ctx.op.callGasLimit = est.callGasLimit;
  };
