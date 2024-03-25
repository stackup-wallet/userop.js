import {
  Address,
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
} from "viem";
import { localhost } from "viem/chains";

export const maintainEthBalance = async (to: Address, balance: string) => {
  const client = createPublicClient({
    chain: localhost,
    transport: http("http://localhost:8545"),
  });
  const curr = await client.getBalance({ address: to });
  const target = parseEther(balance);
  if (curr >= target) {
    return;
  }

  const value = target - curr;
  const signer = createWalletClient({
    chain: localhost,
    transport: http("http://localhost:8545"),
  });
  const [account] = await signer.getAddresses();
  return signer.sendTransaction({ account, to, value });
};
