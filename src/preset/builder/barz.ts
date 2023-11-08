import { BigNumberish, BytesLike, ethers } from "ethers";
import { ERC4337, Barz as BarzConst } from "../../constants";
import { UserOperationBuilder } from "../../builder";
import { BundlerJsonRpcProvider } from "../../provider";
import {
  signUserOpHash,
  estimateUserOperationGas,
  getGasPrice,
} from "../middleware";
import { BarzSecp256r1 } from "../signers";
import {
  EntryPoint,
  EntryPoint__factory,
  BarzFactory,
  BarzFactory__factory,
  BarzAccountFacet,
  BarzAccountFacet__factory,
} from "../../typechain";
import { IPresetBuilderOpts, UserOperationMiddlewareFn } from "../../types";

export class Barz extends UserOperationBuilder {
  private signer: BarzSecp256r1;
  private provider: ethers.providers.JsonRpcProvider;
  private entryPoint: EntryPoint;
  private factory: BarzFactory;
  private initCode: string;
  proxy: BarzAccountFacet;

  private constructor(
    signer: BarzSecp256r1,
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
    this.factory = BarzFactory__factory.connect(
      opts?.factory || BarzConst.Factory,
      this.provider
    );
    this.initCode = "0x";
    this.proxy = BarzAccountFacet__factory.connect(
      ethers.constants.AddressZero,
      this.provider
    );
  }

  private resolveAccount: UserOperationMiddlewareFn = async (ctx) => {
    ctx.op.nonce = await this.entryPoint.getNonce(ctx.op.sender, 0);
    ctx.op.initCode = ctx.op.nonce.eq(0) ? this.initCode : "0x";
  };

  public static async init(
    signer: BarzSecp256r1,
    rpcUrl: string,
    opts?: IPresetBuilderOpts
  ): Promise<Barz> {
    const instance = new Barz(signer, rpcUrl, opts);

    try {
      instance.initCode = await ethers.utils.hexConcat([
        instance.factory.address,
        instance.factory.interface.encodeFunctionData("createAccount", [
          BarzConst.Secp256r1VerificationFacet,
          await instance.signer.getPublicKey(),
          ethers.BigNumber.from(opts?.salt ?? 0),
        ]),
      ]);
      await instance.entryPoint.callStatic.getSenderAddress(instance.initCode);

      throw new Error("getSenderAddress: unexpected result");
    } catch (error: any) {
      const addr = error?.errorArgs?.sender;
      if (!addr) throw error;

      instance.proxy = BarzAccountFacet__factory.connect(
        addr,
        instance.provider
      );
    }

    const base = instance
      .useDefaults({
        sender: instance.proxy.address,
        signature: await instance.signer.signMessage(
          ethers.utils.arrayify(ethers.utils.keccak256("0xdead"))
        ),
      })
      .useMiddleware(instance.resolveAccount)
      .useMiddleware(getGasPrice(instance.provider));

    const withPM = opts?.paymasterMiddleware
      ? base.useMiddleware(opts.paymasterMiddleware)
      : base.useMiddleware(estimateUserOperationGas(instance.provider));

    return withPM.useMiddleware(signUserOpHash(instance.signer));
  }

  execute(to: string, value: BigNumberish, data: BytesLike) {
    return this.setCallData(
      this.proxy.interface.encodeFunctionData("execute", [to, value, data])
    );
  }

  executeBatch(
    to: Array<string>,
    value: Array<BigNumberish>,
    data: Array<BytesLike>
  ) {
    return this.setCallData(
      this.proxy.interface.encodeFunctionData("executeBatch", [to, value, data])
    );
  }
}
