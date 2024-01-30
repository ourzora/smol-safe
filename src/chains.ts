import { ContractNetworksConfig } from "@safe-global/protocol-kit";
import * as chains from "viem/chains";

const defaultL2Addresses = {
  multiSendAddress: "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761",
  safeMasterCopyAddress: "0x3E5c63644E683549055b9Be8653de26E0B4CD36E",
  safeProxyFactoryAddress: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2",
  multiSendCallOnlyAddress: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
  fallbackHandlerAddress: "0x1AC114C2099aFAf5261731655Dc6c306bFcd4Dbd",
  createCallAddress: "0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4",
  signMessageLibAddress: "0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2",
  safeSingletonAddress: "0x",
  simulateTxAccessorAddress: "0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da",
};

const baseL2Addresses = {
  multiSendAddress: "0x998739BFdAAdde7C933B942a68053933098f9EDa",
  safeMasterCopyAddress: "0x69f4D1788e39c87893C980c06EdF4b7f686e2938",
  safeProxyFactoryAddress: "0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC",
  multiSendCallOnlyAddress: "0xA1dabEF33b3B82c7814B6D82A79e50F4AC44102B",
  fallbackHandlerAddress: "0x017062a1dE2FE6b99BE3d9d37841FeD19F573804",
  createCallAddress: "0xB19D6FFc2182150F8Eb585b79D4ABcd7C5640A9d",
  signMessageLibAddress: "0x98FFBBF51bb33A056B08ddf711f289936AafF717",
  safeSingletonAddress: "0x",
  simulateTxAccessorAddress: "0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da",
};

export const contractNetworks: ContractNetworksConfig = {
  // // ZORA mainnet
  // [`${chains.zora.id}`]: defaultL2Addresses,
  // arbitrium sepolia
  // [`${chains.arbitrumSepolia.id}`]: baseL2Addresses,
  // sepolia testnet
  // [`${chains.sepolia.id}`]: sepoliaAddresses,
};

const pgn = {
  id: 424 as const,
  name: "PGN",
  network: "pgn",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.publicgoods.network"],
      webSocket: ["wss://rpc.publicgoods.network"],
    },
    public: {
      http: ["https://rpc.publicgoods.network"],
      webSocket: ["wss://rpc.publicgoods.network"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "Explorer",
      url: "https://explorer.publicgoods.network",
    },
    default: { name: "Explorer", url: "https://explorer.publicgoods.network" },
  },
};

export const allowedNetworks: { [chainId: number]: chains.Chain } = {
  [chains.zoraTestnet.id]: chains.zoraTestnet,
  [chains.zoraSepolia.id]: chains.zoraSepolia,
  [chains.arbitrumGoerli.id]: chains.arbitrumGoerli,
  [chains.arbitrumSepolia.id]: chains.arbitrumSepolia,
  [chains.arbitrumNova.id]: chains.arbitrumNova,
  [chains.arbitrum.id]: chains.arbitrum,
  [chains.base.id]: chains.base,
  [chains.baseSepolia.id]: chains.baseSepolia,
  [chains.sepolia.id]: chains.sepolia,
  [chains.optimism.id]: chains.optimism,
  [chains.optimismSepolia.id]: chains.optimismSepolia,
};

Object.keys(contractNetworks).map((network) => {
  if (allowedNetworks[+network]) {
    // if already exists skip
    return;
  }
  const viemChain = Object.values(chains).find(
    (chain) => chain.id.toString() === network
  );

  if (!viemChain) {
    return;
  }
  allowedNetworks[+network] = viemChain;
});
