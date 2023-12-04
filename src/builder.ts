import { BigNumberish, BytesLike, ethers } from "ethers";
import { OpToJSON } from "./utils";
import { UserOperationMiddlewareCtx } from "./context";
import {
  IUserOperation,
  StateOverrideSet,
  UserOperationMiddlewareFn,
} from "./types";

export const DEFAULT_VERIFICATION_GAS_LIMIT = ethers.BigNumber.from(70000);
export const DEFAULT_CALL_GAS_LIMIT = ethers.BigNumber.from(35000);
export const DEFAULT_PRE_VERIFICATION_GAS = ethers.BigNumber.from(21000);

export const DEFAULT_USER_OP: IUserOperation = {
  sender: ethers.constants.AddressZero,
  nonce: ethers.constants.Zero,
  initCode: ethers.utils.hexlify("0x"),
  callData: ethers.utils.hexlify("0x"),
  callGasLimit: DEFAULT_CALL_GAS_LIMIT,
  verificationGasLimit: DEFAULT_VERIFICATION_GAS_LIMIT,
  preVerificationGas: DEFAULT_PRE_VERIFICATION_GAS,
  maxFeePerGas: ethers.constants.Zero,
  maxPriorityFeePerGas: ethers.constants.Zero,
  paymasterAndData: ethers.utils.hexlify("0x"),
  signature: ethers.utils.hexlify("0x"),
};

export class UserOperationBuilder {
  private defaultOp: IUserOperation;
  private currOp: IUserOperation;
  private middlewareStack: Array<UserOperationMiddlewareFn>;

  constructor() {
    this.defaultOp = { ...DEFAULT_USER_OP };
    this.currOp = { ...this.defaultOp };
    this.middlewareStack = [];
  }

  private resolveFields(op: Partial<IUserOperation>): Partial<IUserOperation> {
    const obj = {
      sender:
        op.sender !== undefined
          ? ethers.utils.getAddress(op.sender)
          : undefined,
      nonce:
        op.nonce !== undefined ? ethers.BigNumber.from(op.nonce) : undefined,
      initCode:
        op.initCode !== undefined
          ? ethers.utils.hexlify(op.initCode)
          : undefined,
      callData:
        op.callData !== undefined
          ? ethers.utils.hexlify(op.callData)
          : undefined,
      callGasLimit:
        op.callGasLimit !== undefined
          ? ethers.BigNumber.from(op.callGasLimit)
          : undefined,
      verificationGasLimit:
        op.verificationGasLimit !== undefined
          ? ethers.BigNumber.from(op.verificationGasLimit)
          : undefined,
      preVerificationGas:
        op.preVerificationGas !== undefined
          ? ethers.BigNumber.from(op.preVerificationGas)
          : undefined,
      maxFeePerGas:
        op.maxFeePerGas !== undefined
          ? ethers.BigNumber.from(op.maxFeePerGas)
          : undefined,
      maxPriorityFeePerGas:
        op.maxPriorityFeePerGas !== undefined
          ? ethers.BigNumber.from(op.maxPriorityFeePerGas)
          : undefined,
      paymasterAndData:
        op.paymasterAndData !== undefined
          ? ethers.utils.hexlify(op.paymasterAndData)
          : undefined,
      signature:
        op.signature !== undefined
          ? ethers.utils.hexlify(op.signature)
          : undefined,
    };
    return Object.keys(obj).reduce(
      (prev, curr) =>
        (obj as any)[curr] !== undefined
          ? { ...prev, [curr]: (obj as any)[curr] }
          : prev,
      {}
    );
  }

  getSender() {
    return this.currOp.sender;
  }
  getNonce() {
    return this.currOp.nonce;
  }
  getInitCode() {
    return this.currOp.initCode;
  }
  getCallData() {
    return this.currOp.callData;
  }
  getCallGasLimit() {
    return this.currOp.callGasLimit;
  }
  getVerificationGasLimit() {
    return this.currOp.verificationGasLimit;
  }
  getPreVerificationGas() {
    return this.currOp.preVerificationGas;
  }
  getMaxFeePerGas() {
    return this.currOp.maxFeePerGas;
  }
  getMaxPriorityFeePerGas() {
    return this.currOp.maxPriorityFeePerGas;
  }
  getPaymasterAndData() {
    return this.currOp.paymasterAndData;
  }
  getSignature() {
    return this.currOp.signature;
  }
  getOp() {
    return this.currOp;
  }

  setSender(val: string) {
    this.currOp.sender = ethers.utils.getAddress(val);
    return this;
  }
  setNonce(val: BigNumberish) {
    this.currOp.nonce = ethers.BigNumber.from(val);
    return this;
  }
  setInitCode(val: BytesLike) {
    this.currOp.initCode = ethers.utils.hexlify(val);
    return this;
  }
  setCallData(val: BytesLike) {
    this.currOp.callData = ethers.utils.hexlify(val);
    return this;
  }
  setCallGasLimit(val: BigNumberish) {
    this.currOp.callGasLimit = ethers.BigNumber.from(val);
    return this;
  }
  setVerificationGasLimit(val: BigNumberish) {
    this.currOp.verificationGasLimit = ethers.BigNumber.from(val);
    return this;
  }
  setPreVerificationGas(val: BigNumberish) {
    this.currOp.preVerificationGas = ethers.BigNumber.from(val);
    return this;
  }
  setMaxFeePerGas(val: BigNumberish) {
    this.currOp.maxFeePerGas = ethers.BigNumber.from(val);
    return this;
  }
  setMaxPriorityFeePerGas(val: BigNumberish) {
    this.currOp.maxPriorityFeePerGas = ethers.BigNumber.from(val);
    return this;
  }
  setPaymasterAndData(val: BytesLike) {
    this.currOp.paymasterAndData = ethers.utils.hexlify(val);
    return this;
  }
  setSignature(val: BytesLike) {
    this.currOp.signature = ethers.utils.hexlify(val);
    return this;
  }
  setPartial(partialOp: Partial<IUserOperation>) {
    this.currOp = { ...this.currOp, ...this.resolveFields(partialOp) };
    return this;
  }

  useDefaults(partialOp: Partial<IUserOperation>) {
    const resolvedOp = this.resolveFields(partialOp);
    this.defaultOp = { ...this.defaultOp, ...resolvedOp };
    this.currOp = { ...this.currOp, ...resolvedOp };

    return this;
  }
  resetDefaults() {
    this.defaultOp = { ...DEFAULT_USER_OP };
    return this;
  }

  useMiddleware(fn: UserOperationMiddlewareFn) {
    this.middlewareStack = [...this.middlewareStack, fn];
    return this;
  }
  resetMiddleware() {
    this.middlewareStack = [];
    return this;
  }

  async buildOp(
    entryPoint: string,
    chainId: BigNumberish,
    stateOverrides?: StateOverrideSet
  ) {
    const ctx = new UserOperationMiddlewareCtx(
      this.currOp,
      entryPoint,
      chainId,
      stateOverrides
    );

    for (const fn of this.middlewareStack) {
      await fn(ctx);
    }
    this.setPartial(ctx.op);

    return OpToJSON(this.currOp);
  }

  resetOp() {
    this.currOp = { ...this.defaultOp };
    return this;
  }
}
