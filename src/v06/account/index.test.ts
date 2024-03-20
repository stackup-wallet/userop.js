import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import * as Account from ".";
import * as Protocol from "../protocol";

import { maintainEthBalance } from "../../../test/helpers";

describe("Account", () => {
  const owner = privateKeyToAccount(generatePrivateKey());
  const acc = new Account.Instance({
    accountABI: Protocol.Constants.Abi.SimpleAccount,
    factoryABI: Protocol.Constants.Abi.SimpleAccountFactory,
    factoryAddress: Protocol.Constants.Entities.SimpleAccountFactory,
    rpcUrl: "http://localhost:8545",

    setFactoryData(salt, encoder) {
      return encoder("createAccount", [owner.address, salt]);
    },

    requestSignature: Account.Hooks.RequestSignature.withViemAccount(owner),
  });

  beforeEach(async () => {
    await maintainEthBalance(await acc.getSender(), "1");
  });

  test("Builds correctly", async () => {
    const op = await acc
      .encodeCallData("execute", [await acc.getSender(), 0n, "0x"])
      .buildUserOperation();

    console.log(op);
  });

  test("Sends correctly", async () => {
    const res = await acc
      .encodeCallData("execute", [await acc.getSender(), 0n, "0x"])
      .sendUserOperation();

    console.log(res.userOpHash);
  });
});
