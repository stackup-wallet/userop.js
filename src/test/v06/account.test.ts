import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { V06 } from "../..";
import { maintainEthBalance } from "../helpers";

describe("Account", () => {
  const owner = privateKeyToAccount(generatePrivateKey());
  const acc = new V06.Account.Instance({
    ...V06.Account.Common.SimpleAccount.baseConfig(
      "http://localhost:8545",
      owner.address,
      V06.Account.Hooks.RequestSignature.withViemAccount(owner),
    ),
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
