import Safe from "@safe-global/protocol-kit";
import { BrowserProvider } from "ethers";
import { Address } from "viem";

export type SafeInformationType = {
  owners: string[];
  threshold: number;
  chainId: number;
  nonce: number;
  address: Address;
  safeSdk: Safe;
  safeSdk2: Safe;
};

export interface NetworkContext {
  walletProvider: BrowserProvider;
  currentNetwork: number;
  
}

export interface SafeContext {
  safeInformation: SafeInformationType;
}
