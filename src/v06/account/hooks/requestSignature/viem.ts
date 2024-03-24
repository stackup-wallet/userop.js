import { WalletClient, Account, Transport, Chain } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { RequestSignatureFunc } from "../types";

export const withViemWalletClient = <W extends WalletClient>(
  ...args: W["account"] extends Account
    ? [client: W]
    : [client: W, account: Account]
): RequestSignatureFunc => {
  const dummy = privateKeyToAccount(generatePrivateKey());
  return async (type, message) => {
    switch (type) {
      case "dummy": {
        return dummy.signMessage({ message: { raw: message } });
      }

      case "final": {
        const [client, account] = args;
        if (account) {
          return client.signMessage({ account, message: { raw: message } });
        }
        return (
          client as WalletClient<Transport, Chain | undefined, Account>
        ).signMessage({
          message: { raw: message },
        });
      }
    }
  };
};
