import { Address, PublicClient, Hash } from "viem";
import * as Protocol from "../protocol";

export const SendUserOperationWithViem = async (
  client: PublicClient,
  userOp: Protocol.UserOperation,
  entryPoint: Address,
): Promise<Hash> => {
  return client.transport.request({
    method: "eth_sendUserOperation",
    params: [userOp, entryPoint],
  });
};
