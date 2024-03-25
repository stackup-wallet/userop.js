import { Address, PublicClient, Hash } from "viem";
import * as EntryPoint from "../entryPoint";
import { UserOperationReceipt } from "./types";

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

export const GetUserOperationReceiptWithViem = async (
  client: PublicClient,
  userOpHash: Hash,
): Promise<UserOperationReceipt | null> => {
  return client.transport.request({
    method: "eth_getUserOperationReceipt",
    params: [userOpHash],
  });
};
