import { BigNumberish, BytesLike, ethers } from "ethers";
import { UserOperationBuilder } from "../../builder";
import {
  EOASignature,
  estimateUserOperationGas,
  getGasPrice,
} from "../middleware";
import {
  EntryPoint,
  EntryPoint__factory,
  SmartAccountFactory,
  SmartAccountFactory__factory,
  SmartAccount as BiconomyAccountImpl,
  SmartAccount__factory,
} from "../../typechain";
import { UserOperationMiddlewareFn } from "../../types";

export class BiconomyAccount extends UserOperationBuilder {
  private signer: ethers.Wallet;
  private provider: ethers.providers.JsonRpcProvider;
  private entryPoint: EntryPoint;
  private factory: SmartAccountFactory;
  private initCode: string;
  proxy: BiconomyAccountImpl;

  private constructor(
    signingKey: string,
    ERC4337NodeRpc: string,
    entryPoint: string,
    factory: string
  ) {
    super();
    this.signer = new ethers.Wallet(signingKey);
    this.provider = new ethers.providers.JsonRpcProvider(ERC4337NodeRpc);
    this.entryPoint = EntryPoint__factory.connect(entryPoint, this.provider);
    this.factory = SmartAccountFactory__factory.connect(
      factory,
      this.provider
    );
    this.initCode = "0x";
    this.proxy = SmartAccount__factory.connect(
      ethers.constants.AddressZero,
      this.provider
    );
  }

  private resolveAccount: UserOperationMiddlewareFn = async (ctx) => {
    ctx.op.nonce = await this.entryPoint.getNonce(ctx.op.sender, 0);
    ctx.op.initCode = ctx.op.nonce.eq(0) ? this.initCode : "0x";
  };

  public static async init(
    signingKey: string,
    ERC4337NodeRpc: string,
    entryPoint: string,
    factory: string,
    paymasterMiddleware?: UserOperationMiddlewareFn
  ): Promise<BiconomyAccount> {
    const instance = new BiconomyAccount(
      signingKey,
      ERC4337NodeRpc,
      entryPoint,
      factory
    );

    try {
      instance.initCode = await ethers.utils.hexConcat([
        instance.factory.address,
        instance.factory.interface.encodeFunctionData("deployCounterFactualAccount", [
          await instance.signer.getAddress(),
          ethers.BigNumber.from(0),
        ]),
      ]);
      await instance.entryPoint.callStatic.getSenderAddress(instance.initCode);

      throw new Error("getSenderAddress: unexpected result");
    } catch (error: any) {
      const addr = await instance.factory.getAddressForCounterFactualAccount(await instance.signer.getAddress(), ethers.BigNumber.from(0))
      instance.proxy = SmartAccount__factory.connect(addr, instance.provider);
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

    const withPM = paymasterMiddleware
      ? base.useMiddleware(paymasterMiddleware)
      : base.useMiddleware(estimateUserOperationGas(instance.provider));

    return withPM.useMiddleware(EOASignature(instance.signer));
  }

  execute(to: string, value: BigNumberish, data: BytesLike) {
    return this.setCallData(
      this.proxy.interface.encodeFunctionData("executeCall", [to, value, data])
    );
  }

  executeBatch(to: Array<string>, value: Array<BigNumberish>, data: Array<BytesLike>) {
    return this.setCallData(
      this.proxy.interface.encodeFunctionData("executeBatchCall", [to, value, data])
    );
  }
}
