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
  safeSingletonAddress: "0x3E5c63644E683549055b9Be8653de26E0B4CD36E",
  simulateTxAccessorAddress: "0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da",
};

// Example how to add new networks before they are merged and released from `safe-global/safe-deployments` package.
export const contractNetworks: ContractNetworksConfig = {
  [`${chains.zoraSepolia.id}`]: defaultL2Addresses,
  [`${chains.blastSepolia.id}`]: defaultL2Addresses,
  [`${chains.optimismSepolia.id}`]: defaultL2Addresses,
};

// const blastSepolia = {
//   id: 168587773 as const,
//   name: "Blast Sepolia",
//   network: "blast-sepolia",
//   nativeCurrency: {
//     decimals: 18,
//     name: "Ether",
//     symbol: "ETH",
//   },
//   rpcUrls: {
//     default: {
//       http: ["https://sepolia.blast.io"],
//     },
//     public: {
//       http: ["https://sepolia.blast.io"],
//     },
//   },
//   blockExplorers: {
//     etherscan: {
//       name: "Explorer",
//       url: "https://testnet.blastscan.io",
//     },
//     default: { name: "Explorer", url: "https://testnet.blastscan.io" },
//   },
// };

export const allowedNetworks: { [chainId: number]: chains.Chain } = {
  [chains.zora.id]: chains.zora,
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
  [chains.blastSepolia.id]: chains.blastSepolia,
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
