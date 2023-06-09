/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { Multisend, MultisendInterface } from "../Multisend";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "transactions",
        type: "bytes",
      },
    ],
    name: "multiSend",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export class Multisend__factory {
  static readonly abi = _abi;
  static createInterface(): MultisendInterface {
    return new utils.Interface(_abi) as MultisendInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Multisend {
    return new Contract(address, _abi, signerOrProvider) as Multisend;
  }
}
