import { Hex, Address, Hash, TransactionReceipt, Log } from "viem";

export interface UserOperationReceipt {
  userOpHash: Hash;
  sender: Address;
  paymaster: Address;
  nonce: Hex;
  success: boolean;
  actualGasCost: Hex;
  actualGasUsed: Hex;
  from: Address;
  receipt: TransactionReceipt;
  logs: Array<Log>;
}
