import { BigNumberish, ethers } from "ethers";
import {
  IClient,
  IUserOperationBuilder,
  ISendUserOperationOpts,
} from "./types";
import { EntryPoint, EntryPoint__factory } from "./typechain";
import { OpToJSON } from "./utils";

export class Client implements IClient {
  private provider: ethers.providers.JsonRpcProvider;

  public entryPoint: EntryPoint;
  public chainId: BigNumberish;
  public waitTimeoutMs: number;
  public waitIntervalMs: number;

  private constructor(rpcUrl: string, entryPoint: string) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    this.entryPoint = EntryPoint__factory.connect(entryPoint, this.provider);
    this.chainId = ethers.BigNumber.from(1);
    this.waitTimeoutMs = 30000;
    this.waitIntervalMs = 5000;
  }

  public static async init(rpcUrl: string, entryPoint: string) {
    const instance = new Client(rpcUrl, entryPoint);
    instance.chainId = await instance.provider
      .getNetwork()
      .then((network) => ethers.BigNumber.from(network.chainId));

    return instance;
  }

  async buildUserOperation(builder: IUserOperationBuilder) {
    return builder.buildOp(this.entryPoint.address, this.chainId);
  }

  async sendUserOperation(
    builder: IUserOperationBuilder,
    opts?: ISendUserOperationOpts
  ) {
    const op = await this.buildUserOperation(builder);
    opts?.onBuild?.(op);

    const userOpHash = (await this.provider.send("eth_sendUserOperation", [
      OpToJSON(op),
      this.entryPoint.address,
    ])) as string;
    builder.resetOp();

    return {
      userOpHash,
      wait: async () => {
        const end = Date.now() + this.waitTimeoutMs;
        const block = await this.provider.getBlock("latest");
        while (Date.now() < end) {
          const events = await this.entryPoint.queryFilter(
            this.entryPoint.filters.UserOperationEvent(userOpHash),
            Math.max(0, block.number - 100)
          );
          if (events.length > 0) {
            return events[0];
          }
          await new Promise((resolve) =>
            setTimeout(resolve, this.waitIntervalMs)
          );
        }

        return null;
      },
    };
  }
}
