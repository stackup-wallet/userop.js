import {
  Abi,
  ExtractAbiFunctionNames,
  ExtractAbiFunction,
  AbiParametersToPrimitiveTypes,
} from "abitype";
import {
  Address,
  pad,
  concat,
  encodeFunctionData,
  PublicClient,
  createPublicClient,
  http,
  BaseError,
  ContractFunctionRevertedError,
  RpcStateOverride,
  Hex,
} from "viem";
import {
  AccountOpts,
  BuildUserOperationResponse,
  SendUserOperationResponse,
} from "./types";
import * as Hooks from "./hooks";
import * as Bundler from "../bundler";
import * as Protocol from "../protocol";

export class Instance<A extends Abi, F extends Abi> {
  private readonly accountABI: A;
  private readonly factoryABI: F;
  private readonly ethClient: PublicClient;
  private readonly entryPointAddress: Address;
  private readonly factoryAddress: Address;

  private salt: bigint;
  private sender: `0x${string}` = pad("0x", { size: 20 });
  private initCode: Hex = "0x";
  private callData: Hex = "0x";
  private nonceKey = 0n;
  private stateOverrideSet?: RpcStateOverride;

  public setFactoryData: Hooks.SetFactoryDataFunc<F>;
  public requestSignature: Hooks.RequestSignatureFunc;
  public requestGasPrice: Hooks.RequestGasPriceFunc;
  public requestGasValues: Hooks.RequestGasValuesFunc;
  public requestPaymaster?: Hooks.RequestPaymasterFunc;
  public onBuild?: Hooks.OnBuildFunc;

  constructor(opts: AccountOpts<A, F>) {
    this.accountABI = opts.accountABI;
    this.factoryABI = opts.factoryABI;
    this.ethClient = createPublicClient({ transport: http(opts.rpcUrl) });
    this.salt = opts.salt ?? 0n;
    this.entryPointAddress =
      opts.entryPointAddress ?? Protocol.Constants.Entities.EntryPoint;
    this.factoryAddress = opts.factoryAddress;
    this.setFactoryData = opts.setFactoryData;
    this.requestSignature = opts.requestSignature;
    this.requestGasPrice =
      opts.requestGasPrice ??
      Hooks.RequestGasPrice.withViemPublicClient(this.ethClient);
    this.requestGasValues =
      opts.requestGasValues ??
      Hooks.RequestGasValues.withViemPublicClient(this.ethClient);
    this.requestPaymaster = opts.requestPaymaster;
    this.onBuild = opts.onBuild;
  }

  private getInitCode(): Hex {
    if (this.initCode === "0x") {
      this.initCode = concat([
        this.factoryAddress,
        this.setFactoryData(this.salt, (method, inputs) => {
          return encodeFunctionData({
            abi: this.factoryABI as Abi,
            functionName: method as string,
            args: inputs as unknown[],
          });
        }),
      ]);
    }

    return this.initCode;
  }

  private async resolveSenderMeta(): Promise<
    Pick<Protocol.UserOperation, "nonce" | "initCode">
  > {
    const sender = await this.getSender();
    const [nonce, code] = await Promise.all([
      this.ethClient.readContract({
        address: this.entryPointAddress,
        abi: Protocol.Constants.Abi.EntryPoint,
        functionName: "getNonce",
        args: [sender, this.nonceKey],
      }),
      this.ethClient.getBytecode({ address: sender }),
    ]);

    return {
      nonce,
      initCode: code === undefined ? this.getInitCode() : "0x",
    };
  }

  setStateOverrideSetForEstimate(
    stateOverrideSet: RpcStateOverride,
  ): Instance<A, F> {
    this.stateOverrideSet = stateOverrideSet;
    return this;
  }

  clearStateOverrideSetForEstimate(): Instance<A, F> {
    this.stateOverrideSet = undefined;
    return this;
  }

  encodeCallData<M extends ExtractAbiFunctionNames<A>>(
    method: M,
    inputs: AbiParametersToPrimitiveTypes<ExtractAbiFunction<A, M>["inputs"]>,
  ): Instance<A, F> {
    // Casting is required since we extend the Abi type on the class definition.
    // It's ok here since typing has already been enforced on the public interface.
    this.callData = encodeFunctionData({
      abi: this.accountABI as Abi,
      functionName: method as string,
      args: inputs as unknown[],
    });
    return this;
  }

  async getSender(): Promise<Address> {
    if (this.sender !== pad("0x", { size: 20 })) {
      return this.sender;
    }

    try {
      await this.ethClient.simulateContract({
        address: this.entryPointAddress,
        abi: Protocol.Constants.Abi.EntryPoint,
        functionName: "getSenderAddress",
        args: [this.getInitCode()],
      });
    } catch (error) {
      if (error instanceof BaseError) {
        const revertError = error.walk(
          (err) => err instanceof ContractFunctionRevertedError,
        );

        if (revertError instanceof ContractFunctionRevertedError) {
          this.sender = revertError.data?.args?.[0] as Address;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    return this.sender;
  }

  async buildUserOperation(): Promise<BuildUserOperationResponse> {
    const [sender, senderMeta, gasPrice, signature, chainId] =
      await Promise.all([
        this.getSender(),
        this.resolveSenderMeta(),
        this.requestGasPrice(),
        this.requestSignature("dummy", "0xdead"),
        this.ethClient.getChainId(),
      ]);
    const init: Protocol.UserOperation = {
      ...Protocol.DEFAULT_USEROP,
      sender,
      ...senderMeta,
      ...gasPrice,
      callData: this.callData,
      signature,
    };

    const est = await this.requestGasValues(
      init,
      this.entryPointAddress,
      this.stateOverrideSet,
    );
    const useropWithGas: Protocol.UserOperation = { ...init, ...est };

    const pm =
      this.requestPaymaster != undefined
        ? await this.requestPaymaster(useropWithGas, this.entryPointAddress)
        : {};
    const userOpWithPM: Protocol.UserOperation = {
      ...useropWithGas,
      ...pm,
    };

    const userOpHash = Protocol.getUserOpHash(
      userOpWithPM,
      this.entryPointAddress,
      chainId,
    );
    const userOperation = {
      ...userOpWithPM,
      signature: await this.requestSignature("final", userOpHash),
    };
    this.onBuild?.(userOperation);
    return { userOperation, userOpHash };
  }

  async sendUserOperation(): Promise<SendUserOperationResponse> {
    const build = await this.buildUserOperation();
    const userOpHash = await Bundler.SendUserOperationWithViem(
      this.ethClient,
      build.userOperation,
      this.entryPointAddress,
    );

    return {
      userOpHash,
      wait: async () => {
        return null;
      },
    };
  }
}
