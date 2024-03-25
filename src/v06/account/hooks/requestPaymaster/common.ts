import { createPublicClient, http } from "viem";
import {
  PaymasterOpts,
  PaymasterVariantParams,
  StackupV1Response,
} from "./types";
import { RequestPaymasterFunc } from "../types";

const stackupV1Paymaster = (
  params: PaymasterVariantParams["stackupV1"],
): RequestPaymasterFunc => {
  const client = createPublicClient({ transport: http(params.rpcUrl) });

  return async (userop, entryPoint) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rpcUrl, ...ctx } = params;

    const pm = (await client.transport.request({
      method: "pm_sponsorUserOperation",
      params: [userop, entryPoint, ctx],
    })) as StackupV1Response;

    return {
      paymasterAndData: pm.paymasterAndData,
      callGasLimit: BigInt(pm.callGasLimit),
      verificationGasLimit: BigInt(pm.verificationGasLimit),
      preVerificationGas: BigInt(pm.preVerificationGas),
    };
  };
};

export const withCommon = (opts: PaymasterOpts): RequestPaymasterFunc => {
  switch (opts.variant) {
    case "stackupV1":
      return stackupV1Paymaster(opts.parameters);
  }
};
