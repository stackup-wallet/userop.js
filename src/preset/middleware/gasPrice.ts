import { ethers } from "ethers";
import { UserOperationMiddlewareFn } from "../../types";

const eip1559GasPrice = async (provider: ethers.providers.JsonRpcProvider) => {
  const [fee, block] = await Promise.all([
    provider.send("eth_maxPriorityFeePerGas", []),
    provider.getBlock("latest"),
  ]);

  const tip = ethers.BigNumber.from(fee);
  const buffer = tip.div(100).mul(13);
  const maxPriorityFeePerGas = tip.add(buffer);
  const maxFeePerGas = block.baseFeePerGas
    ? block.baseFeePerGas.mul(2).add(maxPriorityFeePerGas)
    : maxPriorityFeePerGas;

  return { maxFeePerGas, maxPriorityFeePerGas };
};

const legacyGasPrice = async (provider: ethers.providers.JsonRpcProvider) => {
  const gas = await provider.getGasPrice();

  return { maxFeePerGas: gas, maxPriorityFeePerGas: gas };
};

export const getGasPrice =
  (provider: ethers.providers.JsonRpcProvider): UserOperationMiddlewareFn =>
  async (ctx) => {
    let eip1559Error;
    try {
      const { maxFeePerGas, maxPriorityFeePerGas } = await eip1559GasPrice(
        provider
      );

      ctx.op.maxFeePerGas = maxFeePerGas;
      ctx.op.maxPriorityFeePerGas = maxPriorityFeePerGas;
      return;
    } catch (error: any) {
      eip1559Error = error;
      console.warn(
        "getGas: eth_maxPriorityFeePerGas failed, falling back to legacy gas price."
      );
    }

    try {
      const { maxFeePerGas, maxPriorityFeePerGas } = await legacyGasPrice(
        provider
      );

      ctx.op.maxFeePerGas = maxFeePerGas;
      ctx.op.maxPriorityFeePerGas = maxPriorityFeePerGas;
      return;
    } catch (error) {
      throw new Error(`${eip1559Error}, ${error}`);
    }
  };
