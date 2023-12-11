import { ethers } from "ethers";
import { ERC4337, Kernel as KernelConst } from "../../constants";
import { UserOperationBuilder } from "../../builder";
import { BundlerJsonRpcProvider } from "../../provider";
import {
  signUserOpHash,
  estimateUserOperationGas,
  getGasPrice,
} from "../middleware";
import {
  EntryPoint,
  EntryPoint__factory,
  KernelFactory,
  KernelFactory__factory,
  Kernel as KernelImpl,
  Kernel__factory,
} from "../../typechain";
import {
  IPresetBuilderOpts,
  ICall,
  UserOperationMiddlewareFn,
} from "../../types";


export class Kernel extends UserOperationBuilder {
  private signer: ethers.Signer;
  private provider: ethers.providers.JsonRpcProvider;
  private entryPoint: EntryPoint;
  private factory: KernelFactory;
  private initCode: string;
  proxy: KernelImpl;

  private constructor(
    signer: ethers.Signer,
    rpcUrl: string,
    opts?: IPresetBuilderOpts
  ) {
    super();
    this.signer = signer;
    this.provider = new BundlerJsonRpcProvider(rpcUrl).setBundlerRpc(
      opts?.overrideBundlerRpc
    );
    this.entryPoint = EntryPoint__factory.connect(
      opts?.entryPoint || ERC4337.EntryPoint,
      this.provider
    );
    this.factory = KernelFactory__factory.connect(
      opts?.factory || KernelConst.KernelFactory,
      this.provider
    );
    this.initCode = "0x";
    this.proxy = Kernel__factory.connect(
      ethers.constants.AddressZero,
      this.provider
    );
  }

  private resolveAccount: UserOperationMiddlewareFn = async (ctx) => {
    ctx.op.nonce = await this.entryPoint.getNonce(ctx.op.sender, 0);
    ctx.op.initCode = ctx.op.nonce.eq(0) ? this.initCode : "0x";
  };

  private sudoMode: UserOperationMiddlewareFn = async (ctx) => {
    ctx.op.signature = ethers.utils.hexConcat([
      KernelConst.Modes.Sudo,
      ctx.op.signature,
    ]);
  };

  public static async init(
    signer: ethers.Signer,
    rpcUrl: string,
    opts?: IPresetBuilderOpts
  ): Promise<Kernel> {
    const instance = new Kernel(signer, rpcUrl, opts);

    try {
    const _data = instance.proxy.interface.encodeFunctionData("initialize", [
      KernelConst.ECDSAValidator, await signer.getAddress()
    ]);      
    const _index = opts?.salt || 0;

      instance.initCode = await ethers.utils.hexConcat([
        instance.factory.address,
        instance.factory.interface.encodeFunctionData("createAccount", [
          KernelConst.Kernel,
          _data,
          _index,
        ]),
      ]);
      await instance.entryPoint.callStatic.getSenderAddress(instance.initCode);

      throw new Error("getSenderAddress: unexpected result");
    } catch (error: any) {
      const addr = error?.errorArgs?.sender;
      if (!addr) throw error;

      const chain = await instance.provider.getNetwork().then((n) => n.chainId);
      instance.proxy = Kernel__factory.connect(addr, instance.provider);
    }

    const base = instance
      .useDefaults({
        sender: instance.proxy.address,
        signature: ethers.utils.hexConcat([
          KernelConst.Modes.Sudo,
          await instance.signer.signMessage(
            ethers.utils.arrayify(ethers.utils.keccak256("0xdead"))
          ),
        ]),
      })
      .useMiddleware(instance.resolveAccount)
      .useMiddleware(getGasPrice(instance.provider));

    const withPM = opts?.paymasterMiddleware
      ? base.useMiddleware(opts.paymasterMiddleware)
      : base.useMiddleware(estimateUserOperationGas(instance.provider));

    return withPM
      .useMiddleware(signUserOpHash(instance.signer))
      .useMiddleware(instance.sudoMode);
  }

  execute(call: ICall) {
    return this.setCallData(
      this.proxy.interface.encodeFunctionData("execute", [
        call.to,
        call.value,
        call.data,
        call.operation,
      ])
    );
  }

  executeBatch(calls: ICall[]) {
    return this.setCallData(
      this.proxy.interface.encodeFunctionData("executeBatch", [
        calls.map((call) => ({
          to: call.to,
          value: call.value,
          data: call.data,
          operation: call.operation,
        })),
      ])
    );
  }

  executeDelegateCall(to: string, data: string) {
    return this.setCallData(
      this.proxy.interface.encodeFunctionData("executeDelegateCall", [to, data])
    );
  }
}
