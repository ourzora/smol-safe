import { ContractNetworksConfig } from "@safe-global/protocol-kit";
import { ContractNetworkConfig } from "@safe-global/protocol-kit/dist/src/types";
import * as chains from "viem/chains";

const defaultL2Addresses: ContractNetworkConfig = {
  multiSendAddress: "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761",
  safeProxyFactoryAddress: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2",
  multiSendCallOnlyAddress: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
  fallbackHandlerAddress: "0x1AC114C2099aFAf5261731655Dc6c306bFcd4Dbd",
  createCallAddress: "0x7cbB62EaA69F79e6873cD1ecB2392971036cFAa4",
  signMessageLibAddress: "0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2",
  // renamed from safeMasterCopyAddress
  safeSingletonAddress: "0x3E5c63644E683549055b9Be8653de26E0B4CD36E",
  simulateTxAccessorAddress: "0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da",
};

const zkAddresses: ContractNetworkConfig = {
  multiSendAddress: "0x0dFcccB95225ffB03c6FBB2559B530C2B7C8A912",
  safeProxyFactoryAddress: "0xDAec33641865E4651fB43181C6DB6f7232Ee91c2",
  multiSendCallOnlyAddress: "0xf220D3b4DFb23C4ade8C88E526C1353AbAcbC38F",
  fallbackHandlerAddress: "0x2f870a80647BbC554F3a0EBD093f11B4d2a7492A",
  createCallAddress: "0xcB8e5E438c5c2b45FbE17B02Ca9aF91509a8ad56",
  signMessageLibAddress: "0x357147caf9C0cCa67DfA0CF5369318d8193c8407",
  // renamed from safeMasterCopyAddress
  safeSingletonAddress: "0x1727c2c531cf966f902E5927b98490fDFb3b2b70",
  simulateTxAccessorAddress: "0x4191E2e12E8BC5002424CE0c51f9947b02675a44",
};

const plumeAddresses: ContractNetworkConfig = {
  multiSendAddress: "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526",
  safeProxyFactoryAddress: "0x4e1dcf7ad4e460cfd30791ccc4f9c8a4f820ec67",
  multiSendCallOnlyAddress: "0x9641d764fc13c8b624c04430c7356c1c7c8102e2",
  fallbackHandlerAddress: "0xfd0732dc9e303f09fcef3a7388ad10a83459ec99",
  createCallAddress: "0x9b35af71d77eaf8d7e40252370304687390a1a52",
  signMessageLibAddress: "0xd53cd0ab83d845ac265be939c57f53ad838012c9",

  safeSingletonAddress: "0x41675c099f32341bf84bfc5382af534df5c7461a",
  simulateTxAccessorAddress: "0x3d4ba2e0884aa488718476ca2fb8efc291a46199",
};

// Example how to add new networks before they are merged and released from `safe-global/safe-deployments` package.
export const contractNetworks: ContractNetworksConfig = {
  [`${chains.zoraSepolia.id}`]: defaultL2Addresses,
  [`${chains.blastSepolia.id}`]: defaultL2Addresses,
  [`${chains.optimismSepolia.id}`]: defaultL2Addresses,
  [`${chains.blast.id}`]: defaultL2Addresses,
  [`${chains.zksyncSepoliaTestnet.id}`]: zkAddresses,
  [`${chains.zksync.id}`]: zkAddresses,
  [`${chains.abstractTestnet.id}`]: zkAddresses,
  [`${chains.plume.id}`]: plumeAddresses,
};

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
  [chains.blast.id]: chains.blast,
  [chains.zksync.id]: chains.zkSync,
  [chains.zksyncSepoliaTestnet.id]: chains.zksyncSepoliaTestnet,
  [chains.plume.id]: chains.plume,
};

Object.keys(contractNetworks).map((network) => {
  if (allowedNetworks[+network]) {
    // if already exists skip
    return;
  }
  const viemChain = Object.values(chains).find(
    (chain) => chain.id.toString() === network,
  );

  if (!viemChain) {
    return;
  }
  allowedNetworks[+network] = viemChain;
});
