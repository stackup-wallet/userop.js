import { PublicClient } from "viem";
import { RequestGasPriceFunc } from "../types";

export const withViemPublicClient = (
  client: PublicClient,
): RequestGasPriceFunc => {
  return async () => {
    const block = await client.getBlock();
    if (!block.baseFeePerGas) {
      const gp = await client.getGasPrice();
      return {
        maxFeePerGas: gp,
        maxPriorityFeePerGas: gp,
      };
    }

    const maxPriorityFeePerGas = await client.estimateMaxPriorityFeePerGas();
    const maxFeePerGas = block.baseFeePerGas * 2n + maxPriorityFeePerGas;
    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
  };
};
