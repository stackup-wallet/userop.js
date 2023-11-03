import { BigNumberish, BytesLike, ethers } from "ethers";
import { UserOperationBuilder } from "../../builder";
import { BundlerJsonRpcProvider } from "../../provider";
import { ERC4337, Biconomy as BiconomyConst } from "../../constants";

import {
    EntryPoint,
    SmartAccountFactory,
    SmartAccountFactory__factory,
    EntryPoint__factory,
    SmartAccount,
    SmartAccount__factory,
    EcdsaOwnershipRegistryModule__factory,
    EcdsaOwnershipRegistryModule,
  } from "../../typechain";
  import {
    ICall,
    IPresetBuilderOpts, UserOperationMiddlewareFn,
  } from "../../types";
import { EOASignature, estimateUserOperationGas, getGasPrice } from "../middleware";

  export class BiconomySmartAccount extends UserOperationBuilder {

    private signer: ethers.Signer;
    private provider: ethers.providers.JsonRpcProvider;
    private entryPoint: EntryPoint;
    private factory: SmartAccountFactory;
    private defaultValidationModule: EcdsaOwnershipRegistryModule;
    private initCode: string;
    proxy: SmartAccount;

    private constructor(
     signer: ethers.Signer,
     rpcUrl: string,
     opts?: IPresetBuilderOpts
    ) {
      super();
      this.signer = signer;
      this.provider = new BundlerJsonRpcProvider(rpcUrl).setBundlerRpc(
      opts?.overrideBundlerRpc);
      this.entryPoint = EntryPoint__factory.connect(
        opts?.entryPoint || ERC4337.EntryPoint,
        this.provider
      );
      this.factory = SmartAccountFactory__factory.connect(
        opts?.factory || BiconomyConst.SmartAccountFactory,
        this.provider
      );
      this.defaultValidationModule = EcdsaOwnershipRegistryModule__factory.connect(
        BiconomyConst.ECDSAOwnershipRegistryModule,
        this.provider
      )
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
      signer: ethers.Signer,
      rpcUrl: string,
      opts?: IPresetBuilderOpts
    ): Promise<BiconomySmartAccount> {
      const instance = new BiconomySmartAccount(signer, rpcUrl, opts);

      const moduleSetupData = instance.defaultValidationModule.interface.encodeFunctionData("initForSmartAccount", [
        await instance.signer.getAddress()
      ]);
  
      try {
        instance.initCode = ethers.utils.hexConcat([
          instance.factory.address,
          instance.factory.interface.encodeFunctionData("deployCounterFactualAccount", [
            BiconomyConst.ECDSAOwnershipRegistryModule,
            moduleSetupData,
            ethers.BigNumber.from(opts?.salt ?? 0),
          ]),
        ]);
        await instance.entryPoint.callStatic.getSenderAddress(instance.initCode);
  
        throw new Error("getSenderAddress: unexpected result");
      } catch (error: any) {
        const addr = error?.errorArgs?.sender;
        if (!addr) throw error;
  
        // in case of not throwing error
        // const addr = await instance.factory.getAddressForCounterFactualAccount(BiconomyConst.ECDSAOwnershipRegistryModule, moduleSetupData, ethers.BigNumber.from(opts?.salt ?? 0))
        instance.proxy = SmartAccount__factory.connect(addr, instance.provider);
      }

      const moduleAddress = ethers.utils.getAddress(BiconomyConst.ECDSAOwnershipRegistryModule);
      const dynamicPart = moduleAddress.substring(2).padEnd(40, "0");
      const dummySig = `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`;
  
      const base = instance
        .useDefaults({
          sender: instance.proxy.address,
          signature: dummySig,
        })
        .useMiddleware(instance.resolveAccount)
        .useMiddleware(getGasPrice(instance.provider));
  
      const withPM = opts?.paymasterMiddleware
        ? base.useMiddleware(opts.paymasterMiddleware)
        : base.useMiddleware(estimateUserOperationGas(instance.provider));
  
      return withPM
        .useMiddleware(EOASignature(instance.signer))
    }

    execute(call: ICall) {
      return this.setCallData(
        this.proxy.interface.encodeFunctionData("execute_ncC", [
          call.to,
          call.value,
          call.data
        ])
      );
    }

    executeBatch(calls: Array<ICall>) {
      // Define the arrays for 'to', 'value', and 'data'
      const toArray: string[] = [];
      const valueArray: BigNumberish[] = [];
      const dataArray: BytesLike[] = [];

      // Iterate over the 'calls' array and populate the three arrays
      calls.forEach(call => {
       toArray.push(call.to);
       valueArray.push(call.value);
       dataArray.push(call.data);
      });

      return this.setCallData(
        this.proxy.interface.encodeFunctionData("executeBatch_y6U", [toArray, valueArray, dataArray])
      );
    }
  }

