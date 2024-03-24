import { createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { localhost } from "viem/chains";
import { ethers } from "ethers";
import { V06 } from "../..";

const EOA_PK = generatePrivateKey();
const VIEM_ACC = privateKeyToAccount(EOA_PK);
const VIEM_WALLET_CLIENT = createWalletClient({
  account: VIEM_ACC,
  chain: localhost,
  transport: http("http://localhost:8545"),
});
const VIEM_WALLET_CLIENT_NO_HOIST = createWalletClient({
  chain: localhost,
  transport: http("http://localhost:8545"),
});
const ETHERS_SIGNING_KEY = new ethers.SigningKey(EOA_PK);
const ETHERS_WALLET = new ethers.BaseWallet(ETHERS_SIGNING_KEY);

export const ACCOUNTS = [
  {
    type: "SimpleAccount, withViemWalletClient (account hoisted)",
    instance: new V06.Account.Instance({
      ...V06.Account.CommonConfigs.SimpleAccount.base(
        "http://localhost:8545",
        VIEM_ACC.address,
        V06.Account.Hooks.RequestSignature.withViemWalletClient(
          VIEM_WALLET_CLIENT,
        ),
      ),
    }),
  },
  {
    type: "SimpleAccount, withViemWalletClient (account not hoisted)",
    instance: new V06.Account.Instance({
      ...V06.Account.CommonConfigs.SimpleAccount.base(
        "http://localhost:8545",
        VIEM_ACC.address,
        V06.Account.Hooks.RequestSignature.withViemWalletClient(
          VIEM_WALLET_CLIENT_NO_HOIST,
          VIEM_ACC,
        ),
      ),
    }),
  },
  {
    type: "SimpleAccount, withEthersSigner",
    instance: new V06.Account.Instance({
      ...V06.Account.CommonConfigs.SimpleAccount.base(
        "http://localhost:8545",
        VIEM_ACC.address,
        V06.Account.Hooks.RequestSignature.withEthersSigner(ETHERS_WALLET),
      ),
    }),
  },
];
