import { ethers } from "ethers";
import { RequestSignatureFunc } from "../types";
import { Hex } from "viem";

export const withEthersSigner = (
  signer: ethers.Signer,
): RequestSignatureFunc => {
  const dummy = ethers.Wallet.createRandom();
  return async (type, message) => {
    switch (type) {
      case "dummy":
        return dummy.signMessage(ethers.getBytes(message)) as Promise<Hex>;

      case "final":
        return signer.signMessage(ethers.getBytes(message)) as Promise<Hex>;
    }
  };
};
