import { ACCOUNTS } from "./account.constants";
import { maintainEthBalance } from "../helpers";
import {
  zeroHash,
  checksumAddress,
  zeroAddress,
  numberToHex,
  parseEther,
} from "viem";

import { V06 } from "../..";

describe("Account", () => {
  ACCOUNTS.forEach((account) => {
    describe(account.type, () => {
      const acc = account.instance;

      beforeEach(async () => {
        await maintainEthBalance(await acc.getSender(), "1");
      });

      test("Can build a UserOperation", async () => {
        const build = await acc
          .encodeCallData("execute", [await acc.getSender(), 1n, "0x"])
          .buildUserOperation();

        expect(build.userOpHash).not.toEqual(zeroHash);
        expect(build.userOperation).not.toEqual(V06.EntryPoint.DEFAULT_USEROP);
      });

      test("Can send a valid UserOperation to be included onchain", async () => {
        const build = await acc
          .encodeCallData("execute", [await acc.getSender(), 1n, "0x"])
          .buildUserOperation();

        const send = await acc
          .encodeCallData("execute", [await acc.getSender(), 1n, "0x"])
          .sendUserOperation();

        expect(build.userOpHash).toEqual(send.userOpHash);

        const receipt = await send.wait();
        expect(receipt).not.toBeNull();
      });

      describe("Configuring the salt", () => {
        const initSalt = acc.getSalt();

        afterEach(() => {
          acc.setSalt(initSalt);
        });

        test("Can change the sender", async () => {
          const sender0 = await acc.setSalt(initSalt).getSender();
          const sender1 = await acc.setSalt(initSalt + 1n).getSender();

          expect(sender0).not.toEqual(sender1);
        });

        test("Can allow UserOperations to be sent on a different sender", async () => {
          const sender1 = await acc.setSalt(initSalt + 1n).getSender();
          await maintainEthBalance(await sender1, "1");
          const send = await acc
            .encodeCallData("execute", [await sender1, 1n, "0x"])
            .sendUserOperation();

          const receipt = await send.wait();
          expect(receipt).not.toBeNull();
          expect(checksumAddress(receipt?.sender || zeroAddress)).toEqual(
            sender1,
          );
        });
      });

      describe("Encoded callData", () => {
        test("Should be reset between successful builds", async () => {
          const build1 = await acc
            .encodeCallData("execute", [await acc.getSender(), 1n, "0x"])
            .buildUserOperation();

          const build2 = await acc.buildUserOperation();

          expect(build1.userOperation.callData).not.toEqual(
            build2.userOperation.callData,
          );
        });

        test("Should be reset even if build fails", async () => {
          const build1 = acc
            .encodeCallData("execute", [
              await acc.getSender(),
              parseEther("2"),
              "0x",
            ])
            .buildUserOperation();
          await expect(build1).rejects.toThrow("execution reverted");

          const build2 = await acc.buildUserOperation();
          expect(build2.userOperation).not.toEqual(
            V06.EntryPoint.DEFAULT_USEROP,
          );
        });
      });

      describe("Configuring state overrides", () => {
        afterEach(() => {
          acc.clearStateOverrideSetForEstimate();
        });

        test("Can impact the outcome of building a UserOperation", async () => {
          const build = await acc
            .encodeCallData("execute", [await acc.getSender(), 1n, "0x"])
            .buildUserOperation();
          expect(build.userOperation).not.toEqual(
            V06.EntryPoint.DEFAULT_USEROP,
          );

          const buildWithOverride = acc
            .setStateOverrideSetForEstimate({
              [await acc.getSender()]: {
                balance: numberToHex(0),
              },
            })
            .encodeCallData("execute", [await acc.getSender(), 1n, "0x"])
            .buildUserOperation();
          await expect(buildWithOverride).rejects.toThrow();
        });
      });

      describe("Configuring the nonce key", () => {
        const initNonceKey = acc.getNonceKey();

        afterEach(() => {
          acc.setNonceKey(initNonceKey);
        });

        test("Can change the nonce value", async () => {
          const nonce0 = await acc.setNonceKey(initNonceKey).getNonce();
          const nonce1 = await acc.setNonceKey(initNonceKey + 1n).getNonce();

          expect(nonce0).not.toEqual(nonce1);
        });

        test("Can allow a UserOperation to be sent on a different nonce value", async () => {
          const expectedNonce = await acc
            .setNonceKey(initNonceKey + 1n)
            .getNonce();
          expect(expectedNonce).toBeGreaterThan(0n);

          const send = await acc
            .encodeCallData("execute", [await acc.getSender(), 1n, "0x"])
            .sendUserOperation();

          const receipt = await send.wait();
          expect(receipt).not.toBeNull();
          expect(receipt?.nonce).toEqual(numberToHex(expectedNonce));
        });
      });

      describe("Configuring polling configs for wait()", () => {
        const initWaitTimeoutMs = acc.getWaitTimeoutMs();
        const initWaitIntervalMs = acc.getWaitIntervalMs();

        afterEach(() => {
          acc
            .setWaitTimeoutMs(initWaitTimeoutMs)
            .setWaitIntervalMs(initWaitIntervalMs);
        });

        test("Can change wait timeout", () => {
          const timeout = Math.floor(Math.random() * 60000) + 1;
          acc.setWaitTimeoutMs(timeout);

          expect(acc.getWaitTimeoutMs()).toEqual(timeout);
        });

        test("Can change interval timeout", () => {
          const timeout = Math.floor(Math.random() * 3000) + 1;
          acc.setWaitIntervalMs(timeout);

          expect(acc.getWaitIntervalMs()).toEqual(timeout);
        });
      });
    });
  });
});
