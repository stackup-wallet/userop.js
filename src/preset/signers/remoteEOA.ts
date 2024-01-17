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
    // See also https://github.com/ethereum/go-ethereum/issues/19751#issuecomment-504900739
    if (/(^0[xX]|^)[0-9a-fA-F]{128}(00|01)$/.test(signature)) {
      const sigV = (parseInt(signature.slice(-2), 16) + 27).toString(16);
      signature = signature.slice(0, -2) + sigV;
    }

    return signature;
  }
}
