import { ethers } from "ethers";
import {ConnectionInfo} from "ethers/lib/utils";

export class BundlerJsonRpcProvider extends ethers.providers.JsonRpcProvider {
  private bundlerRpc?: ethers.providers.JsonRpcProvider;
  private bundlerMethods = new Set([
    "eth_sendUserOperation",
    "eth_estimateUserOperationGas",
    "eth_getUserOperationByHash",
    "eth_getUserOperationReceipt",
    "eth_supportedEntryPoints",
  ]);

  setBundlerRpc(bundlerRpc?: string | ConnectionInfo): BundlerJsonRpcProvider {
    if (bundlerRpc) {
      this.bundlerRpc = new ethers.providers.JsonRpcProvider(bundlerRpc);
    }
    return this;
  }

  send(method: string, params: any[]): Promise<any> {
    if (this.bundlerRpc && this.bundlerMethods.has(method)) {
      return this.bundlerRpc.send(method, params);
    }

    return super.send(method, params);
  }
}
