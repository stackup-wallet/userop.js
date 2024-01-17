import { Bytes, ethers } from "ethers";
import { EOASigner } from "../../types";

export class RemoteEOA implements EOASigner {
  public provider: ethers.providers.JsonRpcProvider;

  constructor(url: string) {
    this.provider = new ethers.providers.JsonRpcProvider(url);
  }

  getAddress(): Promise<string> {
    return this.provider.getSigner().getAddress();
  }

  async signMessage(message: string | Bytes): Promise<string> {
    const signer = this.provider.getSigner();
    let signature = await signer.signMessage(message);

    // Code snippet from https://gist.github.com/kalaspuff/19365e21e01929c79d5d2638c1ee580e
    if (
      typeof signature === "string" &&
      /(^0[xX]|^)[0-9a-fA-F]{128}(00|01)$/.test(signature)
    ) {
      // Ledger devices produces vrs signatures with a canonical v value of 0 or 1. When signing
      // a message on a Ledger and then relaying the signature to MetaMask, the v byte is still
      // going to be 0 or 1 when it is sent to the dapp, instead of the expected 27 or 28. The
      // invalid last byte will cause validation of the signature to fail. This fixes the issue.

      // [details] https://github.com/ethereum/go-ethereum/issues/19751#issuecomment-504900739

      const sigV = (parseInt(signature.slice(-2), 16) + 27).toString(16);
      signature = signature.slice(0, -2) + sigV;
    }

    return signature;
  }
}
