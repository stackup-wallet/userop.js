import {
  Abi,
  ExtractAbiFunctionNames,
  ExtractAbiFunction,
  AbiParametersToPrimitiveTypes,
} from "abitype";
import {
  Address,
  concat,
  encodeFunctionData,
  PublicClient,
  createPublicClient,
  http,
  BaseError,
  ContractFunctionRevertedError,
  RpcStateOverride,
  Hex,
  zeroAddress,
} from "viem";
import {
  AccountOpts,
  BuildUserOperationResponse,
  SendUserOperationResponse,
} from "./types";
import * as Hooks from "./hooks";
import * as Bundler from "../bundler";
import * as EntryPoint from "../entryPoint";

export class Instance<A extends Abi, F extends Abi> {
  private readonly accountAbi: A;
  private readonly factoryAbi: F;
  private readonly factoryAddress: Address;
  private readonly entryPointAddress: Address;
  private readonly ethClient: PublicClient;

  private salt: bigint;
  private waitTimeoutMs: number;
  private waitIntervalMs: number;
  private sender: `0x${string}` = zeroAddress;
  private initCode: Hex = "0x";
  private callData: Hex = "0x";
  private nonceKey = 0n;
  private stateOverrideSet?: RpcStateOverride;

  private setFactoryData: Hooks.SetFactoryDataFunc<F>;
  private requestSignature: Hooks.RequestSignatureFunc;
  private requestGasPrice: Hooks.RequestGasPriceFunc;
  private requestGasValues: Hooks.RequestGasValuesFunc;
  private requestPaymaster?: Hooks.RequestPaymasterFunc;
  private onBuild?: Hooks.OnBuildFunc;

  constructor(opts: AccountOpts<A, F>) {
    this.accountAbi = opts.accountAbi;
    this.factoryAbi = opts.factoryAbi;
    this.factoryAddress = opts.factoryAddress;
    this.entryPointAddress =
      opts.entryPointAddress ?? EntryPoint.DEFAULT_ADDRESS;
    this.ethClient = createPublicClient({ transport: http(opts.rpcUrl) });

    this.salt = opts.salt ?? 0n;
    this.waitTimeoutMs = opts.waitTimeoutMs ?? 60000;
    this.waitIntervalMs = opts.waitIntervalMs ?? 3000;

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
            abi: this.factoryAbi as Abi,
            functionName: method as string,
            args: inputs as unknown[],
          });
        }),
      ]);
    }

    return this.initCode;
  }

  private async resolveSenderMeta(): Promise<
    Pick<EntryPoint.UserOperation, "nonce" | "initCode">
  > {
    const sender = await this.getSender();
    const [nonce, code] = await Promise.all([
      this.getNonce(),
      this.ethClient.getBytecode({ address: sender }),
    ]);

    return {
      nonce,
      initCode: code === undefined ? this.getInitCode() : "0x",
    };
  }

  getWaitTimeoutMs(): number {
    return this.waitTimeoutMs;
  }

  setWaitTimeoutMs(time: number): Instance<A, F> {
    this.waitTimeoutMs = time;
    return this;
  }

  getWaitIntervalMs(): number {
    return this.waitIntervalMs;
  }

  setWaitIntervalMs(time: number): Instance<A, F> {
    this.waitIntervalMs = time;
    return this;
  }

  getSalt(): bigint {
    return this.salt;
  }

  setSalt(salt: bigint): Instance<A, F> {
    this.salt = salt;
    this.sender = zeroAddress;
    this.initCode = "0x";
    return this;
  }

  getNonceKey(): bigint {
    return this.nonceKey;
  }

  setNonceKey(key: bigint): Instance<A, F> {
    this.nonceKey = key;
    return this;
  }

  async getNonce(): Promise<bigint> {
    return this.ethClient.readContract({
      address: this.entryPointAddress,
      abi: EntryPoint.CONTRACT_ABI,
      functionName: "getNonce",
      args: [await this.getSender(), this.nonceKey],
    });
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

  async getSender(): Promise<Address> {
    if (this.sender !== zeroAddress) {
      return this.sender;
    }

    try {
      await this.ethClient.simulateContract({
        address: this.entryPointAddress,
        abi: EntryPoint.CONTRACT_ABI,
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

  encodeCallData<M extends ExtractAbiFunctionNames<A>>(
    method: M,
    inputs: AbiParametersToPrimitiveTypes<ExtractAbiFunction<A, M>["inputs"]>,
  ): Instance<A, F> {
    // Casting is required since we extend the Abi type on the class definition.
    // It's ok here since typing has already been enforced on the public interface.
    this.callData = encodeFunctionData({
      abi: this.accountAbi as Abi,
      functionName: method as string,
      args: inputs as unknown[],
    });
    return this;
  }

  async buildUserOperation(): Promise<BuildUserOperationResponse> {
    const callData = this.callData;
    this.callData = "0x";

    const [sender, senderMeta, gasPrice, signature, chainId] =
      await Promise.all([
        this.getSender(),
        this.resolveSenderMeta(),
        this.requestGasPrice(),
        this.requestSignature("dummy", "0xdead"),
        this.ethClient.getChainId(),
      ]);
    const init: EntryPoint.UserOperation = {
      ...EntryPoint.DEFAULT_USEROP,
      sender,
      ...senderMeta,
      ...gasPrice,
      callData,
      signature,
    };

    const est = await this.requestGasValues(
      init,
      this.entryPointAddress,
      this.stateOverrideSet,
    );
    const useropWithGas: EntryPoint.UserOperation = { ...init, ...est };

    const pm =
      this.requestPaymaster != undefined
        ? await this.requestPaymaster(useropWithGas, this.entryPointAddress)
        : {};
    const userOpWithPM: EntryPoint.UserOperation = {
      ...useropWithGas,
      ...pm,
    };

    const userOpHash = EntryPoint.calculateUserOpHash(
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
        let receipt = null;
        const end = Date.now() + this.waitTimeoutMs;
        while (Date.now() < end) {
          receipt = await Bundler.GetUserOperationReceiptWithViem(
            this.ethClient,
            userOpHash,
          );
          if (receipt != null) {
            return receipt;
          }

          await new Promise((resolve) =>
            setTimeout(resolve, this.waitIntervalMs),
          );
        }

        return receipt;
      },
    };
  }
}
