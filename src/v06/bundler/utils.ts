import { Address, PublicClient, Hash } from "viem";
import * as EntryPoint from "../entryPoint";

export const SendUserOperationWithViem = async (
  client: PublicClient,
  userOp: EntryPoint.UserOperation,
  entryPoint: Address,
): Promise<Hash> => {
  return client.transport.request({
    method: "eth_sendUserOperation",
    params: [userOp, entryPoint],
  });
};
