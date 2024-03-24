import { Address } from "viem";
import { AccountAbi, FactoryAbi } from "./abi/simpleAccount";
import { RequiredAccountOpts } from "../types";
import { RequestSignatureFunc } from "../hooks";

export const base = (
  rpcUrl: string,
  owner: Address,
  requestSignature: RequestSignatureFunc,
): RequiredAccountOpts<typeof AccountAbi, typeof FactoryAbi> => {
  return {
    accountAbi: AccountAbi,
    factoryAbi: FactoryAbi,
    factoryAddress: "0x9406Cc6185a346906296840746125a0E44976454",
    rpcUrl,
    setFactoryData(salt, encoder) {
      return encoder("createAccount", [owner, salt]);
    },
    requestSignature,
  };
};
