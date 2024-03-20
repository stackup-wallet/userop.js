import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { V06 } from "../..";
import { maintainEthBalance } from "../helpers";

describe("Account", () => {
  const owner = privateKeyToAccount(generatePrivateKey());
  const acc = new V06.Account.Instance({
    accountABI: V06.Protocol.Constants.Abi.SimpleAccount,
    factoryABI: V06.Protocol.Constants.Abi.SimpleAccountFactory,
    factoryAddress: V06.Protocol.Constants.Entities.SimpleAccountFactory,
    rpcUrl: "http://localhost:8545",

    setFactoryData(salt, encoder) {
      return encoder("createAccount", [owner.address, salt]);
    },

    requestSignature: V06.Account.Hooks.RequestSignature.withViemAccount(owner),
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
