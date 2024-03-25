import { Hex, PublicClient } from "viem";
import { RequestGasValuesFunc } from "../types";

interface GasEstimate {
  preVerificationGas: Hex | number;
  verificationGasLimit: Hex | number;
  callGasLimit: Hex | number;
}

export const withViemPublicClient = (
  client: PublicClient,
): RequestGasValuesFunc => {
  return async (userop, entryPoint, stateOverrideSet) => {
    const est = (await client.transport.request({
      method: "eth_estimateUserOperationGas",
      params:
        stateOverrideSet !== undefined
          ? [userop, entryPoint, stateOverrideSet]
          : [userop, entryPoint],
    })) as GasEstimate;

    return {
      preVerificationGas: BigInt(est.preVerificationGas),
      verificationGasLimit: BigInt(est.verificationGasLimit),
      callGasLimit: BigInt(est.callGasLimit),
    };
  };
};
