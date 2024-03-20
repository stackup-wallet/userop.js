import { PrivateKeyAccount } from "viem";
import { RequestSignatureFunc } from "../types";

export const withViemAccount = (
  acc: PrivateKeyAccount,
): RequestSignatureFunc => {
  return async (_type, message) => {
    return acc.signMessage({ message: { raw: message } });
  };
};
