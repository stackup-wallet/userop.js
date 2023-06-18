import { BigNumberish, ethers } from "ethers";
import { ConnectionInfo } from "ethers/lib/utils";
import { ERC4337 } from "./constants";
import { UserOperationMiddlewareCtx } from "./context";
import { BundlerJsonRpcProvider } from "./provider";
import { EntryPoint, EntryPoint__factory } from "./typechain";
import {
  IClient,
  IClientOpts,
  ISendUserOperationOpts,
  IUserOperationBuilder,
} from "./types";
import { OpToJSON } from "./utils";

export class Client implements IClient {
  private provider: ethers.providers.JsonRpcProvider;

  public entryPoint: EntryPoint;
  public chainId: BigNumberish;
  public waitTimeoutMs: number;
  public waitIntervalMs: number;

  private constructor(
    rpcUrlOrConnectionInfo: string | ConnectionInfo,
    opts?: IClientOpts
  ) {
    this.provider = new BundlerJsonRpcProvider(
      rpcUrlOrConnectionInfo
    ).setBundlerRpc(opts?.overrideBundlerRpc);
    this.entryPoint = EntryPoint__factory.connect(
      opts?.entryPoint || ERC4337.EntryPoint,
      this.provider
    );
    this.chainId = ethers.BigNumber.from(1);
    this.waitTimeoutMs = 30000;
    this.waitIntervalMs = 5000;
  }

  public static async init(
    rpcUrlOrConnectionInfo: string | ConnectionInfo,
    opts?: IClientOpts
  ) {
    const instance = new Client(rpcUrlOrConnectionInfo, opts);
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
    const dryRun = Boolean(opts?.dryRun);
    const op = await this.buildUserOperation(builder);
    opts?.onBuild?.(op);

    const userOpHash = dryRun
      ? new UserOperationMiddlewareCtx(
          op,
          this.entryPoint.address,
          this.chainId
        ).getUserOpHash()
      : ((await this.provider.send("eth_sendUserOperation", [
          OpToJSON(op),
          this.entryPoint.address,
        ])) as string);
    builder.resetOp();

    return {
      userOpHash,
      wait: async () => {
        if (dryRun) {
          return null;
        }

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
